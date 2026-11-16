(() => {
"use strict";
try{window.localStorage.removeItem("art-of-advertising:student-progress:v1");}catch(_){}
const paragraphs = [
[
["Can you imagine a world without credit cards?","هل يمكنك تخيّل عالمٍ بلا بطاقات ائتمان؟"],
["Until the 1950s, a world without the use of cash was simply inconceivable.","حتى خمسينيات القرن الماضي، كان من غير المتصوّر وجود عالم لا يُستخدم فيه النقد."],
["Today an economic universe without plastic would be impractical.","أما اليوم، فسيكون عالم اقتصادي بلا بطاقات ائتمان أمرًا غير عملي."],
["Whether it’s for business or for leisure, the credit card is used to pay for goods and services from New York to Beijing.","سواء أكان ذلك للعمل أم للترفيه، تُستخدم بطاقة الائتمان لدفع ثمن السلع والخدمات من نيويورك إلى بكين."]
],
[
["It all started in 1949 when Frank McNamara scheduled a business dinner in a New York restaurant.","بدأ كل ذلك عام 1949، عندما حدّد فرانك ماكنمارا موعد عشاء عمل في مطعم بنيويورك."],
["Before he left for the dinner, Frank changed suits.","قبل أن يغادر لحضور العشاء، بدّل فرانك بدلته."],
["When the waiter presented the check, Frank realized that he had left his wallet in the other suit.","عندما قدّم النادل الفاتورة، أدرك فرانك أنه ترك محفظته في البدلة الأخرى."],
["The embarrassing situation was solved, but that night Frank asked himself: “Why should people be limited to spending what they are carrying in cash, instead of being able to spend what they can afford?”","حُلّ الموقف المحرج، لكن فرانك سأل نفسه تلك الليلة: «لماذا ينبغي أن يقتصر إنفاق الناس على ما يحملونه نقدًا، بدلًا من أن يتمكنوا من إنفاق ما يستطيعون تحمّل تكلفته؟»"],
["A year later, Frank returned to the same restaurant in New York.","بعد عام، عاد فرانك إلى المطعم نفسه في نيويورك."],
["When the check came, Frank handed the waiter a small cardboard card, a Diner’s Club Card, and signed for the meal.","عندما جاءت الفاتورة، ناول فرانك النادل بطاقة صغيرة من الورق المقوّى، هي بطاقة نادي داينرز، ووقّع مقابل الوجبة."],
["This event is known in the credit card industry as the “First Supper.”","يُعرف هذا الحدث في صناعة بطاقات الائتمان باسم «العشاء الأول»."],
["Soon the concept of “charging it” was picked up by merchants as an alternative form of payment to the use of cash.","وسرعان ما تبنّى التجار مفهوم «الدفع بالبطاقة» بوصفه طريقة بديلة للدفع النقدي."],
["By 1952, the Diner’s Club Card was accepted by thousands of businesses across the United States, and it became a status symbol for those who carried it.","وبحلول عام 1952، أصبحت بطاقة نادي داينرز مقبولة لدى آلاف الشركات في أنحاء الولايات المتحدة، وصارت رمزًا للمكانة الاجتماعية لمن يحملها."]
],
[
["The Diner’s Club Card soon became a cultural icon.","سرعان ما أصبحت بطاقة نادي داينرز رمزًا ثقافيًا."],
["Hollywood cashed in on the “charge-it craze” with the 1962 movie, The Man from the Diner’s Club.","استغلت هوليوود رواج «الدفع بالبطاقة» من خلال فيلم عام 1962، «الرجل من نادي داينرز»."],
["In it, an employee at Diner’s Club issues a credit card to a well-known gangster and has to get it back in order to keep his job.","في الفيلم، يصدر موظف في نادي داينرز بطاقة ائتمان لرجل عصابات معروف، ويتعين عليه استعادتها حتى يحتفظ بوظيفته."],
["The Ideal Toy Corporation joined in the trend when it created a board game called the Diner’s Club Game.","وانضمت شركة إيديل للألعاب إلى هذا الاتجاه عندما ابتكرت لعبة لوحية تُسمّى «لعبة نادي داينرز»."],
["The idea of the credit card quickly expanded outside the United States.","وسرعان ما انتشرت فكرة بطاقة الائتمان خارج الولايات المتحدة."],
["The Diner’s Club Card became the first international charge card in 1952 with franchises in Canada, France, and Cuba.","أصبحت بطاقة نادي داينرز أول بطاقة دفع دولية عام 1952، مع امتيازات تجارية في كندا وفرنسا وكوبا."],
["In 1955, Western Airlines became the first airline to accept the Diner’s Club Card.","في عام 1955، أصبحت شركة ويسترن للطيران أول شركة طيران تقبل بطاقة نادي داينرز."],
["Ten years later, the card was accepted by every airline in the United States.","وبعد عشر سنوات، أصبحت البطاقة مقبولة لدى كل شركة طيران في الولايات المتحدة."],
["Diner’s Club expanded its services to hotels, car rentals, and other businesses.","وسّع نادي داينرز خدماته لتشمل الفنادق وتأجير السيارات وغيرها من الشركات."]
],
[
["Other famous international credit cards have been created such as American Express, Visa, and MasterCard.","أُصدرت بطاقات ائتمان دولية مشهورة أخرى، مثل أمريكان إكسبريس وفيزا وماستركارد."],
["There are hundreds of local bank cards, department store credit cards, supermarket credit cards, and so forth around the world.","وتوجد مئات البطاقات المصرفية المحلية، وبطاقات المتاجر متعددة الأقسام، وبطاقات المتاجر الكبرى، وغيرها حول العالم."]
],
[
["In 1984, the first card members rewards program was created, aimed mostly at business travelers.","في عام 1984، أُنشئ أول برنامج مكافآت لأعضاء البطاقات، وكان موجّهًا في الغالب إلى المسافرين بغرض العمل."],
["It gave valuable benefits and special privileges to loyal users.","وقدّم مزايا قيّمة وامتيازات خاصة للمستخدمين الأوفياء."],
["Now many reward programs offer free airline miles and discounts on hotels and other products.","والآن، تقدّم برامج مكافآت كثيرة أميال طيران مجانية وخصومات على الفنادق ومنتجات أخرى."]
],
[
["Ever since a businessman forgot his cash in 1949, people have used credit cards.","منذ أن نسي رجل أعمال نقوده عام 1949، والناس يستخدمون بطاقات الائتمان."],
["An entirely new business was created that revolutionized the way the world has paid for goods and services ever since.","وقد نشأ نشاط تجاري جديد بالكامل أحدث تحولًا جذريًا في الطريقة التي يدفع بها العالم ثمن السلع والخدمات منذ ذلك الحين."]
]
];
const words = [
["imagine","يتخيّل"],["credit card","بطاقة ائتمان"],["cash","نقد"],["inconceivable","لا يمكن تصوّره"],["economic","اقتصادي"],["impractical","غير عملي"],["business","عمل / أعمال"],["leisure","وقت الفراغ"],["goods","سلع"],["services","خدمات"],["scheduled","حدّد موعدًا"],["restaurant","مطعم"],["wallet","محفظة"],["embarrassing","مُحرج"],["situation","موقف"],["limited","محدود"],["spending","إنفاق"],["afford","يستطيع تحمّل التكلفة"],["returned","عاد"],["handed","ناول"],["cardboard","ورق مقوّى"],["signed","وقّع"],["meal","وجبة"],["industry","صناعة"],["concept","مفهوم"],["merchants","تجّار"],["alternative","بديل"],["payment","دفع"],["accepted","قُبلت"],["status symbol","رمز للمكانة الاجتماعية"],["cultural icon","رمز ثقافي"],["trend","اتجاه"],["expanded","توسّع"],["international","دولي"],["franchises","امتيازات تجارية"],["airline","شركة طيران"],["hotels","فنادق"],["car rentals","تأجير السيارات"],["rewards","مكافآت"],["benefits","مزايا"],["privileges","امتيازات"],["discounts","خصومات"],["loyal","وفيّ"]
];
const questions = [
{type:"choice",q:"When did Frank McNamara first forget his wallet before the business dinner?",a:["1949","1952","1984"],correct:0},
{type:"choice",q:"Where did Frank have the business dinner?",a:["Beijing","New York","Cuba"],correct:1},
{type:"choice",q:"What did Frank hand the waiter when he returned a year later?",a:["A Diner’s Club Card","A bank note","An airline ticket"],correct:0},
{type:"choice",q:"What happened to the Diner’s Club Card by 1952?",a:["It was accepted by every airline","It was used only in hotels","Thousands of US businesses accepted it"],correct:2},
{type:"choice",q:"Which airline first accepted the Diner’s Club Card in 1955?",a:["Western Airlines","American Express","Visa"],correct:0},
{type:"fill",q:"It all started in ____ when Frank McNamara scheduled a business dinner.",a:["1949","1955","1984"],correct:0},
{type:"fill",q:"Frank realized that he had left his ____ in the other suit.",a:["cardboard card","wallet","ticket"],correct:1},
{type:"fill",q:"Frank handed the waiter a small ____ card.",a:["plastic","paper","cardboard"],correct:2},
{type:"fill",q:"By 1952, the card was accepted by ____ of businesses across the United States.",a:["thousands","two","every airline"],correct:0},
{type:"fill",q:"The first card-members rewards program was created in ____.",a:["1949","1984","1952"],correct:1},
{type:"match",q:"Match the word “cash” with its Arabic meaning.",a:["1. نقد","2. محفظة","3. تجّار","4. خصومات","5. مكافآت"],correct:0},
{type:"match",q:"Match the word “wallet” with its Arabic meaning.",a:["1. نقد","2. محفظة","3. تجّار","4. خصومات","5. مكافآت"],correct:1},
{type:"match",q:"Match the word “merchants” with its Arabic meaning.",a:["1. نقد","2. محفظة","3. تجّار","4. خصومات","5. مكافآت"],correct:2},
{type:"match",q:"Match the word “discounts” with its Arabic meaning.",a:["1. نقد","2. محفظة","3. تجّار","4. خصومات","5. مكافآت"],correct:3},
{type:"match",q:"Match the word “rewards” with its Arabic meaning.",a:["1. نقد","2. محفظة","3. تجّار","4. خصومات","5. مكافآت"],correct:4},
{type:"truefalse",q:"The Diner’s Club Card became the first international charge card in 1952.",a:["صح","خطأ"],correct:0},
{type:"truefalse",q:"Western Airlines was the first airline to accept the card in 1955.",a:["صح","خطأ"],correct:0},
{type:"truefalse",q:"The card was accepted by every airline in the United States in 1955.",a:["صح","خطأ"],correct:1},
{type:"truefalse",q:"The first card-members rewards program was created in 1984.",a:["صح","خطأ"],correct:0},
{type:"truefalse",q:"The text says reward programs may offer airline miles and hotel discounts.",a:["صح","خطأ"],correct:0}
];
// Correct-answer positions are deliberately varied; original indexes remain the scoring source.
const correctPositions = [1,2,0,1,2, 2,0,1,2,0, 3,1,4,0,2, 1,0,1,0,1];
questions.forEach((q,i)=>{
  const distractors=q.a.map((_,index)=>index).filter(index=>index!==q.correct);
  q.displayOrder=[...distractors];
  q.displayOrder.splice(correctPositions[i],0,q.correct);
});
const $ = s => document.querySelector(s);
const readingList=$("#reading-list"), vocabularyList=$("#vocabulary-list"), quizArea=$("#quiz-area");
if(!readingList&&!vocabularyList&&!quizArea)return;
function say(text){if(!("speechSynthesis"in window)){ $("#lesson-message").textContent="النطق غير مدعوم في هذا المتصفح أو الجهاز.";return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=Number($("#speech-speed")?.value||0.85);window.speechSynthesis.speak(u);}
function button(label,fn){const b=document.createElement("button");b.type="button";b.className="mini-button";b.textContent=label;b.addEventListener("click",fn);return b;}
const wordMeanings=new Map(words.map(([word,meaning])=>[word.toLowerCase(),meaning]));
function makeClickableSentence(text,target){
  const parts=text.match(/[\p{L}’']+|[^\p{L}’']+/gu)||[text];
  parts.forEach(part=>{
    if(/^[\p{L}’']+$/u.test(part)){
      const token=document.createElement("button");
      token.type="button";token.className="word-token";token.textContent=part;
      token.setAttribute("aria-label","استمع إلى كلمة "+part);
      token.addEventListener("click",()=>{
        say(part);
        const meaning=wordMeanings.get(part.toLowerCase().replace(/[’']s$/,""));
        $("#lesson-message").textContent=meaning?part+" = "+meaning:"استمع إلى نطق: "+part;
      });
      target.append(token);
    }else target.append(document.createTextNode(part));
  });
}
if(readingList)paragraphs.forEach((sentences,i)=>{const card=document.createElement("article");card.className="reading-card";const top=document.createElement("div");top.className="reading-card-top";const title=document.createElement("strong");title.textContent="الفقرة "+(i+1);const listen=button("🔊 استمع للفقرة",()=>say(sentences.map(x=>x[0]).join(" ")));top.append(title,listen);card.append(top);sentences.forEach(([en,ar])=>{const row=document.createElement("div");row.className="sentence-row";const english=document.createElement("p");english.className="sentence-en";makeClickableSentence(en,english);const actions=document.createElement("div");actions.className="mini-actions";actions.append(button("🔊 استمع للجملة",()=>say(en)));const translation=document.createElement("p");translation.className="sentence-ar";translation.hidden=true;translation.textContent=ar;const reveal=button("إظهار ترجمة الجملة",()=>{const show=translation.hidden;translation.hidden=!show;reveal.textContent=show?"إخفاء الترجمة":"إظهار ترجمة الجملة";reveal.setAttribute("aria-expanded",String(show));});reveal.setAttribute("aria-expanded","false");actions.append(reveal);row.append(english,actions,translation);card.append(row);});readingList.append(card);});
if(vocabularyList)words.forEach(([word,meaning])=>{const card=document.createElement("article");card.className="vocab-card";const title=document.createElement("p");title.className="vocab-word";title.textContent=word;const actions=document.createElement("div");actions.className="mini-actions";actions.append(button("🔊 استمع",()=>say(word)));const translation=document.createElement("p");translation.className="vocab-meaning";translation.hidden=true;translation.textContent=meaning;const reveal=button("ترجمة الكلمة",()=>{const show=translation.hidden;translation.hidden=!show;reveal.textContent=show?"إخفاء الترجمة":"ترجمة الكلمة";reveal.setAttribute("aria-expanded",String(show));});reveal.setAttribute("aria-expanded","false");actions.append(reveal);card.append(title,actions,translation);vocabularyList.append(card);});
if(quizArea){
  const sectionNames={choice:"أولًا: اختيار من متعدد (1–5)",fill:"ثانيًا: أكمل الفراغ مع الخيارات (6–10)",match:"ثالثًا: التوصيل بالأرقام (11–15)",truefalse:"رابعًا: صح أم خطأ (16–20)"};
  let previousType="";
  questions.forEach((q,i)=>{
    if(q.type!==previousType){const section=document.createElement("h3");section.className="quiz-section-title";section.textContent=sectionNames[q.type];quizArea.append(section);previousType=q.type;}
    const block=document.createElement("div");block.className="quiz-question";
    const heading=document.createElement("p");heading.textContent=(i+1)+". "+q.q;
    const group=document.createElement("div");group.className="quiz-options";
    q.displayOrder.forEach(originalIndex=>{
      const label=document.createElement("label");label.className="quiz-option";
      const input=document.createElement("input");input.type="radio";input.name="question-"+i;input.value=String(originalIndex);
      const span=document.createElement("span");span.textContent=q.a[originalIndex];
      label.append(input,span);group.append(label);
    });
    block.append(heading,group);quizArea.append(block);
  });
}
const stop=button("■ إيقاف النطق",()=>{if("speechSynthesis"in window)window.speechSynthesis.cancel();});stop.classList.add("stop-speech");
const speedInput=$("#speech-speed");if(speedInput)speedInput.addEventListener("input",e=>{$("#speed-value").textContent=Number(e.target.value).toFixed(2)+"×";});
const finishButton=$("#finish-quiz");
if(finishButton)finishButton.addEventListener("click",()=>{
  let answered=0;
  const answers=[];
  questions.forEach((q,i)=>{
    const selected=document.querySelector('input[name="question-'+i+'"]:checked');
    if(selected){answers[i]=Number(selected.value);answered++;}
  });
  if(answered!==questions.length){
    $("#quiz-result").textContent="أكمل جميع الأسئلة أولًا. أجبت عن "+answered+" من "+questions.length+".";
    return;
  }
  const score=answers.reduce((sum,a,i)=>sum+(a===questions[i].correct?1:0),0);
  const wrongAnswers=questions.reduce((items,q,i)=>{
    if(answers[i]!==q.correct)items.push({question:q.q,selected:q.a[answers[i]],correct:q.a[q.correct]});
    return items;
  },[]);
  try{
    sessionStorage.setItem("art-of-advertising:attempt-result:v1",JSON.stringify({score,total:questions.length,wrongAnswers}));
    window.location.assign("./results.html");
  }catch(_){
    $("#quiz-result").textContent="تعذر فتح صفحة النتيجة. يرجى السماح بتخزين الجلسة في المتصفح ثم المحاولة مجددًا.";
  }
});
const speedRow=$(".speed-control");if(speedRow)speedRow.append(stop);
})();