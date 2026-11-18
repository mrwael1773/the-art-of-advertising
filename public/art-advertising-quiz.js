(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const quickRoot = document.getElementById("quick-questions");
  const extraRoot = document.getElementById("extra-exercises");
  const status = document.getElementById("quiz-status");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const evidenceButton = q => {
    const href = q.evidenceId ? './textbook.html#sentence-' + encodeURIComponent(q.evidenceId) : "";
    return '<button type="button" class="evidence-button" ' +
      (href ? 'data-evidence="' + href + '"' : 'disabled title="سيُفعّل بعد ربط السؤال بجملة الدليل"') +
      '>اعرض مكان الإجابة</button>';
  };
  const renderQuestion = (q, index, prefix) => {
    let answerUI = "";
    if (q.type === "fill_blank") {
      answerUI = '<label class="blank-answer">إجابتك: <input class="blank-input" type="text" autocomplete="off" placeholder="اكتب الكلمة الناقصة"></label>';
    } else {
      const options = Array.isArray(q.options) ? q.options : [];
      answerUI = '<div class="answer-options">' + options.map(option =>
        '<label class="answer-option"><input type="radio" name="' + prefix + '-' + index +
        '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
      ).join("") + '</div>';
    }
    const accepted = Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : (q.correctAnswer ? [q.correctAnswer] : []);
    return '<article class="question-card" data-type="' + esc(q.type || "single_select") +
      '" data-correct="' + esc(q.correctAnswer || "") + '" data-accepted="' + esc(JSON.stringify(accepted)) + '">' +
      '<h3>' + esc(q.prompt || ("السؤال " + (index + 1))) + '</h3>' + answerUI +
      '<div class="question-actions"><button type="button" class="check-answer">تحقق من الإجابة</button>' +
      evidenceButton(q) + '</div><span class="question-feedback" aria-live="polite"></span></article>';
  };
  const quick = Array.isArray(config.quickCheckQuestions) ? config.quickCheckQuestions : [];
  const exercises = Array.isArray(config.exercises) ? config.exercises : [];
  quickRoot.innerHTML = quick.length
    ? quick.map((q,i)=>renderQuestion(q,i,"quick")).join("")
    : '<p class="art-note">أسئلة الصح والخطأ الستة ستُضاف بعد مطابقة نصها ومواضع أدلتها مع المصدر.</p>';

  const groups = [
    { title:"الأسئلة 1–10: اختيار من متعدد", type:"single_select", items:exercises.slice(0,10) },
    { title:"الأسئلة 11–15: أكمل الفراغ", type:"fill_blank", items:exercises.slice(10,15) },
    { title:"الأسئلة 16–20: صح أو خطأ", type:"true_false", items:exercises.slice(15,20) }
  ];
  extraRoot.innerHTML = groups.map((group, gi) =>
    '<section class="exercise-section"><h3>' + group.title + '</h3>' +
    (group.items.length
      ? group.items.map((q,qi)=>renderQuestion({...q,type:group.type},gi + "-" + qi,"exercise")).join("")
      : '<p class="art-note">ستُضاف هذه المجموعة بعد اعتماد أسئلتها وربط كل سؤال بجملة الدليل.</p>') +
    '</section>'
  ).join("");

  document.querySelectorAll(".check-answer").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");
      const feedback = card.querySelector(".question-feedback");
      let answer = "";
      if (card.dataset.type === "fill_blank") {
        answer = card.querySelector(".blank-input")?.value.trim() || "";
      } else {
        answer = card.querySelector('input[type="radio"]:checked')?.value || "";
      }
      if (!answer) { feedback.textContent = "أدخل إجابتك أو اختر خيارًا أولاً."; return; }
      let accepted = [];
      try { accepted = JSON.parse(card.dataset.accepted || "[]"); } catch {}
      if (!accepted.length && card.dataset.correct) accepted = [card.dataset.correct];
      if (!accepted.length) { feedback.textContent = "لم يُفعّل التصحيح لهذا السؤال بعد."; return; }
      const normalize = value => String(value).trim().toLocaleLowerCase();
      const correct = accepted.some(value => normalize(value) === normalize(answer));
      feedback.textContent = correct ? "إجابة صحيحة!" : "ليست الإجابة الصحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
    });
  });
  document.querySelectorAll("[data-evidence]").forEach(button => {
    button.addEventListener("click", () => { location.href = button.dataset.evidence; });
  });
  status.textContent = 'الترتيب المعتمد: 1–10 اختيار من متعدد، 11–15 أكمل الفراغ، 16–20 صح أو خطأ. ولكل سؤال زر للوصول إلى موضع الدليل.';
})();