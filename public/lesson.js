(() => {
"use strict";
// Preserve locally stored student progress when opening the lesson.
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

// Individual word meanings used by the clickable textbook and sentence text.
// Kept separate from the 43-item vocabulary lesson so its scope does not change.
const extraWordMeanings = [
["a","أداة تنكير"],["able","قادر على"],["accept","يقبل"],["across","عبر / في أنحاء"],["aimed","موجّه"],["airlines","شركات الطيران"],["all","كل"],["american","أمريكي"],["an","أداة تنكير"],["and","و"],["are","يكونون / تكون"],["around","حول"],["as","كما / بصفته"],["asked","سأل"],["at","في"],["back","إلى الخلف / يستعيد"],["bank","بنك"],["be","يكون"],["became","أصبح"],["been","كان"],["before","قبل"],["beijing","بكين"],["being","كونه"],["board","لوحية"],["businesses","شركات"],["businessman","رجل أعمال"],["but","لكن"],["by","بحلول / بواسطة"],["called","يُسمّى"],["came","جاءت"],["can","يستطيع"],["canada","كندا"],["cards","بطاقات"],["carried","حمل"],["carrying","يحمل"],["cashed","استغلّ"],["changed","غيّر"],["charge","الدفع / يحمّل على الحساب"],["charging","الدفع بالبطاقة"],["check","الفاتورة"],["club","نادي"],["corporation","شركة"],["craze","رواج / هوس"],["created","أُنشئ"],["cuba","كوبا"],["department","قسم"],["diner","داينرز"],["dinner","عشاء"],["employee","موظف"],["entirely","بالكامل"],["event","حدث"],["ever","منذ ذلك الحين"],["every","كل"],["express","إكسبريس"],["famous","مشهور"],["first","أول"],["for","لـ / من أجل"],["forgot","نسي"],["form","شكل / طريقة"],["forth","وما إلى ذلك"],["france","فرنسا"],["frank","فرانك"],["free","مجاني"],["from","من"],["game","لعبة"],["gangster","رجل عصابات"],["gave","قدّم"],["get","يحصل على / يستعيد"],["had","كان لديه"],["has","لديه"],["have","لديه / يملك"],["he","هو"],["himself","نفسه"],["his","ـه / الخاص به"],["hollywood","هوليوود"],["hundreds","مئات"],["idea","فكرة"],["ideal","إيديل"],["in","في"],["instead","بدلًا من"],["is","يكون"],["issues","يُصدر"],["it","هو / ذلك"],["its","ـه / الخاص به"],["job","وظيفة"],["joined","انضمّ"],["keep","يحتفظ"],["known","معروف"],["later","لاحقًا"],["left","ترك"],["local","محلي"],["man","رجل"],["many","كثير"],["mastercard","ماستركارد"],["mcnamara","ماكنمارا"],["members","أعضاء"],["miles","أميال"],["mostly","في الغالب"],["movie","فيلم"],["new","جديد"],["night","ليلة"],["now","الآن"],["of","من / لـ"],["offer","تقدّم"],["on","على"],["or","أو"],["order","لكي / ترتيب"],["other","آخر / أخرى"],["outside","خارج"],["paid","دفع"],["pay","يدفع"],["people","الناس"],["picked","تبنّى"],["plastic","بلاستيك"],["presented","قدّم"],["products","منتجات"],["program","برنامج"],["programs","برامج"],["quickly","بسرعة"],["realized","أدرك"],["revolutionized","أحدث تحولًا جذريًا"],["reward","مكافأة"],["same","نفسه"],["should","ينبغي"],["simply","ببساطة"],["since","منذ"],["small","صغير"],["so","لذلك"],["solved","حُلّ"],["soon","سرعان ما"],["special","خاص"],["spend","ينفق"],["started","بدأ"],["states","الولايات"],["store","متجر"],["such","مثل"],["suit","بدلة"],["suits","بدلات"],["supermarket","متجر كبير"],["supper","عشاء"],["ten","عشرة"],["that","ذلك / الذي"],["the","أداة التعريف (الـ)"],["there","هناك"],["they","هم"],["this","هذا"],["those","أولئك"],["thousands","آلاف"],["to","إلى / أن"],["today","اليوم"],["toy","لعبة"],["travelers","مسافرون"],["united","المتحدة"],["universe","عالم"],["until","حتى"],["up","إلى / للأعلى"],["use","يستخدم"],["used","استخدم / استُخدم"],["users","مستخدمون"],["valuable","قيّم"],["visa","فيزا"],["waiter","نادل"],["was","كان"],["way","طريقة"],["well","جيدًا"],["western","ويسترن"],["what","ماذا / ما"],["when","عندما"],["whether","سواء"],["who","من"],["why","لماذا"],["with","مع"],["without","بدون"],["world","العالم"],["would","قد / سوف"],["year","عام"],["years","أعوام"],["york","يورك"],["you","أنت"],
["credit","ائتمان"],["card","بطاقة"],["status","مكانة"],["symbol","رمز"],["cultural","ثقافي"],["icon","رمز"],["car","سيارة"],["rentals","تأجير"]
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
const readingList=$("#reading-list"), vocabularyList=$("#vocabulary-list"), quizArea=$("#quiz-area"), textbookPage=$("#textbook-page");
if(!readingList&&!vocabularyList&&!quizArea&&!textbookPage)return;
function say(text){if(!("speechSynthesis"in window)){ $("#lesson-message").textContent="النطق غير مدعوم في هذا المتصفح أو الجهاز.";return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=Number($("#speech-speed")?.value||0.85);window.speechSynthesis.speak(u);}
function button(label,fn){const b=document.createElement("button");b.type="button";b.className="mini-button";b.textContent=label;b.addEventListener("click",fn);return b;}
const wordMeanings=new Map([...words,...extraWordMeanings].map(([word,meaning])=>[word.toLowerCase(),meaning]));
function makeClickableSentence(text,target,wordTools){
  const parts=text.match(/[\p{L}\p{N}’']+|[^\p{L}\p{N}’']+/gu)||[text];
  let selectedWord="";
  const meaningOutput=document.createElement("span");
  meaningOutput.className="selected-word-meaning";
  meaningOutput.hidden=true;
  const listenWord=button("🔊 استمع للكلمة",()=>{if(selectedWord)say(selectedWord);});
  const translateWord=button("ترجمة الكلمة",()=>{
    if(!selectedWord)return;
    const meaning=wordMeanings.get(selectedWord.toLowerCase().replace(/[’']s$/,""));
    meaningOutput.textContent=meaning?selectedWord+" = "+meaning:"لا تتوفر ترجمة لهذه الكلمة حاليًا.";
    meaningOutput.hidden=false;
  });
  wordTools.append(listenWord,translateWord,meaningOutput);
  parts.forEach(part=>{
    if(/^\p{L}[\p{L}\p{N}’']*$/u.test(part)){
      const token=document.createElement("button");
      token.type="button";token.className="word-token";token.textContent=part;
      token.setAttribute("aria-label","تحديد كلمة "+part);
      token.setAttribute("aria-pressed","false");
      token.addEventListener("click",()=>{
        target.querySelectorAll(".word-token.selected").forEach(active=>{
          active.classList.remove("selected");active.setAttribute("aria-pressed","false");
        });
        selectedWord=part;
        token.classList.add("selected");token.setAttribute("aria-pressed","true");
        wordTools.hidden=false;
        meaningOutput.hidden=true;meaningOutput.textContent="";
      });
      target.append(token);
    }else target.append(document.createTextNode(part));
  });
}
if(textbookPage){
  const leftColumn=document.createElement("div");leftColumn.className="textbook-column textbook-column-left";
  const rightColumn=document.createElement("div");rightColumn.className="textbook-column textbook-column-right";
  const cardStack=document.createElement("figure");cardStack.className="textbook-art textbook-card-stack";cardStack.setAttribute("aria-label","Illustration of plastic credit cards");
  cardStack.innerHTML='<svg viewBox="0 0 420 190" role="img" aria-hidden="true"><defs><linearGradient id="cardBlue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2477d4"/><stop offset="1" stop-color="#0b347e"/></linearGradient><linearGradient id="cardGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7d36d"/><stop offset="1" stop-color="#c58b24"/></linearGradient></defs><ellipse cx="214" cy="165" rx="184" ry="16" fill="#142d4d" opacity=".12"/><g transform="translate(78 15) rotate(-12 130 72)"><rect width="270" height="150" rx="17" fill="#172b45"/><rect x="12" y="12" width="246" height="126" rx="13" fill="#e8edf5"/><text x="30" y="43" font-size="15" font-family="Arial" font-weight="700" fill="#43546b">CREDIT CARD</text></g><g transform="translate(42 24) rotate(8 130 72)"><rect width="270" height="150" rx="17" fill="url(#cardGold)"/><text x="25" y="38" font-size="15" font-family="Arial" font-weight="700" fill="#704d12">CREDIT CARD</text><rect x="25" y="57" width="40" height="28" rx="5" fill="#f7e3a2"/></g><g transform="translate(75 40) rotate(-3 130 72)"><rect width="270" height="150" rx="17" fill="url(#cardBlue)"/><text x="25" y="38" font-size="15" font-family="Arial" font-weight="700" fill="#fff">CREDIT CARD</text><rect x="25" y="57" width="40" height="28" rx="5" fill="#f4d27a"/><path d="M25 70h40M45 57v28" stroke="#c28e2d" stroke-width="2"/><text x="25" y="119" font-size="16" letter-spacing="3" font-family="Arial" fill="#fff">••••  ••••  ••••</text></g></svg>';
  rightColumn.append(cardStack);
  const paymentArt=document.createElement("figure");paymentArt.className="textbook-art textbook-payment-art";paymentArt.setAttribute("aria-label","Illustration of a plastic card being used at a payment terminal");
  paymentArt.innerHTML='<svg viewBox="0 0 420 210" role="img" aria-hidden="true"><defs><linearGradient id="terminal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#596779"/><stop offset="1" stop-color="#18283c"/></linearGradient><linearGradient id="tapCard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2685e7"/><stop offset="1" stop-color="#123c8a"/></linearGradient></defs><ellipse cx="206" cy="190" rx="178" ry="12" fill="#142d4d" opacity=".13"/><g transform="translate(28 65)"><path d="M30 38 220 8q20-3 24 17l17 102q3 18-16 22L55 179q-18 3-22-16L14 61q-4-18 16-23Z" fill="url(#terminal)"/><path d="m52 52 158-25 12 67-158 25Z" fill="#a9bfd1"/><path d="m65 127 150-24" stroke="#8193a5" stroke-width="3"/><g fill="#d7e0e9"><rect x="66" y="137" width="22" height="12" rx="3"/><rect x="96" y="132" width="22" height="12" rx="3"/><rect x="126" y="127" width="22" height="12" rx="3"/><rect x="156" y="122" width="22" height="12" rx="3"/></g><rect x="185" y="137" width="27" height="14" rx="4" fill="#28a66a"/><rect x="151" y="145" width="27" height="14" rx="4" fill="#e8b23d"/></g><g transform="translate(194 12) rotate(-12 85 55)"><rect width="175" height="108" rx="13" fill="url(#tapCard)"/><text x="16" y="26" font-size="11" font-family="Arial" font-weight="700" fill="#fff">CREDIT CARD</text><rect x="16" y="39" width="28" height="21" rx="4" fill="#f3d17a"/><path d="M22 49h16M30 39v21" stroke="#b98832" stroke-width="1.5"/><path d="M58 47q12 8 0 16m8-21q18 13 0 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g></svg>';
  paragraphs.forEach((sentences,i)=>{
    const block=document.createElement("section");block.className="textbook-paragraph";
    const number=document.createElement("span");number.className="textbook-paragraph-number";number.textContent=String(i+1);
    const content=document.createElement("div");content.className="textbook-paragraph-content";
    sentences.forEach(([en,ar])=>{
      const row=document.createElement("div");row.className="sentence-row";
      const english=document.createElement("p");english.className="sentence-en";
      const wordTools=document.createElement("div");wordTools.className="word-action-panel";wordTools.hidden=true;
      makeClickableSentence(en,english,wordTools);
      const actions=document.createElement("div");actions.className="mini-actions";
      actions.append(button("🔊 استمع",()=>say(en)));
      const translation=document.createElement("p");translation.className="sentence-ar";translation.hidden=true;translation.textContent=ar;
      const reveal=button("ترجمة",()=>{const show=translation.hidden;translation.hidden=!show;reveal.textContent=show?"إخفاء":"ترجمة";reveal.setAttribute("aria-expanded",String(show));});
      reveal.setAttribute("aria-expanded","false");actions.append(reveal);
      row.append(english,actions,wordTools,translation);content.append(row);
    });
    block.append(number,content);
    (i<3?leftColumn:rightColumn).append(block);
    if(i===1)leftColumn.append(paymentArt);
  });
  textbookPage.append(leftColumn,rightColumn);
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
  // Matching questions form one-to-one pairs: a numbered Arabic meaning can be used once.
  const matchingInputs=[...quizArea.querySelectorAll('input[name^="question-"]')]
    .filter(input=>questions[Number(input.name.split("-")[1])]?.type==="match");
  const refreshMatchingOptions=()=>{
    const selectedByQuestion=new Map();
    matchingInputs.forEach(input=>{
      if(input.checked)selectedByQuestion.set(input.name,input.value);
    });
    matchingInputs.forEach(input=>{
      const usedElsewhere=[...selectedByQuestion.entries()]
        .some(([question,value])=>question!==input.name&&value===input.value);
      input.disabled=usedElsewhere;
    });
  };
  matchingInputs.forEach(input=>input.addEventListener("change",refreshMatchingOptions));
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