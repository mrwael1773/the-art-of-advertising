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
    const options = (q.options || []).map((option, oi) =>
      '<label class="answer-option"><input type="radio" name="' + prefix + '-' + index + '" value="' + esc(option.value) + '"> ' + esc(option.label) + '</label>'
    ).join("");
    return '<article class="question-card"><h3>' + esc(q.prompt || ("السؤال " + (index + 1))) + '</h3>' +
      (options ? '<div class="answer-options">' + options + '</div>' : '<p class="art-note">لم تُضف خيارات هذا السؤال بعد.</p>') +
      '<button type="button" class="evidence-button" ' + (evidence ? 'data-evidence="' + evidence + '"' : 'disabled') + '>اعرض مكان الإجابة</button>' +
      '<span class="question-feedback" aria-live="polite"></span></article>';
  };
  const quick = Array.isArray(config.quickCheckQuestions) ? config.quickCheckQuestions : [];
  const extras = Array.isArray(config.exercises) ? config.exercises : [];
  quickRoot.innerHTML = quick.length ? quick.map((q,i)=>renderQuestion(q,i,"quick")).join("") :
    '<p class="art-note">أسئلة الصح والخطأ الستة ستُضاف بعد مطابقة نصها ومواضع أدلتها مع المصدر.</p>';
  extraRoot.innerHTML = extras.length ? extras.map((q,i)=>renderQuestion(q,i,"extra")).join("") :
    '<p class="art-note">الأسئلة العشرون ستُضاف بعد اعتماد صياغتها وربط كل سؤال بجملته الداعمة.</p>';
  document.querySelectorAll("[data-evidence]").forEach(button => {
    button.addEventListener("click", () => { location.href = button.dataset.evidence; });
  });
  const total = quick.length + extras.length;
  status.textContent = total
    ? 'تم تحميل ' + quick.length + ' سؤال فهم و' + extras.length + ' تمرين إضافي. لكل سؤال زر للوصول إلى الدليل.'
    : 'هيكل الأزرار وروابط الأدلة جاهز؛ لم تُحمّل الأسئلة بعد حتى لا نضيف محتوى غير مطابق للمصدر.';
})();