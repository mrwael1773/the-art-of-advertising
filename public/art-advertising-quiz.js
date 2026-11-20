(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const root = document.getElementById("extra-exercises");
  const status = document.getElementById("quiz-status");
  if (!root) return;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const sentences = Array.isArray(config.passageSentences) ? config.passageSentences : [];
  const sentenceIds = new Set(sentences.map(s => String(s.id)));
  const exercises = Array.isArray(config.exercises) ? config.exercises : [];

  const evidenceButton = q => {
    const valid = q.evidenceId && sentenceIds.has(String(q.evidenceId));
    return valid
      ? '<a class="evidence-button" href="./textbook.html#sentence-' + encodeURIComponent(q.evidenceId) + '">اعرض مكان الإجابة</a>'
      : '<button type="button" class="evidence-button" disabled>اعرض مكان الإجابة</button>';
  };

  const renderGroup = (items, start, heading, expectedType, expectedOptions) =>
    '<section class="exercise-section"><h3>' + heading + '</h3>' +
    items.map((q, index) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const valid = q.type === expectedType && options.length === expectedOptions &&
        Boolean(q.correctAnswer) && Boolean(q.evidenceId && sentenceIds.has(String(q.evidenceId)));
      const number = start + index;
      return '<article class="question-card" data-correct="' + esc(q.correctAnswer || "") + '">' +
        '<h3>السؤال ' + number + ': ' + esc(q.prompt || "") + '</h3>' +
        '<div class="answer-options">' + options.map(option =>
          '<label class="answer-option"><input type="radio" name="exercise-' + number +
          '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
        ).join("") + '</div>' +
        '<div class="question-actions"><button type="button" class="check-answer" ' +
        (valid ? "" : "disabled") + '>تحقق من الإجابة</button>' + evidenceButton(q) + '</div>' +
        '<span class="question-feedback" aria-live="polite"></span></article>';
    }).join("") + '</section>';

  const multipleChoice = exercises.slice(0, 10);
  const fillBlanks = exercises.slice(10, 15);
  const trueFalse = exercises.slice(15, 20);
  root.innerHTML =
    renderGroup(multipleChoice, 1, "الأسئلة 1–10: اختيار من متعدد", "single_select", 4) +
    renderGroup(fillBlanks, 11, "الأسئلة 11–15: أكمل الفراغ بالاختيار من الخيارات", "single_select", 4) +
    renderGroup(trueFalse, 16, "الأسئلة 16–20: صح أو خطأ", "true_false", 2);

  // Keep selected answers and checked feedback when students open the passage
  // and return to this page in the same browser tab.
  const answerStorageKey = "art-advertising-quiz-answers-v1";
  const readSavedAnswers = () => {
    try {
      const raw = sessionStorage.getItem(answerStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };
  let savedAnswers = readSavedAnswers();
  const saveAnswers = () => {
    try {
      sessionStorage.setItem(answerStorageKey, JSON.stringify(savedAnswers));
    } catch {
      // The quiz remains usable if browser storage is unavailable.
    }
  };

  // Restore each question's selected option and its previous check result.
  root.querySelectorAll(".question-card").forEach((card, index) => {
    const number = index + 1;
    const saved = savedAnswers[String(number)];
    if (!saved || typeof saved.value !== "string") return;
    const input = Array.from(card.querySelectorAll('input[type="radio"]'))
      .find(item => item.value === saved.value);
    if (!input) return;
    input.checked = true;
    if (saved.checked) {
      const feedback = card.querySelector(".question-feedback");
      const correct = saved.value === card.dataset.correct;
      feedback.textContent = correct ? "إجابة صحيحة!" : "إجابة غير صحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
    }
  });

  root.querySelectorAll('input[type="radio"]').forEach(input => {
    input.addEventListener("change", () => {
      const card = input.closest(".question-card");
      const number = Array.from(root.querySelectorAll(".question-card")).indexOf(card) + 1;
      savedAnswers[String(number)] = { value: input.value, checked: false };
      const feedback = card.querySelector(".question-feedback");
      feedback.textContent = "";
      feedback.classList.remove("is-correct", "is-wrong");
      saveAnswers();
    });
  });

  root.querySelectorAll(".check-answer").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");
      const selected = card.querySelector('input[type="radio"]:checked');
      const feedback = card.querySelector(".question-feedback");
      if (!selected) {
        feedback.textContent = "اختر إجابة أولاً.";
        return;
      }
      const correct = selected.value === card.dataset.correct;
      const number = Array.from(root.querySelectorAll(".question-card")).indexOf(card) + 1;
      savedAnswers[String(number)] = { value: selected.value, checked: true };
      saveAnswers();
      feedback.textContent = correct ? "إجابة صحيحة!" : "إجابة غير صحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
    });
  });

  const invalid = exercises.filter((q, index) => {
    const expectedType = index < 15 ? "single_select" : "true_false";
    const expectedOptions = index < 15 ? 4 : 2;
    return q.type !== expectedType || !q.correctAnswer ||
      !Array.isArray(q.options) || q.options.length !== expectedOptions ||
      !q.evidenceId || !sentenceIds.has(String(q.evidenceId));
  }).length;
  const complete = exercises.length === 20 && invalid === 0;
  status.textContent = complete
    ? "اكتملت الأسئلة العشرون: 10 اختيار من متعدد، و5 أكمل الفراغ بالخيارات، و5 صح أو خطأ، ولكل سؤال دليل مرتبط بالقطعة."
    : "المراجعة: " + exercises.length + "/20 سؤالًا، " + invalid + " سؤالًا يحتاج إلى مراجعة.";
  status.classList.toggle("is-complete", complete);
})();