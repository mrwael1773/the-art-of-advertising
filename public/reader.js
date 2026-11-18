(() => {
  "use strict";
  const lesson = window.ART_LESSON;
  if (!lesson) return;

  const root = document.querySelector("#reading-content");
  const audio = document.querySelector("#lesson-audio");
  const status = document.querySelector("#audio-status");
  const speed = document.querySelector("#speech-speed");
  const speedValue = document.querySelector("#speed-value");
  const playAll = document.querySelector("#play-all");
  const pauseButton = document.querySelector("#pause-audio");
  const resumeButton = document.querySelector("#resume-audio");
  const stopButton = document.querySelector("#stop-audio");
  const banner = document.querySelector("#return-banner");
  const returnLink = document.querySelector("#return-link");
  if (!root || !audio) return;

  const sentenceMap = new Map();
  let activeId = null;
  let followPlayback = false;

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function render() {
    root.replaceChildren();
    lesson.sections.forEach(section => {
      const card = make("section", "passage-card");
      card.id = "section-" + section.id;
      const heading = make("header", "passage-heading");
      const icon = make("span", "passage-icon", section.icon);
      icon.setAttribute("aria-hidden", "true");
      const copy = make("div", "passage-heading-copy");
      const englishTitle = make("p", "passage-eyebrow", section.title + " · PAGE " + section.page);
      const arabicTitle = make("h2", "", section.arabicTitle);
      const subtitle = make("p", "passage-subtitle", section.subtitle);
      copy.append(englishTitle, arabicTitle, subtitle);
      heading.append(icon, copy);
      const list = make("div", "sentence-list");
      section.sentenceIds.forEach((id, index) => {
        const sentence = sentenceMap.get(id);
        if (!sentence) return;
        const item = make("article", "passage-sentence");
        item.id = id;
        item.dataset.sentenceId = id;
        const top = make("div", "sentence-main");
        const number = make("span", "sentence-number", String(index + 1).padStart(2, "0"));
        const text = make("p", "sentence-text", sentence.text);
        const listen = make("button", "sentence-listen", "▶ استمع لهذه الجملة");
        listen.type = "button";
        listen.setAttribute("aria-label", "ابدأ الاستماع من الجملة: " + sentence.text);
        listen.addEventListener("click", () => playFromSentence(sentence));
        top.append(number, text, listen);
        item.append(top);
        list.append(item);
      });
      card.append(heading, list);
      root.append(card);
    });
  }

  lesson.sentences.forEach(sentence => sentenceMap.set(sentence.id, sentence));
  render();

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function setControls(playing, paused) {
    playAll.disabled = playing;
    pauseButton.disabled = !playing;
    resumeButton.disabled = !paused;
    stopButton.disabled = !playing && !paused;
  }

  function clearActive() {
    if (activeId) {
      const old = document.getElementById(activeId);
      if (old) old.classList.remove("is-speaking");
    }
    activeId = null;
  }

  function setActive(sentence, shouldScroll) {
    if (!sentence || sentence.id === activeId) return;
    clearActive();
    activeId = sentence.id;
    const element = document.getElementById(activeId);
    if (!element) return;
    element.classList.add("is-speaking");
    if (shouldScroll) element.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function currentSentence(time) {
    return lesson.sentences.find(item => time >= item.start && time <= item.end) || null;
  }

  function syncHighlight() {
    if (audio.paused) return;
    const sentence = currentSentence(audio.currentTime);
    if (sentence) setActive(sentence, followPlayback);
  }

  function playFromSentence(sentence) {
    if (!sentence) return;
    followPlayback = true;
    audio.pause();
    audio.currentTime = sentence.start;
    setActive(sentence, true);
    setStatus("يتم الاستماع الآن من الجملة المحددة.");
    audio.play().then(() => setControls(true, false)).catch(() => {
      setControls(false, false);
      setStatus("تعذر تشغيل الصوت. تحقق من الاتصال ثم اضغط الاستماع مرة أخرى.");
    });
  }

  function playFromStart() {
    followPlayback = true;
    clearActive();
    audio.pause();
    audio.currentTime = 0;
    setStatus("بدأ الاستماع إلى النص كاملًا.");
    audio.play().then(() => setControls(true, false)).catch(() => {
      setControls(false, false);
      setStatus("تعذر تشغيل الصوت. تحقق من الاتصال ثم أعد المحاولة.");
    });
  }

  playAll.addEventListener("click", playFromStart);
  pauseButton.addEventListener("click", () => {
    if (audio.paused) return;
    audio.pause();
    setControls(false, true);
    setStatus("الصوت متوقف مؤقتًا. اضغط متابعة لإكمال الاستماع.");
  });
  resumeButton.addEventListener("click", () => {
    if (!audio.paused) return;
    audio.play().then(() => {
      setControls(true, false);
      setStatus("تمت متابعة الاستماع.");
    }).catch(() => setStatus("تعذر استكمال الصوت. اضغط متابعة مرة أخرى."));
  });
  stopButton.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    clearActive();
    followPlayback = false;
    setControls(false, false);
    setStatus("تم إيقاف الاستماع.");
  });

  speed.addEventListener("input", () => {
    const rate = Number(speed.value);
    audio.playbackRate = rate;
    speedValue.value = rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") + "×";
    speedValue.textContent = speedValue.value;
  });
  audio.playbackRate = Number(speed.value);

  audio.addEventListener("timeupdate", syncHighlight);
  audio.addEventListener("seeked", syncHighlight);
  audio.addEventListener("play", () => setControls(true, false));
  audio.addEventListener("ended", () => {
    clearActive();
    followPlayback = false;
    setControls(false, false);
    setStatus("انتهى الاستماع إلى القطعة كاملة. يمكنك اختيار أي جملة للبدء منها مجددًا.");
  });
  audio.addEventListener("error", () => {
    setControls(false, false);
    setStatus("تعذر تحميل ملف الصوت. تحقق من الاتصال بالإنترنت ثم أعد تحميل الصفحة.");
  });

  function showEvidence() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (!target || !/^[a-z0-9-]+$/i.test(target)) return;
    const element = document.getElementById(target);
    if (!element || !element.classList.contains("passage-sentence")) return;
    element.classList.add("is-evidence");
    element.setAttribute("aria-label", "الجملة الدليل للإجابة");
    const returnValue = params.get("return") || "";
    if (banner && returnLink && /^(quiz|results)\.html(?:#[a-z0-9_-]+)?$/i.test(returnValue)) {
      returnLink.href = "./" + returnValue;
      banner.hidden = false;
    }
    setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  setControls(false, false);
  showEvidence();
})();