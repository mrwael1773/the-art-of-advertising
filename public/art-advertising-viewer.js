(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const status = document.getElementById("pdf-status");
  const wrap = document.getElementById("pdf-frame-wrap");
  const frame = document.getElementById("book-pdf");
  const fileInput = document.getElementById("book-pdf-file");
  const openLink = document.getElementById("open-book-pdf");
  let localPdfUrl = null;
  const speed = document.getElementById("speech-speed");
  const output = document.getElementById("speed-value");
  const passage = document.getElementById("passage-sentences");
  const play = document.getElementById("play-reading");
  const pause = document.getElementById("pause-reading");
  const resume = document.getElementById("resume-reading");
  const stop = document.getElementById("stop-reading");
  let current = -1;
  let utterance = null;
  let queueToken = 0;

  const showPdf = (url, message) => {
    frame.src = url;
    wrap.hidden = false;
    openLink.href = url;
    openLink.hidden = false;
    status.textContent = message;
  };
  if (typeof config.pdfUrl === "string" && config.pdfUrl.trim()) {
    try {
      const pdf = new URL(config.pdfUrl, window.location.href);
      const safeProtocol = pdf.protocol === "https:" || pdf.origin === window.location.origin;
      if (safeProtocol && /\.pdf$/i.test(pdf.pathname)) showPdf(pdf.href, "تم تحميل ملف صفحات الدرس.");
      else status.textContent = "رابط PDF غير صالح. استخدم رابط HTTPS مباشرًا أو ملفًا داخل الموقع.";
    } catch { status.textContent = "تعذر قراءة رابط ملف PDF." }
  } else {
    status.textContent = "لم يُربط ملف PDF دائم بالموقع بعد. يمكنك معاينته من جهازك مؤقتًا.";
  }
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      status.textContent = "الملف المحدد ليس ملف PDF.";
      fileInput.value = "";
      return;
    }
    if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
    localPdfUrl = URL.createObjectURL(file);
    showPdf(localPdfUrl, "تُعرض الآن معاينة محلية لهذا الجهاز فقط؛ لن يراها بقية زوار الموقع.");
  });
  window.addEventListener("beforeunload", () => { if (localPdfUrl) URL.revokeObjectURL(localPdfUrl); });

  if (!passage) return;
  const sentences = Array.isArray(config.passageSentences) ? config.passageSentences : [];
  const safe = value => String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  passage.innerHTML = sentences.length
    ? sentences.map((s, i) => '<p class="passage-sentence" id="sentence-' + safe(s.id || (i + 1)) + '" data-index="' + i + '">' + safe(s.text || "") + '</p>').join("")
    : '<p class="art-note">سيظهر نص القطعة هنا بعد إدخال الجمل المعتمدة وربطها بمصدر الدرس.</p>';

  const setSpeed = () => {
    const value = Math.min(1, Math.max(.25, Number(speed?.value || 1)));
    if (output) output.value = value.toFixed(2) + "×";
    return value;
  };
  const highlight = index => {
    passage.querySelectorAll(".passage-sentence").forEach((node, i) => {
      node.classList.toggle("is-speaking", i === index);
    });
    current = index;
    const active = passage.querySelector('[data-index="' + index + '"]');
    active?.scrollIntoView({behavior:"smooth", block:"center"});
  };
  const speakFrom = (index, token) => {
    if (token !== queueToken || index >= sentences.length) return;
    highlight(index);
    utterance = new SpeechSynthesisUtterance(sentences[index].text);
    utterance.lang = "en-US";
    utterance.rate = setSpeed();
    utterance.onend = () => {
      if (token === queueToken) speakFrom(index + 1, token);
    };
    utterance.onerror = () => {
      if (token === queueToken) {
        passage.querySelectorAll(".passage-sentence").forEach(n => n.classList.remove("is-speaking"));
      }
    };
    speechSynthesis.speak(utterance);
  };
  const start = index => {
    if (!("speechSynthesis" in window) || !sentences.length) return;
    queueToken++;
    speechSynthesis.cancel();
    speakFrom(index, queueToken);
  };
  speed?.addEventListener("input", () => {
    setSpeed();
    if (current >= 0 && "speechSynthesis" in window && speechSynthesis.speaking) start(current);
  });
  play?.addEventListener("click", () => start(0));
  pause?.addEventListener("click", () => speechSynthesis.pause());
  resume?.addEventListener("click", () => speechSynthesis.resume());
  stop?.addEventListener("click", () => {
    queueToken++;
    speechSynthesis.cancel();
    passage.querySelectorAll(".passage-sentence").forEach(n => n.classList.remove("is-speaking"));
    current = -1;
  });
  window.playEvidenceSentence = id => {
    const index = sentences.findIndex((s, i) => String(s.id || (i + 1)) === String(id));
    if (index >= 0) start(index);
  };
  const target = decodeURIComponent(location.hash.slice(1));
  if (target.startsWith("sentence-")) {
    const id = target.slice("sentence-".length);
    setTimeout(() => window.playEvidenceSentence(id), 250);
  }
  setSpeed();
})();