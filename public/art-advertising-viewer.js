(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const pdfUrl = config.pdfDownloadUrl;
  const pageNodes = [1, 2].map(number => ({
    number,
    root: document.getElementById("pdf-page-" + number),
    canvas: document.querySelector("#pdf-page-" + number + " canvas"),
    layer: document.querySelector("#pdf-page-" + number + " .textLayer"),
    model: null
  }));
  const status = document.getElementById("speech-status");
  const speed = document.getElementById("speech-speed");
  const speedValue = document.getElementById("speed-value");
  const playButton = document.getElementById("play-reading");
  const pauseButton = document.getElementById("pause-reading");
  const resumeButton = document.getElementById("resume-reading");
  const stopButton = document.getElementById("stop-reading");
  const sentences = Array.isArray(config.passageSentences) ? config.passageSentences : [];
  const supported = "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";
  const synth = supported ? window.speechSynthesis : null;
  let currentIndex = -1;
  let queueToken = 0;
  let pdfDocument = null;
  let resizeHandle = 0;
  let lastWidth = 0;

  const setStatus = message => { if (status) status.textContent = message; };
  const setButtons = enabled => {
    [playButton, pauseButton, resumeButton, stopButton].forEach(button => {
      if (button) button.disabled = !enabled;
    });
  };
  const normalizedTokens = value => String(value || "")
    .replace(/ﬁ/g, "fi").replace(/[’‘]/g, "'").toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
  const makeItemTokens = items => {
    const tokens = [];
    items.forEach((item, itemIndex) => {
      normalizedTokens(item.str).forEach(token => tokens.push({ token, itemIndex }));
    });
    return tokens;
  };
  const locateSentenceItems = (sentence, tokens) => {
    const wanted = normalizedTokens(sentence.text);
    if (!wanted.length) return [];
    for (let start = 0; start <= tokens.length - wanted.length; start++) {
      let matched = true;
      for (let offset = 0; offset < wanted.length; offset++) {
        if (tokens[start + offset].token !== wanted[offset]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        return [...new Set(tokens.slice(start, start + wanted.length).map(token => token.itemIndex))];
      }
    }
    return [];
  };

  async function renderPage(pageInfo) {
    const page = await pdfDocument.getPage(pageInfo.number);
    const width = Math.max(280, pageInfo.root.clientWidth || 900);
    const base = page.getViewport({ scale: 1 });
    const scale = width / base.width;
    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = pageInfo.canvas;
    const context = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.ceil(viewport.width * outputScale);
    canvas.height = Math.ceil(viewport.height * outputScale);
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";
    pageInfo.root.style.width = viewport.width + "px";
    pageInfo.root.style.height = viewport.height + "px";
    pageInfo.layer.style.width = viewport.width + "px";
    pageInfo.layer.style.height = viewport.height + "px";
    pageInfo.layer.replaceChildren();

    await page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0]
    }).promise;

    const textContent = await page.getTextContent();
    const textDivs = [];
    const textLayerTask = window.pdfjsLib.renderTextLayer({
      textContent,
      container: pageInfo.layer,
      viewport,
      textDivs
    });
    await textLayerTask.promise;
    pageInfo.model = {
      page,
      viewport,
      items: textContent.items,
      textDivs,
      tokens: makeItemTokens(textContent.items)
    };
  }

  function clearHighlight() {
    pageNodes.forEach(info => {
      info.layer.querySelectorAll(".sentence-speaking").forEach(node => {
        node.classList.remove("sentence-speaking");
      });
    });
  }

  function highlightSentence(index) {
    clearHighlight();
    const sentence = sentences[index];
    if (!sentence) return false;
    const pageInfo = pageNodes.find(info => info.number === Number(sentence.page));
    if (!pageInfo || !pageInfo.model) return false;
    const itemIndexes = locateSentenceItems(sentence, pageInfo.model.tokens);
    const spans = itemIndexes.map(itemIndex => pageInfo.model.textDivs[itemIndex]).filter(Boolean);
    if (!spans.length) {
      setStatus("تعذر تحديد موضع إحدى الجمل في طبقة النص لهذه الصفحة.");
      return false;
    }
    spans.forEach(span => span.classList.add("sentence-speaking"));
    const first = spans[0];
    const pageRect = pageInfo.root.getBoundingClientRect();
    const spanRect = first.getBoundingClientRect();
    if (spanRect.top < pageRect.top || spanRect.bottom > pageRect.bottom) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return true;
  }

  const getRate = () => {
    const rate = Math.min(1, Math.max(0.25, Number(speed?.value || 1)));
    if (speedValue) speedValue.value = rate.toFixed(2) + "×";
    return rate;
  };

  function speakFrom(index, token) {
    if (!supported || token !== queueToken || index >= sentences.length) {
      if (index >= sentences.length) {
        currentIndex = -1;
        clearHighlight();
        setStatus("انتهى الاستماع إلى القطعة كاملة.");
      }
      return;
    }
    currentIndex = index;
    if (!highlightSentence(index)) return;
    const utterance = new SpeechSynthesisUtterance(sentences[index].text);
    utterance.lang = "en-US";
    utterance.rate = getRate();
    utterance.onend = () => {
      if (token === queueToken) speakFrom(index + 1, token);
    };
    utterance.onerror = event => {
      if (token !== queueToken || event.error === "canceled" || event.error === "interrupted") return;
      setStatus("توقف النطق بسبب مشكلة في خدمة الصوت. يمكنك الضغط على تشغيل للمحاولة مجددًا.");
    };
    setStatus("يُنطق النص الأصلي — الجملة " + (index + 1) + " من " + sentences.length + ".");
    synth.speak(utterance);
  }

  function startAt(index) {
    if (!supported || !pdfDocument || !sentences.length) return;
    queueToken++;
    synth.cancel();
    speakFrom(Math.max(0, index), queueToken);
  }

  async function initialize() {
    if (!window.pdfjsLib || !pdfUrl) {
      setStatus("تعذر تشغيل عارض صفحات الكتاب. افتح ملف الكتاب الأصلي من الرابط أعلاه.");
      return;
    }
    if (!supported) {
      setStatus("هذا المتصفح لا يدعم النطق الصوتي. يمكنك عرض صفحات الكتاب الأصلية.");
      return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    try {
      setStatus("جارٍ تحميل ملف الكتاب الأصلي…");
      pdfDocument = await window.pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
        disableRange: true,
        disableStream: true
      }).promise;
      if (pdfDocument.numPages < 2) {
        throw new Error("ملف المصدر لا يحتوي على الصفحتين المطلوبتين.");
      }
      for (const pageInfo of pageNodes) await renderPage(pageInfo);
      const missing = sentences.filter(sentence => {
        const info = pageNodes.find(item => item.number === Number(sentence.page));
        return !info?.model || !locateSentenceItems(sentence, info.model.tokens).length;
      });
      setButtons(true);
      getRate();
      if (missing.length) {
        setStatus("تم عرض الصفحتين الأصليتين. تعذر ربط " + missing.length +
          " جمل بمواضعها النصية؛ لن يتم عرض تظليل تخميني.");
      } else {
        setStatus("الصفحتان الأصليتان جاهزتان. سيظهر التظليل فوق الجملة نفسها أثناء النطق.");
      }
      const hash = decodeURIComponent(location.hash.slice(1));
      if (hash.startsWith("sentence-")) {
        const id = hash.slice("sentence-".length);
        const index = sentences.findIndex(sentence => sentence.id === id);
        if (index >= 0) startAt(index);
      }
      lastWidth = pageNodes[0].root.clientWidth;
    } catch (error) {
      console.error("Original textbook PDF could not be rendered:", error);
      setStatus("تعذر تحميل ملف الكتاب داخل العارض. افتح ملف الكتاب الأصلي من الرابط أعلاه؛ لم نعرض نصًا بديلًا.");
      setButtons(false);
    }
  }

  playButton?.addEventListener("click", () => startAt(0));
  pauseButton?.addEventListener("click", () => {
    if (synth?.speaking) {
      synth.pause();
      setStatus("الصوت متوقف مؤقتًا. اضغط متابعة للاستكمال.");
    }
  });
  resumeButton?.addEventListener("click", () => {
    if (synth?.paused) {
      synth.resume();
      setStatus("تمت متابعة النطق.");
    }
  });
  stopButton?.addEventListener("click", () => {
    queueToken++;
    synth?.cancel();
    currentIndex = -1;
    clearHighlight();
    setStatus("تم إيقاف الاستماع.");
  });
  speed?.addEventListener("input", () => {
    const rate = getRate();
    if (currentIndex >= 0 && synth?.speaking) {
      setStatus("تم تغيير السرعة. أُعيد تشغيل الجملة الحالية بالسرعة الجديدة.");
      startAt(currentIndex);
    } else {
      setStatus("سرعة الصوت: " + rate.toFixed(2) + "×.");
    }
  });
  window.addEventListener("resize", () => {
    if (!pdfDocument) return;
    window.clearTimeout(resizeHandle);
    resizeHandle = window.setTimeout(async () => {
      const width = pageNodes[0].root.clientWidth;
      if (Math.abs(width - lastWidth) < 4) return;
      lastWidth = width;
      try {
        for (const pageInfo of pageNodes) await renderPage(pageInfo);
        if (currentIndex >= 0) highlightSentence(currentIndex);
      } catch (error) {
        console.error("Page resize failed:", error);
      }
    }, 180);
  });
  window.playEvidenceSentence = id => {
    const index = sentences.findIndex(sentence => String(sentence.id) === String(id));
    if (index >= 0) startAt(index);
  };
  getRate();
  initialize();
})();