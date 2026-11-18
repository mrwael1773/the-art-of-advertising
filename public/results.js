(() => {
  "use strict";
  const RESULT_KEY = "art-advertising:attempt-result:v1";
  const unavailable = document.querySelector("#result-unavailable");
  const content = document.querySelector("#result-content");
  const raw = (() => { try { return sessionStorage.getItem(RESULT_KEY); } catch (_) { return null; } })();
  let result = null;
  try { result = raw ? JSON.parse(raw) : null; } catch (_) {}

  const valid = result &&
    Number.isInteger(result.score) &&
    Number.isInteger(result.total) &&
    result.total === 26 &&
    result.score >= 0 && result.score <= 26 &&
    Array.isArray(result.wrongAnswers) &&
    result.wrongAnswers.length === 26 - result.score &&
    result.wrongAnswers.every(item =>
      item && typeof item.id === "string" &&
      typeof item.prompt === "string" &&
      typeof item.selected === "string" &&
      typeof item.correct === "string" &&
      typeof item.evidence === "string"
    );

  if (!valid) {
    unavailable.hidden = false;
    return;
  }

  content.hidden = false;
  document.querySelector("#final-score").textContent = result.score + " / " + result.total;
  document.querySelector("#score-caption").textContent = "إجابة صحيحة من أصل 26 سؤالًا";

  const allCorrect = document.querySelector("#all-correct");
  const wrongSection = document.querySelector("#wrong-section");
  const list = document.querySelector("#wrong-answers");
  if (result.wrongAnswers.length === 0) {
    allCorrect.hidden = false;
    wrongSection.hidden = true;
  } else {
    result.wrongAnswers.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "wrong-answer";
      const title = document.createElement("h3");
      title.textContent = (index + 1) + ". " + item.prompt;
      const selected = document.createElement("p");
      selected.className = "wrong-choice";
      selected.textContent = "إجابتك: " + item.selected;
      const correct = document.createElement("p");
      correct.className = "right-choice";
      correct.textContent = "الإجابة الصحيحة: " + item.correct;
      const link = document.createElement("a");
      link.className = "button evidence-button";
      link.textContent = "راجع الدليل في القطعة";
      const url = new URL("./textbook.html", window.location.href);
      url.searchParams.set("target", item.evidence);
      url.searchParams.set("return", "results.html#wrong-" + item.id);
      link.href = url.href;
      card.id = "wrong-" + item.id;
      card.append(title, selected, correct, link);
      list.append(card);
    });
  }

  const hashId = decodeURIComponent(window.location.hash.slice(1));
  if (hashId) {
    const target = document.getElementById(hashId);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }
})();