(() => {
  "use strict";
  const config = window.ART_AD_CONFIG || {};
  const quickRoot = document.getElementById("quick-questions");
  const extraRoot = document.getElementById("extra-exercises");
  const status = document.getElementById("quiz-status");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const sentences = Array.isArray(config.passageSentences) ? config.passageSentences : [];
  const sentenceIds = new Set(sentences.map((s,i)=>String(s.id || (i+1))));
  const evidenceIsValid = q => Boolean(q.evidenceId && sentenceIds.has(String(q.evidenceId)));
  const evidenceButton = q => {
    const href = evidenceIsValid(q) ? './textbook.html#sentence-' + encodeURIComponent(q.evidenceId) : "";
    return href
      ? '<a class="evidence-button" href="' + href + '">اعرض مكان الإجابة</a>'
      : '<button type="button" class="evidence-button" disabled title="لا يتوفر دليل موثق لهذا السؤال بعد">اعرض مكان الإجابة</button>';
  };
  const renderQuestion = (q, index, prefix, expectedType) => {
    let answerUI = "";
    if (expectedType === "fill_blank") {
      answerUI = '<label class="blank-answer">إجابتك: <input class="blank-input" type="text" autocomplete="off" placeholder="اكتب الإجابة"></label>';
    } else {
      const options = Array.isArray(q.options) ? q.options : [];
      answerUI = '<div class="answer-options">' + options.map(option =>
        '<label class="answer-option"><input type="radio" name="' + prefix + '-' + index +
        '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
      ).join("") + '</div>';
    }
    const accepted = Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : (q.correctAnswer ? [q.correctAnswer] : []);
    const typeValid = q.type === expectedType;
    const evidenceValid = evidenceIsValid(q);
    const answerValid = expectedType === "fill_blank"
      ? accepted.length > 0
      : Array.isArray(q.options) && q.options.length === (expectedType === "true_false" ? 2 : 4) && accepted.length > 0;
    return '<article class="question-card" data-type="' + expectedType +
      '" data-correct="' + esc(q.correctAnswer || "") + '" data-accepted="' + esc(JSON.stringify(accepted)) +
      '" data-valid="' + (typeValid && evidenceValid && answerValid ? "true" : "false") + '">' +
      '<h3>' + esc(q.prompt || ("السؤال " + (index + 1))) + '</h3>' + answerUI +
      '<div class="question-actions"><button type="button" class="check-answer" ' +
      (answerValid ? "" : "disabled") + '>تحقق من الإجابة</button>' +
      evidenceButton(q) + '<\/div>' +
      '<span class="question-feedback" aria-live="polite"></span></article>';
  };
  const quick = Array.isArray(config.quickCheckQuestions) ? config.quickCheckQuestions : [];
  const exercises = Array.isArray(config.exercises) ? config.exercises : [];
  quickRoot.innerHTML = quick.length
    ? quick.map((q,i)=>renderQuestion(q,i,"quick","true_false")).join("")
    : '<p class="art-note">لم تُضف أسئلة Quick Check الستة بعد.</p>';

  const groups = [
    { title:"الأسئلة 1–10: اختيار من متعدد", type:"single_select", start:0, end:10 },
    { title:"الأسئلة 11–15: أكمل الفراغ", type:"fill_blank", start:10, end:15 }
  ];
  extraRoot.innerHTML = groups.map(group => {
    const items = exercises.slice(group.start,group.end);
    return '<section class="exercise-section"><h3>' + group.title + '</h3>' +
      (items.length ? items.map((q,i)=>renderQuestion(q,group.start+i,"exercise",group.type)).join("") :
      '<p class="art-note">لم تُضف أسئلة هذه المجموعة بعد.</p>') + '</section>';
  }).join("");

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
      if (!accepted.length) { feedback.textContent = "لم يُضف مفتاح الإجابة لهذا السؤال بعد."; return; }
      const normalize = value => String(value).trim().toLocaleLowerCase();
      const correct = accepted.some(value => normalize(value) === normalize(answer));
      feedback.textContent = correct ? "إجابة صحيحة!" : "إجابة غير صحيحة، حاول مرة أخرى.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
    });
  });

  const allQuestions = [...quick,...exercises];
  const missingEvidence = allQuestions.filter(q=>!evidenceIsValid(q)).length;
  const missingAnswerKeys = allQuestions.filter(q=>{
    if (q.type === "fill_blank") return !Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length === 0;
    return !q.correctAnswer;
  }).length;
  const invalidTypes = exercises.filter((q,i)=>{
    const expected = i < 10 ? "single_select" : "fill_blank";
    return q.type !== expected;
  }).length;
  const complete = quick.length === 6 && exercises.length === 15 &&
    quick.every(q=>q.type === "true_false") &&
    exercises.every((q,i)=>q.type === (i < 10 ? "single_select" : "fill_blank")) &&
    missingEvidence === 0 && missingAnswerKeys === 0 && invalidTypes === 0;
  status.textContent = complete
    ? "اكتملت أسئلة Quick Check والتمارين الخمسة عشر، مع مفاتيح إجابة وأدلة مرتبطة بجمل القطعة."
    : "المراجعة: " + quick.length + "/6 أسئلة Quick Check، " + exercises.length + "/20 تمرينًا، " +
      missingEvidence + " سؤالًا بلا دليل، و" + missingAnswerKeys + " بلا مفتاح إجابة.";
  status.classList.toggle("is-complete",complete);
})();