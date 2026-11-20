(() => {
  "use strict";
  const root = document.getElementById("page-two-questions");
  const config = window.ART_AD_CONFIG || {};
  if (!root) return;
  const questions = Array.isArray(config.pageTwoQuestions) ? config.pageTwoQuestions : [];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const evidenceButton = q => {
    const sentences = Array.isArray(config.passageSentences) ? config.passageSentences : [];
    const exists = sentences.some(sentence => String(sentence.id) === String(q.evidenceId));
    return exists
      ? '<a class="evidence-button" href="./textbook.html#sentence-' + encodeURIComponent(q.evidenceId) + '">اعرض مكان الإجابة في القطعة</a>'
      : "";
  };
  root.innerHTML = questions.map((q, index) => {
    const number = index + 1;
    const solutionId = "page2-solution-" + number;
    const options = Array.isArray(q.options) ? q.options : [];
    return '<article class="question-card page-two-question" data-type="true_false" data-correct="' +
      esc(q.correctAnswer || "") + '">' +
      '<h3>' + esc("السؤال " + number + ": " + q.prompt) + '</h3>' +
      '<div class="answer-options">' + options.map(option =>
        '<label class="answer-option"><input type="radio" name="page2-' + number +
        '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
      ).join("") + '</div>' +
      '<div class="question-actions"><button type="button" class="check-answer">تحقق من الإجابة</button>' +
      evidenceButton(q) +
      '<a class="solution-jump-button" href="#' + solutionId + '">انتقل إلى الإجابة الصحيحة</a></div>' +
      '<span class="question-feedback" aria-live="polite"></span>' +
      '<div class="answer-solution" id="' + solutionId + '" tabindex="-1"><strong>الإجابة الصحيحة:</strong> ' +
      (q.correctAnswer === "true" ? "صح" : "خطأ") + '</div></article>';
  }).join("");

  root.querySelectorAll(".check-answer").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");
      const selected = card.querySelector('input[type="radio"]:checked');
      const feedback = card.querySelector(".question-feedback");
      if (!selected) {
        feedback.textContent = "اختر صح أو خطأ أولاً.";
        return;
      }
      const correct = selected.value === card.dataset.correct;
      feedback.textContent = correct ? "إجابة صحيحة!" : "إجابة غير صحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
    });
  });
})();
