(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const pdfUrl = config.pdfDownloadUrl;
  const pageNodes = [1, 2].map(number => ({
    number,
    root: document.getElementById("pdf-page-" + number),
    canvas: document.querySelector("#pdf-page-" + number + " canvas"),
    layer: document.querySelector("#pdf-page-" + number + " .textLayer"),
    highlightLayer: document.querySelector("#pdf-page-" + number + " .sentence-highlight-layer"),
    activeWordMark: null,
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
  let currentWordIndex = 0;
  let queueToken = 0;
  let pdfDocument = null;
  let resizeHandle = 0;
  let lastWidth = 0;
  let selectionAtPointerDown = "";

  const setStatus = message => { if (status) status.textContent = message; };
  const setButtons = enabled => {
    [playButton, pauseButton, resumeButton, stopButton].forEach(button => {
      if (button) button.disabled = !enabled;
    });
  };
  const normalizeToken = value => String(value || "")
    .replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/[’‘]/g, "'").toLowerCase();
  const tokenPattern = /[a-z0-9ﬁﬂ]+(?:['’][a-zﬁﬂ]+)?/gi;
  const sentenceTokens = value => (String(value || "").match(tokenPattern) || []).map(normalizeToken);

  function makeItemTokens(items, textDivs) {
    const tokens = [];
    items.forEach((item, itemIndex) => {
      // Offsets must be measured against the exact text PDF.js rendered into
      // the selectable text layer, not the source item's pre-render string.
      const value = String(textDivs[itemIndex]?.textContent ?? item.str ?? "");
      for (const match of value.matchAll(tokenPattern)) {
        tokens.push({
          token: normalizeToken(match[0]),
          itemIndex,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    return tokens;
  }

  function locateSentenceTokens(sentence, tokens) {
    const wanted = sentenceTokens(sentence.text);
    if (!wanted.length) return [];
    for (let start = 0; start <= tokens.length - wanted.length; start++) {
      let matched = true;
      for (let offset = 0; offset < wanted.length; offset++) {
        if (tokens[start + offset].token !== wanted[offset]) {
          matched = false;
          break;
        }
      }
      if (matched) return tokens.slice(start, start + wanted.length);
    }
    return [];
  }

  async function renderPage(pageInfo) {
    const page = await pdfDocument.getPage(pageInfo.number);
    const width = Math.max(260, (pageInfo.root.parentElement?.clientWidth || 900) - 28);
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
    pageInfo.highlightLayer.style.width = viewport.width + "px";
    pageInfo.highlightLayer.style.height = viewport.height + "px";
    pageInfo.layer.replaceChildren();
    pageInfo.highlightLayer.replaceChildren();

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
    textDivs.forEach((div, index) => { div.dataset.pdfItemIndex = String(index); });
    pageInfo.model = {
      page,
      viewport,
      items: textContent.items,
      textDivs,
      tokens: makeItemTokens(textContent.items, textDivs),
      sentenceMatches: new Map()
    };
    sentences.forEach((sentence, index) => {
      if (Number(sentence.page) !== pageInfo.number) return;
      const match = locateSentenceTokens(sentence, pageInfo.model.tokens);
      if (match.length) pageInfo.model.sentenceMatches.set(index, match);
    });
  }

  function clearHighlight() {
    pageNodes.forEach(info => {
      info.activeWordMark?.remove();
      info.activeWordMark = null;
      info.highlightLayer?.replaceChildren();
    });
  }

  function addWordHighlight(pageInfo, token) {
    const span = pageInfo.model.textDivs[token.itemIndex];
    const textNode = span?.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE ||
        token.start < 0 || token.end > textNode.length || token.end <= token.start) return false;
    const range = document.createRange();
    try {
      range.setStart(textNode, token.start);
      range.setEnd(textNode, token.end);
      const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
      if (!rects.length) return false;

      // Measure the selected source characters in viewport CSS pixels, then
      // translate them into the page's own coordinate space. This avoids
      // modifying PDF.js text spans or inheriting their inline transforms.
      const pageRect = pageInfo.root.getBoundingClientRect();
      const group = document.createElement("span");
      group.className = "active-spoken-word";
      group.dataset.word = range.toString();
      group.dataset.itemIndex = String(token.itemIndex);
      group.dataset.start = String(token.start);
      group.dataset.end = String(token.end);
      rects.forEach(rect => {
        const fragment = document.createElement("span");
        fragment.className = "spoken-word-fragment";
        fragment.style.left = (rect.left - pageRect.left) + "px";
        fragment.style.top = (rect.top - pageRect.top) + "px";
        fragment.style.width = rect.width + "px";
        fragment.style.height = rect.height + "px";
        group.appendChild(fragment);
      });
      pageInfo.highlightLayer.appendChild(group);
      pageInfo.activeWordMark = group;
      return true;
    } catch {
      return false;
    }
  }

  function highlightSpokenWord(sentenceIndex, wordIndex) {
    clearHighlight();
    const sentence = sentences[sentenceIndex];
    if (!sentence) return false;
    const pageInfo = pageNodes.find(info => info.number === Number(sentence.page));
    const tokens = pageInfo?.model?.sentenceMatches.get(sentenceIndex);
    if (!pageInfo || !tokens?.length || wordIndex < 0 || wordIndex >= tokens.length) return false;
    const success = addWordHighlight(pageInfo, tokens[wordIndex]);
    if (!success) {
      setStatus("تعذر تحديد موضع الكلمة الحالية بدقة في الصفحة الأصلية.");
      return false;
    }
    currentWordIndex = wordIndex;
    return true;
  }

  function highlightSentence(index) {
    // Before the first speech boundary, show only the first spoken word.
    return highlightSpokenWord(index, 0);
  }

  function spokenWordIndex(sentenceText, charIndex) {
    const pattern = /[a-z0-9ﬁﬂ]+(?:['’][a-zﬁﬂ]+)?/gi;
    const matches = Array.from(String(sentenceText || "").matchAll(pattern));
    if (!matches.length) return -1;
    const position = Math.max(0, Number(charIndex) || 0);
    let found = matches.findIndex(match => position >= match.index && position < match.index + match[0].length);
    if (found < 0) found = matches.findIndex(match => match.index >= position);
    return found < 0 ? matches.length - 1 : found;
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
    utterance.onstart = () => {
      if (token === queueToken) highlightSpokenWord(index, 0);
    };
    utterance.onboundary = event => {
      if (token !== queueToken || event.name !== "word") return;
      const wordIndex = spokenWordIndex(sentences[index].text, event.charIndex);
      if (wordIndex >= 0) highlightSpokenWord(index, wordIndex);
    };
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

  function handlePageTap(pageInfo, event) {
    if (!supported || !pageInfo.model) return;
    const currentSelection = window.getSelection()?.toString() || "";
    if (currentSelection && currentSelection !== selectionAtPointerDown) return;

    let span = null;
    let offset = -1;
    const caretPosition = document.caretPositionFromPoint?.(event.clientX, event.clientY);
    if (caretPosition) {
      const node = caretPosition.offsetNode;
      const candidate = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      if (candidate && pageInfo.layer.contains(candidate)) {
        span = candidate.closest(".textLayer span");
        offset = caretPosition.offset;
      }
    }
    if (!span) {
      const caretRange = document.caretRangeFromPoint?.(event.clientX, event.clientY);
      if (caretRange) {
        const node = caretRange.startContainer;
        const candidate = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        if (candidate && pageInfo.layer.contains(candidate)) {
          span = candidate.closest(".textLayer span");
          offset = caretRange.startOffset;
        }
      }
    }
    // Some browsers do not expose caret hit-testing; use the topmost PDF.js span as a fallback.
    if (!span) span = event.target.closest(".textLayer span");
    if (!span || !pageInfo.layer.contains(span)) return;
    const itemIndex = pageInfo.model.textDivs.indexOf(span);
    if (itemIndex < 0) return;

    let candidateIndex = -1;
    for (const [sentenceIndex, tokens] of pageInfo.model.sentenceMatches) {
      const token = tokens.find(item => item.itemIndex === itemIndex &&
        (offset < 0 || (item.start <= offset && offset < item.end)));
      if (token) {
        candidateIndex = sentenceIndex;
        break;
      }
      if (candidateIndex < 0 && tokens.some(item => item.itemIndex === itemIndex)) {
        candidateIndex = sentenceIndex;
      }
    }
    if (candidateIndex >= 0) startAt(candidateIndex);
  }

  async function initialize() {
    if (!window.pdfjsLib || !pdfUrl) {
      setStatus("تعذر تشغيل عارض صفحات الكتاب. افتح ملف الكتاب الأصلي من الرابط أعلاه.");
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
      if (pdfDocument.numPages < 2) throw new Error("ملف المصدر لا يحتوي على الصفحتين المطلوبتين.");
      for (const pageInfo of pageNodes) await renderPage(pageInfo);
      const missing = sentences.filter(sentence => {
        const info = pageNodes.find(item => item.number === Number(sentence.page));
        return !info?.model || !locateSentenceTokens(sentence, info.model.tokens).length;
      });
      setButtons(supported);
      getRate();
      if (missing.length) {
        setStatus("تم عرض الصفحتين الأصليتين. تعذر ربط " + missing.length +
          " جمل بمواضعها النصية؛ لن يظهر لها تظليل تخميني.");
      } else if (!supported) {
        setStatus("الصفحتان الأصليتان جاهزتان. يمكنك الضغط على النص لتحديد الجملة، لكن هذا المتصفح لا يدعم النطق الصوتي.");
      } else {
        setStatus("الصفحتان الأصليتان جاهزتان. اضغط أي جملة في الصفحة للاستماع إليها، أو استخدم أزرار التشغيل.");
      }
      pageNodes.forEach(info => {
        info.layer.addEventListener("pointerdown", () => {
          selectionAtPointerDown = window.getSelection()?.toString() || "";
        }, { passive: true });
        info.layer.addEventListener("click", event => handlePageTap(info, event));
      });
      const hash = decodeURIComponent(location.hash.slice(1));
      if (hash.startsWith("sentence-")) {
        const id = hash.slice("sentence-".length);
        const index = sentences.findIndex(sentence => sentence.id === id);
        if (index >= 0 && supported) startAt(index);
        else if (index >= 0) setStatus("تم فتح موضع الجملة في الكتاب. النطق غير مدعوم في هذا المتصفح.");
      }
      lastWidth = Math.max(260, (pageNodes[0].root.parentElement?.clientWidth || 900) - 28);
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
      const width = Math.max(260, (pageNodes[0].root.parentElement?.clientWidth || 900) - 28);
      if (Math.abs(width - lastWidth) < 4) return;
      lastWidth = width;
      try {
        for (const pageInfo of pageNodes) await renderPage(pageInfo);
        if (currentIndex >= 0) highlightSpokenWord(currentIndex, currentWordIndex);
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