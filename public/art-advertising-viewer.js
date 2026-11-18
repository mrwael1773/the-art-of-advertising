(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const status = document.getElementById("pdf-status");
  const wrap = document.getElementById("pdf-frame-wrap");
  const frame = document.getElementById("book-pdf");
  const speed = document.getElementById("speech-speed");
  const output = document.getElementById("speed-value");
  if (config.pdfUrl && /^https:\/\//i.test(config.pdfUrl)) {
    frame.src = config.pdfUrl;
    wrap.hidden = false;
    status.textContent = "تم ربط ملف الدرس.";
  }
  if (speed && output) {
    speed.addEventListener("input", () => { output.value = Number(speed.value).toFixed(2) + "×"; });
  }
})();