(() => {
const paragraphs = [
  {
    en: [
      "Credit cards have changed the way people pay for goods and services.",
      "Before the 1950s, people mainly used cash. Today, using cards is common in many places around the world."
    ],
    ar: "غيّرت بطاقات الائتمان طريقة دفع الناس ثمن السلع والخدمات. قبل خمسينيات القرن الماضي، كان الناس يستخدمون النقد غالبًا. واليوم أصبح استخدام البطاقات شائعًا في أماكن كثيرة حول العالم."
  },
  {
    en: [
      "The story began in 1949, when Frank McNamara forgot his wallet before a business dinner in New York.",
      "A year later, he returned to the restaurant and paid with a small Diner’s Club card.",
      "By 1952, thousands of American businesses accepted the card, which became a status symbol."
    ],
    ar: "بدأت القصة عام 1949 عندما نسي فرانك ماكنمارا محفظته قبل عشاء عمل في نيويورك. وبعد عام عاد إلى المطعم ودفع باستخدام بطاقة صغيرة من نادي داينرز. وبحلول عام 1952، كانت آلاف المنشآت الأمريكية تقبل البطاقة، التي أصبحت رمزًا للمكانة الاجتماعية."
  },
  {
    en: [
      "The Diner’s Club Card soon became popular in culture.",
      "It appeared in a movie and inspired a board game. In 1952, it became an international charge card in Canada, France, and Cuba.",
      "Western Airlines accepted it in 1955. Later, all airlines in the United States accepted it, and the company expanded to hotels and car rentals."
    ],
    ar: "سرعان ما أصبحت بطاقة نادي داينرز جزءًا من الثقافة الشعبية. وظهرت في فيلم وألهمت لعبة لوحية. وفي عام 1952 أصبحت بطاقة دفع دولية في كندا وفرنسا وكوبا. وقبلتها شركة ويسترن للطيران عام 1955، ثم قبلتها جميع شركات الطيران في الولايات المتحدة لاحقًا، وتوسعت خدمات النادي إلى الفنادق وتأجير السيارات."
  },
  {
    en: [
      "Other international credit cards became well known, including American Express, Visa, and MasterCard.",
      "Many local banks, department stores, and supermarkets also offered their own cards."
    ],
    ar: "ظهرت بطاقات ائتمان دولية مشهورة أخرى، منها أمريكان إكسبريس وفيزا وماستركارد. كما قدمت بنوك محلية ومتاجر متعددة الأقسام وأسواق تجارية كثيرة بطاقاتها الخاصة."
  },
  {
    en: [
      "In 1984, the first card-members rewards program was created, mainly for business travelers.",
      "It offered benefits and special privileges. Today, rewards may include free airline miles and discounts on hotels and other products."
    ],
    ar: "في عام 1984 أُنشئ أول برنامج مكافآت لأعضاء البطاقات، وكان موجهًا بشكل أساسي للمسافرين من أجل العمل. وقدم مزايا وامتيازات خاصة. وقد تشمل المكافآت اليوم أميال طيران مجانية وخصومات على الفنادق ومنتجات أخرى."
  },
  {
    en: [
      "Since the event in 1949, credit cards have become part of everyday life.",
      "They helped create a new business and changed the way people around the world pay for goods and services."
    ],
    ar: "منذ الحدث الذي وقع عام 1949، أصبحت بطاقات الائتمان جزءًا من الحياة اليومية. وأسهمت في إنشاء نشاط تجاري جديد وغيّرت طريقة دفع الناس حول العالم ثمن السلع والخدمات."
  }
];
const words = [
  ["imagine","يتخيّل"],["credit card","بطاقة ائتمان"],["cash","نقد"],["inconceivable","لا يمكن تصوّره"],["economic","اقتصادي"],["impractical","غير عملي"],["business","أعمال / تجاري"],["leisure","وقت الفراغ"],["goods","سلع"],["services","خدمات"],["scheduled","حدّد موعدًا"],["restaurant","مطعم"],["wallet","محفظة"],["embarrassing","مُحرج"],["situation","موقف"],["limited","محدود"],["spending","إنفاق"],["afford","يستطيع تحمّل التكلفة"],["returned","عاد"],["handed","ناول"],["cardboard","ورق مقوّى"],["signed","وقّع"],["meal","وجبة"],["industry","صناعة"],["concept","مفهوم"],["merchants","تجّار"],["alternative","بديل"],["payment","دفع"],["accepted","قُبِلَت"],["status symbol","رمز للمكانة الاجتماعية"],["cultural icon","رمز ثقافي"],["trend","اتجاه / موضة"],["expanded","توسّع"],["international","دولي"],["franchises","امتيازات تجارية"],["airline","شركة طيران"],["hotels","فنادق"],["car rentals","تأجير السيارات"],["rewards","مكافآت"],["benefits","مزايا"],["privileges","امتيازات"],["discounts","خصومات"],["loyal","مخلص"]
];
const questions = [
  {type:"reading",q:"When did Frank McNamara forget his wallet?",a:["1949","1952","1984"],c:0},
  {type:"reading",q:"Where was the restaurant in Frank’s story?",a:["New York","Cuba","Beijing"],c:0},
  {type:"reading",q:"What card did Frank use a year later?",a:["Visa","Diner’s Club Card","MasterCard"],c:1},
  {type:"reading",q:"By 1952, how widely was the Diner’s Club Card accepted in the United States?",a:["By thousands of businesses","By one airline only","By no businesses"],c:0},
  {type:"reading",q:"Which countries received Diner’s Club franchises in 1952?",a:["Canada, France, and Cuba","China, Japan, and India","Spain, Italy, and Greece"],c:0},
  {type:"reading",q:"Which airline became the first to accept the card in 1955?",a:["Western Airlines","American Airlines","Diner’s Airlines"],c:0},
  {type:"reading",q:"When was the first card-members rewards program created?",a:["1949","1955","1984"],c:2},
  {type:"vocabulary",q:"What does “cash” mean?",a:["نقد","محفظة","مطعم"],c:0},
  {type:"vocabulary",q:"What does “wallet” mean?",a:["وجبة","محفظة","خدمات"],c:1},
  {type:"vocabulary",q:"What does “merchants” mean?",a:["مسافرون","تجّار","فنادق"],c:1},
  {type:"vocabulary",q:"What does “alternative” mean?",a:["بديل","محدود","دولي"],c:0},
  {type:"vocabulary",q:"What does “airline” mean?",a:["شركة طيران","متجر","بنك"],c:0},
  {type:"vocabulary",q:"What does “rewards” mean?",a:["خصومات","مكافآت","نقد"],c:1},
  {type:"vocabulary",q:"What does “benefits” mean?",a:["مزايا","مواقف","سلع"],c:0},
  {type:"vocabulary",q:"What does “discounts” mean?",a:["امتيازات","خصومات","إنفاق"],c:1}
];
const $ = s => document.querySelector(s);
const readingList = $("#reading-list"), vocabularyList = $("#vocabulary-list"), quizArea = $("#quiz-area");
if (!readingList || !vocabularyList || !quizArea) return;
let completed = false;
function say(text) {
  if (!("speechSynthesis" in window)) {
    $("#lesson-message").textContent = "النطق غير مدعوم في هذا المتصفح أو الجهاز.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = Number($("#speech-speed").value);
  window.speechSynthesis.speak(utterance);
}
function makeButton(label, callback) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "mini-button"; b.textContent = label;
  b.addEventListener("click", callback);
  return b;
}
paragraphs.forEach((paragraph, index) => {
  const card = document.createElement("article"); card.className = "reading-card";
  const top = document.createElement("div"); top.className = "reading-card-top";
  const title = document.createElement("strong"); title.textContent = "الفقرة " + (index + 1);
  const controls = document.createElement("div"); controls.className = "mini-actions";
  controls.append(makeButton("🔊 استمع للفقرة", () => say(paragraph.en.join(" "))));
  const translation = document.createElement("p"); translation.className = "sentence-ar"; translation.hidden = true; translation.textContent = paragraph.ar;
  const reveal = makeButton("إظهار الترجمة", () => {
    translation.hidden = !translation.hidden;
    reveal.textContent = translation.hidden ? "إظهار الترجمة" : "إخفاء الترجمة";
  });
  controls.append(reveal); top.append(title, controls); card.append(top);
  paragraph.en.forEach((sentence, sentenceIndex) => {
    const row = document.createElement("div");
    const en = document.createElement("p"); en.className = "sentence-en"; en.textContent = sentence;
    const actions = document.createElement("div"); actions.className = "mini-actions";
    actions.append(makeButton("🔊 استمع للجملة " + (sentenceIndex + 1), () => say(sentence)));
    row.append(en, actions); card.append(row);
  });
  card.append(translation); readingList.append(card);
});
words.forEach(([word, meaning]) => {
  const card = document.createElement("article"); card.className = "vocab-card";
  const title = document.createElement("p"); title.className = "vocab-word"; title.textContent = word;
  const controls = document.createElement("div"); controls.className = "mini-actions";
  controls.append(makeButton("🔊 استمع", () => say(word)));
  const meaningNode = document.createElement("p"); meaningNode.className = "vocab-meaning"; meaningNode.hidden = true; meaningNode.textContent = meaning;
  const reveal = makeButton("كشف المعنى", () => {
    meaningNode.hidden = !meaningNode.hidden;
    reveal.textContent = meaningNode.hidden ? "كشف المعنى" : "إخفاء المعنى";
  });
  controls.append(reveal); card.append(title, controls, meaningNode); vocabularyList.append(card);
});
questions.forEach((question, index) => {
  const block = document.createElement("div"); block.className = "quiz-question";
  const heading = document.createElement("p"); heading.textContent = (index + 1) + ". " + question.q;
  const group = document.createElement("div"); group.className = "quiz-options";
  question.a.forEach((answer, optionIndex) => {
    const label = document.createElement("label"); label.className = "quiz-option";
    const input = document.createElement("input"); input.type = "radio"; input.name = "question-" + index; input.value = String(optionIndex);
    const text = document.createElement("span"); text.textContent = answer;
    label.append(input, text); group.append(label);
  });
  block.append(heading, group); quizArea.append(block);
});
const stop = makeButton("■ إيقاف النطق", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});
stop.classList.add("stop-speech");
$("#speech-speed").addEventListener("input", event => {
  $("#speed-value").textContent = Number(event.target.value).toFixed(2) + "×";
});
async function restoreProgress() {
  try {
    const response = await fetch("/api/progress", {credentials:"same-origin",cache:"no-store"});
    if (!response.ok) return;
    const data = await response.json();
    const saved = (data.progress || []).find(row => row.lesson_key === "world-of-plastic-reading");
    if (saved) {
      const record = JSON.parse(saved.progress_json);
      if (record.completed) {
        completed = true;
        $("#progress-label").textContent = "أكملت الاختبار سابقًا · " + record.score + "/" + questions.length;
        $("#progress-fill").style.width = "100%";
      }
    }
  } catch (_) {}
}
$("#finish-quiz").addEventListener("click", async () => {
  let score = 0, answered = 0;
  questions.forEach((question, index) => {
    const selected = document.querySelector('input[name="question-' + index + '"]:checked');
    if (selected) {
      answered++;
      if (Number(selected.value) === question.c) score++;
    }
  });
  if (answered !== questions.length) {
    $("#quiz-result").textContent = "أكمل جميع الأسئلة أولًا. أجبت عن " + answered + " من " + questions.length + ".";
    return;
  }
  completed = true;
  $("#quiz-result").textContent = "نتيجتك: " + score + " من " + questions.length + (score === questions.length ? " — ممتاز!" : " — يمكنك مراجعة الفقرات والكلمات ثم إعادة المحاولة.");
  $("#progress-label").textContent = "اكتمل الاختبار · " + score + "/" + questions.length;
  $("#progress-fill").style.width = "100%";
  try {
    const response = await fetch("/api/progress", {
      method:"PUT", credentials:"same-origin", headers:{"content-type":"application/json"},
      body:JSON.stringify({lessonKey:"world-of-plastic-reading",progress:{completed:true,score,total:questions.length}})
    });
    if (!response.ok) throw Error("SAVE_FAILED");
    $("#lesson-message").textContent = "تم حفظ نتيجتك في حسابك.";
  } catch (_) {
    $("#lesson-message").textContent = "ظهرت نتيجتك، لكن تعذر حفظها على الخادم.";
  }
});
const speedRow = $(".speed-control");
if (speedRow) speedRow.append(stop);
window.addEventListener("account-ready", restoreProgress);
restoreProgress();
})();