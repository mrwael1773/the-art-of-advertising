(() => {
  "use strict";
  const lesson = window.ART_LESSON;
  if (!lesson) return;

  const quickRoot = document.querySelector("#quick-check-list");
  const groupsRoot = document.querySelector("#practice-groups");
  const progress = document.querySelector("#progress-text");
  const message = document.querySelector("#quiz-message");
  const finish = document.querySelector("#finish-quiz");
  const ANSWERS_KEY = "art-advertising:answers:v1";
  const RESULT_KEY = "art-advertising:attempt-result:v1";
  if (!quickRoot || !groupsRoot) return;

  const allQuestions = lesson.quickCheck.concat(...lesson.practice.map(group => group.questions));
  const questionById = new Map(allQuestions.map(question => [question.id, question]));
  let answers = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem(ANSWERS_KEY) || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const question of allQuestions) {
        const value = saved[question.id];
        if (Number.isInteger(value) && value >= 0 && value < question.options.length) answers[question.id] = value;
      }
    }
  } catch (_) {}
  try { sessionStorage.removeItem(RESULT_KEY); } catch (_) {}

  function save() {
    try { sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers)); } catch (_) {}
    updateProgress();
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function evidenceUrl(question) {
    const url = new URL("./textbook.html", window.location.href);
    url.searchParams.set("target", question.evidence);
    url.searchParams.set("return", "quiz.html#" + question.id);
    return url.href;
  }

  function jumpToEvidence(question) {
    window.location.assign(evidenceUrl(question));
  }

  function createQuestion(question, index, mode) {
    const card = node("article", "question-card");
    card.id = question.id;
    const heading = node("div", "question-heading");
    heading.append(
      node("span", "question-number", String(index + 1).padStart(2, "0")),
      node("p", "question-prompt", question.prompt)
    );
    const fieldset = node("fieldset", "answer-options");
    const legend = node("legend", "sr-only", "اختر الإجابة المناسبة");
    fieldset.append(legend);

    question.options.forEach((option, optionIndex) => {
      const label = node("label", "answer-option");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = String(optionIndex);
      input.checked = answers[question.id] === optionIndex;
      input.addEventListener("change", () => {
        if (mode === "matching") {
          Object.keys(answers).forEach(otherId => {
            const other = questionById.get(otherId);
            if (other && otherId !== question.id && other.groupId === "meaning" && answers[otherId] === optionIndex) {
              delete answers[otherId];
              const otherInput = document.querySelector('input[name="' + otherId + '"][value="' + optionIndex + '"]');
              if (otherInput) otherInput.checked = false;
            }
          });
        }
        answers[question.id] = optionIndex;
        save();
      });
      const text = node("span", "", option);
      label.append(input, text);
      fieldset.append(label);
    });

    const actions = node("div", "question-actions");
    const evidence = node("button", "button evidence-button", mode === "quick" ? "تحقق واعرض الدليل" : "اعرض الدليل في القطعة");
    evidence.type = "button";
    const feedback = node("p", "question-feedback");
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    evidence.addEventListener("click", () => {
      if (mode !== "quick") {
        jumpToEvidence(question);
        return;
      }
      const selected = answers[question.id];
      if (!Number.isInteger(selected)) {
        feedback.textContent = "اختر صح أو خطأ أولًا.";
        feedback.className = "question-feedback is-error";
        return;
      }
      if (selected !== question.correct) {
        feedback.textContent = "إجابتك غير صحيحة بعد. راجع السؤال وحاول مرة أخرى.";
        feedback.className = "question-feedback is-error";
        return;
      }
      feedback.textContent = "إجابة صحيحة! نفتح موضع الدليل في القطعة.";
      feedback.className = "question-feedback is-success";
      jumpToEvidence(question);
    });
    actions.append(evidence);
    card.append(heading, fieldset, actions, feedback);
    return card;
  }

  lesson.quickCheck.forEach((question, index) => quickRoot.append(createQuestion(question, index, "quick")));

  lesson.practice.forEach(group => {
    const section = node("section", "exercise-group");
    section.id = "group-" + group.id;
    const heading = node("header", "exercise-heading");
    heading.append(
      node("h3", "", group.title),
      node("span", "group-count", "5 أسئلة")
    );
    const list = node("div", "question-list");
    group.questions.forEach((question, index) => {
      question.groupId = group.id;
      list.append(createQuestion(question, index, group.id === "meaning" ? "matching" : "exercise"));
    });
    section.append(heading, list);
    groupsRoot.append(section);
  });

  function updateProgress() {
    const answered = allQuestions.filter(question => Number.isInteger(answers[question.id])).length;
    progress.textContent = "أجبت عن " + answered + " من " + allQuestions.length + " سؤالًا.";
  }

  function optionText(question, index) {
    return question.options[index] ?? "";
  }

  finish.addEventListener("click", () => {
    const unanswered = allQuestions.filter(question => !Number.isInteger(answers[question.id]));
    if (unanswered.length) {
      message.textContent = "أكمل جميع الأسئلة أولًا. بقي " + unanswered.length + " سؤالًا.";
      message.className = "status-message is-error";
      const first = document.getElementById(unanswered[0].id);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.classList.add("needs-answer");
      setTimeout(() => first?.classList.remove("needs-answer"), 1600);
      return;
    }

    const wrongAnswers = [];
    let score = 0;
    allQuestions.forEach(question => {
      const selected = answers[question.id];
      if (selected === question.correct) score += 1;
      else wrongAnswers.push({
        id: question.id,
        prompt: question.prompt,
        selected: optionText(question, selected),
        correct: optionText(question, question.correct),
        evidence: question.evidence
      });
    });

    const result = { score, total: allQuestions.length, wrongAnswers };
    try {
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      sessionStorage.removeItem(ANSWERS_KEY);
    } catch (_) {}
    window.location.assign("./results.html");
  });

  updateProgress();

  const hashId = decodeURIComponent(window.location.hash.slice(1));
  if (hashId && questionById.has(hashId)) {
    const target = document.getElementById(hashId);
    if (target) {
      target.classList.add("returned-question");
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }
})();