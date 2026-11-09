(() => {
const reading = [
  {en:"Today, credit cards are used to pay for products and services in many countries.",ar:"اليوم تُستخدم بطاقات الائتمان لدفع ثمن المنتجات والخدمات في دول كثيرة."},
  {en:"In 1949, Frank McNamara forgot his wallet before a business dinner in New York.",ar:"في عام 1949 نسي فرانك ماكنمارا محفظته قبل عشاء عمل في نيويورك."},
  {en:"A year later, he paid for a meal with a small Diner’s Club card.",ar:"بعد عام، دفع ثمن وجبة باستخدام بطاقة صغيرة من نادي داينرز."},
  {en:"By 1952, thousands of businesses in the United States accepted the card.",ar:"بحلول عام 1952، كانت آلاف المنشآت في الولايات المتحدة تقبل البطاقة."},
  {en:"The card later spread to other countries and was accepted by an airline in 1955.",ar:"انتشرت البطاقة لاحقًا إلى دول أخرى، وقبلتها إحدى شركات الطيران عام 1955."},
  {en:"In 1984, a rewards program offered benefits to loyal card members.",ar:"في عام 1984، قدم برنامج للمكافآت مزايا لأعضاء البطاقات المخلصين."}
];
const words = [
  ["credit card","بطاقة ائتمان"],["cash","نقد"],["wallet","محفظة"],["business","أعمال / تجاري"],["dinner","عشاء"],["restaurant","مطعم"],["check","فاتورة"],["card","بطاقة"],["merchant","تاجر"],["payment","دفع"],["accepted","قُبِلَت"],["international","دولي"],["airline","شركة طيران"],["services","خدمات"],["rewards","مكافآت"],["benefits","مزايا"],["loyal","مخلص"],["discounts","خصومات"]
];
const questions = [
  {q:"In which year did Frank McNamara forget his wallet?",a:["1949","1952","1984"],correct:0},
  {q:"Where did the business dinner take place?",a:["Beijing","New York","Cuba"],correct:1},
  {q:"What was the name of the card?",a:["Visa","American Express","Diner’s Club Card"],correct:2},
  {q:"What happened by 1952?",a:["Thousands of US businesses accepted the card","The first rewards program began","Every airline accepted it"],correct:0},
  {q:"Which year is linked to the first airline accepting the card?",a:["1949","1955","1984"],correct:1},
  {q:"Which card companies are named in the passage?",a:["Visa and MasterCard","Only Diner’s Club","Only local supermarkets"],correct:0},
  {q:"When was the first card-members rewards program created?",a:["1950","1962","1984"],correct:2},
  {q:"What did rewards programs offer?",a:["School grades","Benefits and privileges","Restaurant jobs"],correct:1}
];
const $ = (s) => document.querySelector(s);
const list = $("#reading-list"), vocab = $("#vocabulary-list"), quiz = $("#quiz-area");
if (!list || !vocab || !quiz) return;
let completed = false;
function speak(text) {
  if (!("speechSynthesis" in window)) { $("#lesson-message").textContent = "ميزة النطق غير مدعومة في هذا المتصفح."; return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = Number($("#speech-speed").value);
  window.speechSynthesis.speak(utterance);
}
function button(label, action) {
  const b = document.createElement("button"); b.type = "button"; b.className = "mini-button"; b.textContent = label; b.addEventListener("click", action); return b;
}
reading.forEach((item, i) => {
  const card = document.createElement("article"); card.className = "reading-card";
  const top = document.createElement("div"); top.className = "reading-card-top";
  const n = document.createElement("strong"); n.textContent = "الجملة " + (i + 1);
  const actions = document.createElement("div"); actions.className = "mini-actions";
  actions.append(button("🔊 استمع", () => speak(item.en)));
  const reveal = button("إظهار الترجمة", () => { const hidden = translation.hidden; translation.hidden = !hidden; reveal.textContent = hidden ? "إخفاء الترجمة" : "إظهار الترجمة"; });
  actions.append(reveal); top.append(n, actions);
  const en = document.createElement("p"); en.className = "sentence-en"; en.textContent = item.en;
  const translation = document.createElement("p"); translation.className = "sentence-ar"; translation.textContent = item.ar; translation.hidden = true;
  card.append(top, en, translation); list.append(card);
});
words.forEach(([word, meaning]) => {
  const card = document.createElement("article"); card.className = "vocab-card";
  const w = document.createElement("p"); w.className = "vocab-word"; w.textContent = word;
  const actions = document.createElement("div"); actions.className = "mini-actions";
  actions.append(button("🔊 استمع", () => speak(word)));
  const meaningNode = document.createElement("p"); meaningNode.className = "vocab-meaning"; meaningNode.textContent = meaning; meaningNode.hidden = true;
  const reveal = button("كشف المعنى", () => { const hidden = meaningNode.hidden; meaningNode.hidden = !hidden; reveal.textContent = hidden ? "إخفاء المعنى" : "كشف المعنى"; });
  actions.append(reveal); card.append(w, actions, meaningNode); vocab.append(card);
});
questions.forEach((item, i) => {
  const block = document.createElement("div"); block.className = "quiz-question";
  const p = document.createElement("p"); p.textContent = (i + 1) + ". " + item.q; block.append(p);
  const options = document.createElement("div"); options.className = "quiz-options";
  item.a.forEach((answer, j) => {
    const label = document.createElement("label"); label.className = "quiz-option";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "q" + i; radio.value = String(j);
    const text = document.createElement("span"); text.textContent = answer;
    label.append(radio, text); options.append(label);
  });
  block.append(options); quiz.append(block);
});
$("#speech-speed").addEventListener("input", e => { $("#speed-value").textContent = Number(e.target.value).toFixed(2) + "×"; });
async function loadProgress() {
  try {
    const response = await fetch("/api/progress", {credentials:"same-origin",cache:"no-store"});
    if (!response.ok) return;
    const data = await response.json();
    const saved = (data.progress || []).find(x => x.lesson_key === "world-of-plastic-reading");
    if (saved) {
      const progress = JSON.parse(saved.progress_json);
      if (progress.completed) { completed = true; $("#progress-label").textContent = "أكملت الاختبار سابقًا · " + progress.score + "/" + questions.length; $("#progress-fill").style.width = "100%"; }
    }
  } catch (_) {}
}
$("#finish-quiz").addEventListener("click", async () => {
  let score = 0, answered = 0;
  questions.forEach((item, i) => {
    const selected = document.querySelector('input[name="q' + i + '"]:checked');
    if (selected) { answered++; if (Number(selected.value) === item.correct) score++; }
  });
  if (answered !== questions.length) { $("#quiz-result").textContent = "أجب عن جميع الأسئلة أولًا. أجبت عن " + answered + " من " + questions.length + "."; return; }
  completed = true;
  $("#quiz-result").textContent = "نتيجتك: " + score + " من " + questions.length + (score === questions.length ? " — ممتاز!" : " — راجع الجمل والكلمات ثم حاول مرة أخرى.");
  $("#progress-label").textContent = "تم إنهاء الاختبار · " + score + "/" + questions.length;
  $("#progress-fill").style.width = "100%";
  try {
    const response = await fetch("/api/progress", {method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({lessonKey:"world-of-plastic-reading",progress:{completed:true,score:score,total:questions.length}})});
    if (!response.ok) throw Error("SAVE_FAILED");
    $("#lesson-message").textContent = "تم حفظ نتيجتك في حسابك.";
  } catch (_) { $("#lesson-message").textContent = "ظهرت نتيجتك، لكن تعذر حفظها على الخادم. أعد المحاولة بعد التأكد من الاتصال."; }
});
loadProgress();
})();