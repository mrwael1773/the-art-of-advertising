import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [
  worker, config, index, textbook, quiz, results, content, reader, practice, resultScript, headers, styles, readme
] = await Promise.all([
  read("../src/worker.js"), read("../wrangler.toml"),
  read("../public/index.html"), read("../public/textbook.html"),
  read("../public/quiz.html"), read("../public/results.html"),
  read("../public/art-content.js"), read("../public/reader.js"),
  read("../public/practice.js"), read("../public/results.js"),
  read("../public/_headers"), read("../public/styles.css"),
  read("../README.md")
]);

const sandbox = { window: {} };
vm.runInNewContext(content, sandbox);
const lesson = sandbox.window.ART_LESSON;

test("static Worker security policy allows only the lesson audio host", () => {
  assert.match(worker, /x-content-type-options/);
  assert.match(worker, /x-frame-options/);
  assert.match(worker, /referrer-policy/);
  assert.match(worker, /cross-origin-resource-policy/);
  assert.match(worker, /media-src 'self' https:\/\/resource2\.heygen\.ai/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
  assert.doesNotMatch(worker, /env\.DB|D1|\/api\//);
  assert.doesNotMatch(config, /d1_databases|database_id|binding = "DB"/);
  assert.match(headers, /media-src 'self' https:\/\/resource2\.heygen\.ai/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
});

test("home and lesson pages navigate to the two requested learning sections", () => {
  assert.match(index, /The Art of Advertising/);
  assert.match(index, /href="\.\/textbook\.html"/);
  assert.match(index, /href="\.\/quiz\.html"/);
  assert.match(textbook, /id="reading-content"/);
  assert.match(textbook, /id="lesson-audio"/);
  assert.match(textbook, /id="play-all"/);
  assert.match(textbook, /id="pause-audio"/);
  assert.match(textbook, /id="resume-audio"/);
  assert.match(textbook, /id="stop-audio"/);
  assert.match(textbook, /id="speech-speed"/);
  assert.match(textbook, /min="0\.25"/);
  assert.match(textbook, /max="1"/);
  assert.match(textbook, /reader\.js/);
  assert.match(quiz, /B\. Comprehension/);
  assert.match(quiz, /id="quick-check-list"/);
  assert.match(quiz, /id="practice-groups"/);
  assert.match(quiz, /practice\.js/);
  assert.match(results, /النتيجة النهائية/);
  assert.doesNotMatch(index + textbook + quiz + results, /The World of Plastic|credit cards/i);
});

test("the paraphrased lesson contains four passage sections and nineteen timed sentences", () => {
  assert.ok(lesson && lesson.title === "The Art of Advertising");
  assert.equal(lesson.sections.length, 4);
  assert.equal(lesson.sentences.length, 19);
  assert.equal(new Set(lesson.sentences.map(item => item.id)).size, 19);
  assert.ok(lesson.sentences.every(item =>
    typeof item.text === "string" && item.text.length > 15 &&
    Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start
  ));
  const byId = new Map(lesson.sentences.map(item => [item.id, item]));
  for (const section of lesson.sections) {
    assert.ok(section.sentenceIds.length >= 3);
    for (const id of section.sentenceIds) assert.ok(byId.has(id), "Unknown passage sentence: " + id);
  }
  const ordered = lesson.sentences.slice().sort((a,b) => a.start - b.start);
  for (let i = 1; i < ordered.length; i++) {
    assert.ok(ordered[i].start >= ordered[i-1].end, "Sentence timing ranges overlap.");
  }
  assert.match(lesson.audio.src, /^https:\/\/resource2\.heygen\.ai\/text_to_speech\//);
  assert.ok(lesson.audio.duration > 80 && lesson.audio.duration < 100);
  assert.match(lesson.audio.voice, /Craig/);
});

test("all six comprehension and twenty practice questions point to a valid sentence", () => {
  assert.equal(lesson.quickCheck.length, 6);
  assert.equal(lesson.practice.length, 4);
  assert.deepEqual(Array.from(lesson.practice, group => group.questions.length), [5,5,5,5]);
  assert.deepEqual(Array.from(lesson.practice, group => group.id), ["choice","fill","meaning","truefalse"]);
  const sentenceIds = new Set(lesson.sentences.map(item => item.id));
  for (const question of lesson.quickCheck.concat(...lesson.practice.map(group => group.questions))) {
    assert.ok(sentenceIds.has(question.evidence), "Evidence missing for " + question.id);
    assert.ok(question.options.length >= 2);
    assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < question.options.length);
  }
  assert.ok(lesson.practice.find(group => group.id === "meaning").questions.every(q => q.options.length === 5));
});

test("reader synchronizes sentence highlighting and supports seeking and return links", () => {
  assert.match(reader, /addEventListener\("timeupdate", syncHighlight\)/);
  assert.match(reader, /audio\.currentTime = sentence\.start/);
  assert.match(reader, /audio\.playbackRate = rate/);
  assert.match(reader, /pauseButton\.addEventListener/);
  assert.match(reader, /resumeButton\.addEventListener/);
  assert.match(reader, /stopButton\.addEventListener/);
  assert.match(reader, /is-speaking/);
  assert.match(reader, /is-evidence/);
  assert.match(reader, /return-banner/);
});

test("quick check gates evidence navigation, while exercises expose evidence buttons", () => {
  assert.match(practice, /selected !== question\.correct/);
  assert.match(practice, /jumpToEvidence\(question\)/);
  assert.match(practice, /sessionStorage\.setItem\(ANSWERS_KEY/);
  assert.match(practice, /art-advertising:attempt-result:v1/);
  assert.match(practice, /window\.location\.assign\("\.\/results\.html"\)/);
  assert.match(practice, /mode === "matching"/);
  assert.doesNotMatch(practice, /localStorage|fetch\(|\/api\//);
  assert.match(resultScript, /result\.total === 26/);
  assert.match(resultScript, /راجع الدليل في القطعة/);
});

test("active lesson does not collect personal identity or use network progress APIs", () => {
  assert.doesNotMatch(index + textbook + quiz + results + reader + practice + resultScript, /type="password"|username|email|login|register|localStorage|fetch\(|\/api\//i);
  assert.match(readme, /sessionStorage/i);
  assert.match(readme, /The Art of Advertising/);
});

test("responsive theme and all interactive controls have visible focus styles", () => {
  assert.match(styles, /@media\(max-width:620px\)/);
  assert.match(styles, /@media\(max-width:360px\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /\.passage-sentence\.is-speaking/);
  assert.match(styles, /\.passage-sentence\.is-evidence/);
});