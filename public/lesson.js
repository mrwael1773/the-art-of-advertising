(() => {
"use strict";
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
["credit","ائتمان"],["card","بطاقة"],["status","مكانة"],["symbol","رمز"],["cultural","ثقافي"],["icon","رمز"],["car","سيارة"],["rentals","تأجير"],["charge-it","الدفع بالبطاقة"],["well-known","معروف"]
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
{type:"match",q:"Match the word “cash” with its Arabic meaning.",a:["نقد","محفظة","تجّار","خصومات","مكافآت"],correct:0},
{type:"match",q:"Match the word “wallet” with its Arabic meaning.",a:["نقد","محفظة","تجّار","خصومات","مكافآت"],correct:1},
{type:"match",q:"Match the word “merchants” with its Arabic meaning.",a:["نقد","محفظة","تجّار","خصومات","مكافآت"],correct:2},
{type:"match",q:"Match the word “discounts” with its Arabic meaning.",a:["نقد","محفظة","تجّار","خصومات","مكافآت"],correct:3},
{type:"match",q:"Match the word “rewards” with its Arabic meaning.",a:["نقد","محفظة","تجّار","خصومات","مكافآت"],correct:4},
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
  const sentenceData=paragraphs.flat();
  const wordPattern=/[A-Za-z0-9]+(?:[’'][A-Za-z]+)?(?:-[A-Za-z]+)?/g;
  const wordsBySentence=sentenceData.map(([en])=>en.match(wordPattern)||[]);
  const hotspots=Array.isArray(window.PAGE60_WORD_HOTSPOTS)?window.PAGE60_WORD_HOTSPOTS:[];
  const expectedWordCount=wordsBySentence.reduce((sum,list)=>sum+list.length,0);
  const message=$("#lesson-message");
  const imageWrap=document.createElement("div");
  imageWrap.className="textbook-image-wrap";
  const image=document.createElement("img");
  image.id="textbook-source-image";
  image.className="textbook-source-image";
  image.src="./assets/the-world-of-plastic-page60.svg";
  image.alt="صورة صفحة الكتاب الأصلية: The World of Plastic، صفحة 60";
  image.width=646;
  image.height=639;
  image.decoding="async";
  image.draggable=false;
  image.addEventListener("error",()=>{message.textContent="تعذر تحميل صورة القطعة الأصلية.";});
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.id="textbook-hotspots";
  svg.classList.add("textbook-hotspots");
  svg.setAttribute("viewBox","0 0 646 639");
  svg.setAttribute("preserveAspectRatio","none");
  svg.setAttribute("role","group");
  svg.setAttribute("aria-label","مناطق الضغط على جمل وكلمات القطعة");
  const sentenceHitLayer=document.createElementNS(svgNS,"g");
  const wordHitLayer=document.createElementNS(svgNS,"g");
  const highlightLayer=document.createElementNS(svgNS,"g");
  highlightLayer.setAttribute("class","textbook-highlight-layer");
  highlightLayer.setAttribute("aria-hidden","true");

  const sentenceLines=new Map();
  hotspots.forEach(([sentenceIndex,wordIndex,x,y,width,height])=>{
    const rows=sentenceLines.get(sentenceIndex)||[];
    const center=y+(height/2);
    let row=rows.find(item=>Math.abs(item.center-center)<=6);
    if(!row){
      row={left:x,right:x+width,top:y,bottom:y+height,center:center};
      rows.push(row);
    }else{
      row.left=Math.min(row.left,x);
      row.right=Math.max(row.right,x+width);
      row.top=Math.min(row.top,y);
      row.bottom=Math.max(row.bottom,y+height);
      row.center=(row.center+center)/2;
    }
    sentenceLines.set(sentenceIndex,rows);
  });
  sentenceLines.forEach((rows,sentenceIndex)=>{
    rows.sort((a,b)=>a.top-b.top);
    rows.forEach((row,lineIndex)=>{
      const rect=document.createElementNS(svgNS,"rect");
      rect.setAttribute("class","sentence-hit");
      rect.setAttribute("x",String(Math.max(0,row.left-3)));
      rect.setAttribute("y",String(Math.max(0,row.top-2)));
      rect.setAttribute("width",String(Math.min(646,row.right+3)-Math.max(0,row.left-3)));
      rect.setAttribute("height",String(Math.min(639,row.bottom+2)-Math.max(0,row.top-2)));
      rect.dataset.sentenceIndex=String(sentenceIndex);
      rect.setAttribute("tabindex","0");
      rect.setAttribute("role","button");
      rect.setAttribute("aria-label","تحديد الجملة رقم "+(sentenceIndex+1));
      rect.setAttribute("aria-pressed","false");
      sentenceHitLayer.append(rect);
    });
  });

  hotspots.forEach(([sentenceIndex,wordIndex,x,y,width,height])=>{
    const word=(wordsBySentence[sentenceIndex]||[])[wordIndex]||"";
    const rect=document.createElementNS(svgNS,"rect");
    const hitWidth=Math.max(8,width);
    const hitHeight=Math.max(12,height+4);
    rect.setAttribute("class","word-hit");
    rect.setAttribute("x",String(Math.max(0,x-(hitWidth-width)/2)));
    rect.setAttribute("y",String(Math.max(0,y-(hitHeight-height)/2)));
    rect.setAttribute("width",String(hitWidth));
    rect.setAttribute("height",String(hitHeight));
    rect.dataset.sentenceIndex=String(sentenceIndex);
    rect.dataset.wordIndex=String(wordIndex);
    rect.dataset.wordText=word;
    rect.setAttribute("tabindex","0");
    rect.setAttribute("role","button");
    rect.setAttribute("aria-label","تحديد كلمة "+word);
    rect.setAttribute("aria-pressed","false");
    wordHitLayer.append(rect);
  });

  svg.append(sentenceHitLayer,wordHitLayer,highlightLayer);
  imageWrap.append(image,svg);
  textbookPage.replaceChildren(imageWrap);

  const selectionPanel=$("#textbook-selection");
  const selectionLabel=$("#textbook-selection-label");
  const listenButton=$("#textbook-listen");
  const translateButton=$("#textbook-translate");
  const translationOutput=$("#textbook-translation");
  let selectedSentenceIndex=-1;
  let selectedWordIndex=-1;

  function addHighlightRect(x,y,width,height,className){
    const rect=document.createElementNS(svgNS,"rect");
    rect.setAttribute("class",className);
    rect.setAttribute("x",String(Math.max(0,x-1.5)));
    rect.setAttribute("y",String(Math.max(0,y-2)));
    rect.setAttribute("width",String(Math.min(646,x+width+1.5)-Math.max(0,x-1.5)));
    rect.setAttribute("height",String(Math.min(639,y+height+4)-Math.max(0,y-2)));
    highlightLayer.append(rect);
  }
  function updatePressedState(){
    sentenceHitLayer.querySelectorAll(".sentence-hit").forEach(node=>{
      node.setAttribute("aria-pressed",String(Number(node.dataset.sentenceIndex)===selectedSentenceIndex&&selectedWordIndex<0));
    });
    wordHitLayer.querySelectorAll(".word-hit").forEach(node=>{
      node.setAttribute("aria-pressed",String(Number(node.dataset.sentenceIndex)===selectedSentenceIndex&&Number(node.dataset.wordIndex)===selectedWordIndex));
    });
  }
  function redrawHighlight(){
    highlightLayer.replaceChildren();
    if(selectedSentenceIndex<0)return;
    if(selectedWordIndex<0){
      (sentenceLines.get(selectedSentenceIndex)||[]).forEach(row=>{
        addHighlightRect(row.left,row.top,row.right-row.left,row.bottom-row.top,"sentence-highlight");
      });
    }else{
      const box=hotspots.find(item=>item[0]===selectedSentenceIndex&&item[1]===selectedWordIndex);
      if(box)addHighlightRect(box[2],box[3],box[4],box[5],"word-highlight");
    }
    updatePressedState();
  }
  function showSelection(label){
    selectionPanel.hidden=false;
    selectionLabel.textContent=label;
    translationOutput.hidden=true;
    translationOutput.textContent="";
    if("speechSynthesis"in window)window.speechSynthesis.cancel();
  }
  function selectSentence(sentenceIndex){
    selectedSentenceIndex=sentenceIndex;
    selectedWordIndex=-1;
    showSelection("تم تحديد الجملة");
    redrawHighlight();
  }
  function selectWord(sentenceIndex,wordIndex){
    selectedSentenceIndex=sentenceIndex;
    selectedWordIndex=wordIndex;
    const word=(wordsBySentence[sentenceIndex]||[])[wordIndex]||"";
    showSelection("تم تحديد الكلمة: "+word);
    redrawHighlight();
  }
  function clearSelection(){
    selectedSentenceIndex=-1;
    selectedWordIndex=-1;
    selectionPanel.hidden=true;
    translationOutput.hidden=true;
    highlightLayer.replaceChildren();
    updatePressedState();
    if("speechSynthesis"in window)window.speechSynthesis.cancel();
  }
  function handleHotspot(target){
    const sentenceIndex=Number(target.dataset.sentenceIndex);
    const wordIndex=target.classList.contains("word-hit")?Number(target.dataset.wordIndex):-1;
    if(sentenceIndex!==selectedSentenceIndex){
      selectSentence(sentenceIndex);
      return;
    }
    if(wordIndex>=0){
      selectWord(sentenceIndex,wordIndex);
      return;
    }
    selectSentence(sentenceIndex);
  }
  svg.addEventListener("click",event=>{
    const target=event.target.closest(".word-hit,.sentence-hit");
    if(target){handleHotspot(target);return;}
    if(event.target===svg)clearSelection();
  });
  svg.addEventListener("keydown",event=>{
    if(event.key!=="Enter"&&event.key!==" ")return;
    const target=event.target.closest(".word-hit,.sentence-hit");
    if(!target)return;
    event.preventDefault();
    handleHotspot(target);
  });
  listenButton.addEventListener("click",()=>{
    if(selectedSentenceIndex<0)return;
    const text=selectedWordIndex>=0
      ?(wordsBySentence[selectedSentenceIndex]||[])[selectedWordIndex]
      :sentenceData[selectedSentenceIndex][0];
    if(text)say(text);
  });
  translateButton.addEventListener("click",()=>{
    if(selectedSentenceIndex<0)return;
    if(selectedWordIndex>=0){
      const word=(wordsBySentence[selectedSentenceIndex]||[])[selectedWordIndex]||"";
      const key=word.toLowerCase().replace(/[’']s$/,"");
      let meaning=wordMeanings.get(key);
      if(!meaning&&key.includes("-")){
        meaning=key.split("-").map(part=>wordMeanings.get(part)).filter(Boolean).join(" – ");
      }
      translationOutput.textContent=meaning?word+" = "+meaning:"لا تتوفر ترجمة لهذه الكلمة حاليًا.";
    }else{
      translationOutput.textContent=sentenceData[selectedSentenceIndex][1];
    }
    translationOutput.hidden=false;
  });
  window.addEventListener("keydown",event=>{if(event.key==="Escape")clearSelection();});
  if(hotspots.length!==expectedWordCount){
    message.textContent="تنبيه: تعذر مطابقة بعض مناطق الضغط مع كلمات القطعة.";
  }
}
if(readingList)paragraphs.forEach((sentences,i)=>{const card=document.createElement("article");card.className="reading-card";const top=document.createElement("div");top.className="reading-card-top";const title=document.createElement("strong");title.textContent="الفقرة "+(i+1);const listen=button("🔊 استمع للفقرة",()=>say(sentences.map(x=>x[0]).join(" ")));top.append(title,listen);card.append(top);sentences.forEach(([en,ar])=>{const row=document.createElement("div");row.className="sentence-row";const english=document.createElement("p");english.className="sentence-en";makeClickableSentence(en,english);const actions=document.createElement("div");actions.className="mini-actions";actions.append(button("🔊 استمع للجملة",()=>say(en)));const translation=document.createElement("p");translation.className="sentence-ar";translation.hidden=true;translation.textContent=ar;const reveal=button("إظهار ترجمة الجملة",()=>{const show=translation.hidden;translation.hidden=!show;reveal.textContent=show?"إخفاء الترجمة":"إظهار ترجمة الجملة";reveal.setAttribute("aria-expanded",String(show));});reveal.setAttribute("aria-expanded","false");actions.append(reveal);row.append(english,actions,translation);card.append(row);});readingList.append(card);});
if(vocabularyList)words.forEach(([word,meaning])=>{const card=document.createElement("article");card.className="vocab-card";const title=document.createElement("p");title.className="vocab-word";title.textContent=word;const actions=document.createElement("div");actions.className="mini-actions";actions.append(button("🔊 استمع",()=>say(word)));const translation=document.createElement("p");translation.className="vocab-meaning";translation.hidden=true;translation.textContent=meaning;const reveal=button("ترجمة الكلمة",()=>{const show=translation.hidden;translation.hidden=!show;reveal.textContent=show?"إخفاء الترجمة":"ترجمة الكلمة";reveal.setAttribute("aria-expanded",String(show));});reveal.setAttribute("aria-expanded","false");actions.append(reveal);card.append(title,actions,translation);vocabularyList.append(card);});
if(quizArea){
  const sectionNames={choice:"أولًا: اختيار من متعدد (1–5)",fill:"ثانيًا: أكمل الفراغ مع الخيارات (6–10)",match:"ثالثًا: المعنى (11–15)",truefalse:"رابعًا: صح أم خطأ (16–20)"};
  let previousType="";
  questions.forEach((q,i)=>{
    if(q.type!==previousType){const section=document.createElement("h3");section.className="quiz-section-title";section.textContent=sectionNames[q.type];quizArea.append(section);if(q.type==="match"){const note=document.createElement("p");note.className="quiz-section-note";note.textContent="كل معنى يُستخدم مرة واحدة فقط، ويمكنك تغيير اختيارك في أي سؤال.";quizArea.append(note);}previousType=q.type;}
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
  // Matching is one-to-one, but disabled meanings are clearly marked and
  // become available again when the student changes the earlier answer.
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
      const label=input.closest("label");
      if(label){
        label.classList.toggle("unavailable",usedElsewhere);
        label.setAttribute("aria-disabled",String(usedElsewhere));
      }
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