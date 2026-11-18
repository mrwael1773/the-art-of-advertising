(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const quickRoot = document.getElementById("quick-questions");
  const extraRoot = document.getElementById("extra-exercises");
  const status = document.getElementById("quiz-status");
  const esc = value => String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const renderQuestion = (q, index, prefix) => {
    const evidence = q.evidenceId ? './textbook.html#sentence-' + encodeURIComponent(q.evidenceId) : "";
    const options = (q.options || []).map(option =>
      '<label class="answer-option"><input type="radio" name="' + prefix + '-' + index + '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
    ).join("");
    return '<article class="question-card" data-correct="' + esc(q.correctAnswer ?? "") + '">' +
      '<h3>' + esc(q.prompt || ("السؤال " + (index + 1))) + '</h3>' +
      (options ? '<div class="answer-options">' + options + '</div>' : '<p class="art-note">لم تُضف خيارات هذا السؤال بعد.</p>') +
      '<div class="question-actions"><button type="button" class="check-answer">تحقق من الإجابة</button>' +
      '<button type="button" class="evidence-button" ' + (evidence ? 'data-evidence="' + evidence + '"' : 'disabled') + '>اعرض مكان الإجابة</button></div>' +
      '<span class="question-feedback" aria-live="polite"></span></article>';
  };
  const quick = Array.isArray(config.quickCheckQuestions) ? config.quickCheckQuestions : [];
  const sections = Array.isArray(config.exerciseSections) ? config.exerciseSections : [];
  quickRoot.innerHTML = quick.length ? quick.map((q,i)=>renderQuestion(q,i,"quick")).join("") :
    '<p class="art-note">أسئلة الصح والخطأ الستة ستُضاف بعد مطابقة نصها ومواضع أدلتها مع المصدر.</p>';
  const exerciseCount = sections.reduce((sum, section) => sum + (Array.isArray(section.questions) ? section.questions.length : 0), 0);
  extraRoot.innerHTML = sections.length ? sections.map((section, si) =>
    '<section class="exercise-section"><h3>' + esc(section.title || ("النوع " + (si + 1))) + '</h3>' +
    (section.questions || []).map((q, qi)=>renderQuestion(q,si + "-" + qi,"exercise")).join("") + '</section>'
  ).join("") : '<p class="art-note">ستُضاف أربعة أنواع من التمارين، خمسة أسئلة لكل نوع، بعد اعتماد الأسئلة وربط أدلة الإجابة.</p>';
  document.querySelectorAll(".check-answer").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");
      const selected = card.querySelector('input[type="radio"]:checked');
      const feedback = card.querySelector(".question-feedback");
      if (!selected) { feedback.textContent = "اختر إجابة أولاً."; return; }
      const correct = card.dataset.correct;
      if (!correct) { feedback.textContent = "لم يُفعّل التصحيح لهذا السؤال بعد."; return; }
      feedback.textContent = selected.value === correct ? "إجابة صحيحة!" : "ليست الإجابة الصحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", selected.value === correct);
      feedback.classList.toggle("is-wrong", selected.value !== correct);
    });
  });
  document.querySelectorAll("[data-evidence]").forEach(button => {
    button.addEventListener("click", () => { location.href = button.dataset.evidence; });
  });
  status.textContent = 'المتاح حاليًا: ' + quick.length + ' سؤال فهم و' + exerciseCount + ' تمرين إضافي. زر الدليل يظهر لكل سؤال مرتبط بجملة موثقة.';
})();