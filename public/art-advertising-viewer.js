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
    // PDF.js 3.11 reads this CSS variable while laying out text spans.
    // Keep it identical to the viewport scale for accurate source geometry.
    pageInfo.layer.style.setProperty("--scale-factor", String(viewport.scale));
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
      const canvasRect = pageInfo.canvas.getBoundingClientRect();
      const scaleX = pageInfo.canvas.width / canvasRect.width;
      const scaleY = pageInfo.canvas.height / canvasRect.height;
      const group = document.createElement("span");
      group.className = "active-spoken-word";
      group.dataset.word = range.toString();
      group.dataset.itemIndex = String(token.itemIndex);
      group.dataset.start = String(token.start);
      group.dataset.end = String(token.end);
      rects.forEach(rect => {
        // DOM Range rectangles follow the PDF.js text line box, which can be
        // much taller than the printed glyphs. Tighten the box against the
        // actual pixels rendered from the original Google Drive PDF.
        const x0 = Math.max(0, Math.floor((rect.left - canvasRect.left) * scaleX));
        const y0 = Math.max(0, Math.floor((rect.top - canvasRect.top) * scaleY));
        const x1 = Math.min(pageInfo.canvas.width, Math.ceil((rect.right - canvasRect.left) * scaleX));
        const y1 = Math.min(pageInfo.canvas.height, Math.ceil((rect.bottom - canvasRect.top) * scaleY));
        if (x1 <= x0 || y1 <= y0) return;
        const pixels = pageInfo.canvas.getContext("2d", { willReadFrequently: true })
          .getImageData(x0, y0, x1 - x0, y1 - y0);
        let minX = x1 - x0, minY = y1 - y0, maxX = -1, maxY = -1;
        for (let y = 0; y < pixels.height; y++) {
          for (let x = 0; x < pixels.width; x++) {
            const offset = (y * pixels.width + x) * 4;
            const luminance = (pixels.data[offset] * 0.299) +
              (pixels.data[offset + 1] * 0.587) + (pixels.data[offset + 2] * 0.114);
            if (pixels.data[offset + 3] > 0 && luminance < 225) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < minX || maxY < minY) return;
        // One device-pixel breathing room keeps the yellow mark visible
        // without inheriting the PDF text line's excessive vertical metrics.
        const left = canvasRect.left + (x0 + minX) / scaleX;
        const top = canvasRect.top + (y0 + minY) / scaleY;
        const right = canvasRect.left + (x0 + maxX + 1) / scaleX;
        const bottom = canvasRect.top + (y0 + maxY + 1) / scaleY;
        const fragment = document.createElement("span");
        fragment.className = "spoken-word-fragment";
        fragment.style.left = (left - pageRect.left - 1) + "px";
        fragment.style.top = (top - pageRect.top - 1) + "px";
        fragment.style.width = (right - left + 2) + "px";
        fragment.style.height = (bottom - top + 2) + "px";
        group.appendChild(fragment);
      });
      if (!group.childElementCount) return false;
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

  function speakFrom(index, token, startWordIndex = 0) {
    if (!supported || token !== queueToken || index >= sentences.length) {
      if (index >= sentences.length) {
        currentIndex = -1;
        clearHighlight();
        setStatus("انتهى الاستماع إلى القطعة كاملة.");
      }
      return;
    }
    currentIndex = index;
    const sentenceText = sentences[index].text;
    const words = Array.from(sentenceText.matchAll(/[a-z0-9ﬁﬂ]+(?:['’][a-zﬁﬂ]+)?/gi));
    const firstWord = words[startWordIndex];
    if (!firstWord || !highlightSpokenWord(index, startWordIndex)) return;

    // Start the utterance at the tapped word itself. Speech boundary offsets
    // are relative to this substring, so translate them back to sentence offsets.
    const startChar = firstWord.index;
    const spokenText = sentenceText.slice(startChar);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "en-US";
    utterance.rate = getRate();
    utterance.onstart = () => {
      if (token === queueToken) highlightSpokenWord(index, startWordIndex);
    };
    utterance.onboundary = event => {
      if (token !== queueToken || event.name !== "word") return;
      const wordIndex = spokenWordIndex(sentenceText, startChar + event.charIndex);
      if (wordIndex >= startWordIndex) highlightSpokenWord(index, wordIndex);
    };
    utterance.onend = () => {
      if (token === queueToken) speakFrom(index + 1, token, 0);
    };
    utterance.onerror = event => {
      if (token !== queueToken || event.error === "canceled" || event.error === "interrupted") return;
      setStatus("توقف النطق بسبب مشكلة في خدمة الصوت. يمكنك الضغط على تشغيل للمحاولة مجددًا.");
    };
    setStatus("يُنطق النص الأصلي من الكلمة المحددة — الجملة " + (index + 1) + " من " + sentences.length + ".");
    synth.speak(utterance);
  }

  function startAt(index, wordIndex = 0) {
    if (!supported || !pdfDocument || !sentences.length) return;
    queueToken++;
    synth.cancel();
    speakFrom(Math.max(0, index), queueToken, Math.max(0, wordIndex));
  }

  function handlePageTap(pageInfo, event) {
    if (!supported || !pageInfo.model) return;

    // Resolve the touched PDF.js source item from the physical viewport
    // coordinates. Mobile Safari may retarget a touch-generated click to a
    // wrapper/canvas rather than the underlying text span, so event.target is
    // not a reliable source of text identity.
    let targetSpan = null;
    let targetSpanScore = Infinity;
    for (const span of pageInfo.layer.querySelectorAll("span[data-pdf-item-index]")) {
      for (const rect of span.getClientRects()) {
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) continue;
        const score = Math.hypot(
          event.clientX - (rect.left + rect.right) / 2,
          event.clientY - (rect.top + rect.bottom) / 2
        );
        if (score < targetSpanScore) {
          targetSpanScore = score;
          targetSpan = span;
        }
      }
    }
    if (!targetSpan) return;
    const itemIndex = Number(targetSpan.dataset.pdfItemIndex);
    if (!Number.isInteger(itemIndex)) return;

    let selected = null;
    let selectedScore = Infinity;
    for (const [sentenceIndex, tokens] of pageInfo.model.sentenceMatches) {
      for (let wordIndex = 0; wordIndex < tokens.length; wordIndex++) {
        const token = tokens[wordIndex];
        if (token.itemIndex !== itemIndex) continue;
        const span = pageInfo.model.textDivs[token.itemIndex];
        const textNode = span?.firstChild;
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE ||
            token.start < 0 || token.end > textNode.length || token.end <= token.start) continue;

        const range = document.createRange();
        try {
          range.setStart(textNode, token.start);
          range.setEnd(textNode, token.end);
        } catch {
          continue;
        }
        const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        for (const rect of rects) {
          const dx = event.clientX < rect.left ? rect.left - event.clientX :
            event.clientX > rect.right ? event.clientX - rect.right : 0;
          const dy = event.clientY < rect.top ? rect.top - event.clientY :
            event.clientY > rect.bottom ? event.clientY - rect.bottom : 0;
          const distance = Math.hypot(dx, dy);
          const score = distance === 0
            ? Math.hypot(event.clientX - (rect.left + rect.right) / 2,
                event.clientY - (rect.top + rect.bottom) / 2) / 1000
            : distance;
          if (score < selectedScore) {
            selectedScore = score;
            selected = { sentenceIndex, wordIndex };
          }
        }
      }
    }

    // No fallback to another span: a tap outside a mapped word is ignored.
    if (selected && selectedScore <= 18) {
      startAt(selected.sentenceIndex, selected.wordIndex);
    }
  }

  async function initialize() {
    if (!window.pdfjsLib || !pdfUrl) {
      setStatus("تعذر تشغيل عارض صفحات الكتاب. افتح ملف الكتاب الأصلي من الرابط أعلاه.");
      return;
    }
    try {
      setStatus("جارٍ تحميل ملف الكتاب الأصلي…");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        new URL("./vendor/pdf.worker.min.js", window.location.href).href;
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