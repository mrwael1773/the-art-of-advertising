(() => {
"use strict";
const storageKey="art-of-advertising:attempt-result:v1";
const unavailable=document.querySelector("#result-unavailable");
const content=document.querySelector("#result-content");
let raw=null;
try{
  raw=sessionStorage.getItem(storageKey);
  sessionStorage.removeItem(storageKey);
}catch(_){}
let result=null;
try{result=raw?JSON.parse(raw):null;}catch(_){}
const valid=result&&Number.isInteger(result.score)&&Number.isInteger(result.total)&&result.total===15&&result.score>=0&&result.score<=result.total&&Array.isArray(result.wrongAnswers)&&result.wrongAnswers.length===result.total-result.score&&result.wrongAnswers.every(item=>item&&typeof item.question==="string"&&typeof item.selected==="string"&&typeof item.correct==="string");
if(!valid){unavailable.hidden=false;unavailable.textContent="النتيجة غير متاحة. ابدأ محاولة جديدة من صفحة التمارين.";return;}
content.hidden=false;
document.querySelector("#final-score").textContent=result.score+" / "+result.total;
const list=document.querySelector("#wrong-answers");
if(result.wrongAnswers.length===0){document.querySelector("#all-correct").hidden=false;return;}
result.wrongAnswers.forEach((item,index)=>{
  const card=document.createElement("article");card.className="wrong-answer";
  const question=document.createElement("p");question.className="wrong-question";question.textContent=(index+1)+". "+item.question;
  const selected=document.createElement("p");selected.className="answer-line";const selectedLabel=document.createElement("strong");selectedLabel.textContent="إجابتك: ";selected.append(selectedLabel,document.createTextNode(item.selected));
  const correct=document.createElement("p");correct.className="answer-line correct-line";const correctLabel=document.createElement("strong");correctLabel.textContent="الإجابة الصحيحة: ";correct.append(correctLabel,document.createTextNode(item.correct));
  card.append(question,selected,correct);list.append(card);
});
})();