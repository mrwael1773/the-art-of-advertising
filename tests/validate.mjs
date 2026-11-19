import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [worker, wrangler, home, textbook, quiz, configSource, viewer, quizScript, headers, styles] = await Promise.all([
  read("../src/worker.js"),
  read("../wrangler.toml"),
  read("../public/index.html"),
  read("../public/textbook.html"),
  read("../public/quiz.html"),
  read("../public/art-advertising-config.js"),
  read("../public/art-advertising-viewer.js"),
  read("../public/art-advertising-quiz.js"),
  read("../public/_headers"),
  read("../public/art-advertising.css")
]);

const configMatch = configSource.match(/window\.ART_AD_CONFIG\s*=\s*([\s\S]*);\s*$/);
assert.ok(configMatch, "lesson configuration should be a JavaScript object assignment");
const lessonConfig = JSON.parse(configMatch[1]);
const sentenceIds = new Set(lessonConfig.passageSentences.map(sentence => String(sentence.id)));

test("Worker serves static assets with the required security headers", () => {
  assert.match(worker, /headers\.set\("x-content-type-options", "nosniff"\)/);
  assert.match(worker, /headers\.set\("x-frame-options", "DENY"\)/);
  assert.match(worker, /headers\.set\("referrer-policy", "no-referrer"\)/);
  assert.match(worker, /headers\.set\("cross-origin-resource-policy", "same-origin"\)/);
  assert.match(worker, /content-security-policy/);
  assert.match(worker, /frame-src 'self' blob: https:\/\/drive\.google\.com/);
  assert.match(headers, /frame-src 'self' blob: https:\/\/drive\.google\.com/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
  assert.doesNotMatch(worker, /env\.DB|D1|api/);
  assert.doesNotMatch(wrangler, /d1_databases|database_id|binding = "DB"/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /Cross-Origin-Resource-Policy: same-origin/);
  assert.match(headers, /Content-Security-Policy:/);
});

test("home page links to the reading and exercises pages without account controls", () => {
  assert.match(home, /href="\.\/textbook\.html"/);
  assert.match(home, /href="\.\/quiz\.html"/);
  assert.match(home, /القراءة والاستماع|القطعة/);
  assert.match(home, /التمارين/);
  assert.match(home, /لا تُحفظ إجابات التمارين/);
  assert.doesNotMatch(home, /id="auth-form"|id="login-tab"|id="register-tab"|type="password"/);
});

test("reading page renders original textbook pages with audio and source-position highlighting", () => {
  assert.match(textbook, /id="pdf-page-1"/);
  assert.match(textbook, /id="pdf-page-2"/);
  assert.match(textbook, /class="textLayer"/);
  assert.match(textbook, /pdf\.min\.js/);
  assert.match(textbook, /id="play-reading"/);
  assert.match(textbook, /id="pause-reading"/);
  assert.match(textbook, /id="resume-reading"/);
  assert.match(textbook, /id="stop-reading"/);
  assert.match(textbook, /id="speech-speed"/);
  assert.match(textbook, /min="0\.25"/);
  assert.match(textbook, /max="1"/);
  assert.match(textbook, /id="speech-status"/);
  assert.match(textbook, /source-pdf-link/);
  assert.doesNotMatch(textbook, /passage-sentences|passage-text|book-pdf-file/);
  assert.match(viewer, /pdfjsLib\.getDocument/);
  assert.match(viewer, /renderTextLayer/);
  assert.match(viewer, /sentence-highlight/);
  assert.match(viewer, /getClientRects/);
  assert.match(viewer, /function highlightSpokenWord/);
  assert.match(viewer, /function spokenWordIndex/);
  assert.match(viewer, /utterance\.onboundary/);
  assert.match(viewer, /tokens\[wordIndex\]/);
  assert.match(viewer, /Only the currently spoken word/);
  assert.match(viewer, /sentence-highlight-word/);
  assert.doesNotMatch(viewer, /sentence-highlight-line|const gapLimit|const bands = lines/);
  assert.match(styles, /touch-action:pan-y pinch-zoom/);
  assert.match(styles, /background:rgba\(255,218,75,\.34\)/);
  assert.match(styles, /mix-blend-mode:multiply/);
  assert.match(viewer, /pointerdown/);
  assert.match(viewer, /caretPositionFromPoint/);
  assert.match(textbook, /sentence-highlight-layer/);
  assert.match(textbook, /اضغط على أي جملة/);
  assert.match(viewer, /SpeechSynthesisUtterance/);
  assert.match(viewer, /synth\.pause/);
  assert.match(viewer, /synth\.resume/);
  assert.match(viewer, /playEvidenceSentence/);
  assert.match(viewer, /locateSentenceTokens/);
  assert.match(worker, /script-src/);
  assert.match(worker, /worker-src/);
  assert.match(headers, /script-src/);
});


test("lesson content contains six Quick Check and exactly twenty correctly ordered exercises", () => {
  assert.equal(lessonConfig.passageSentences.length, 23);
  assert.equal(lessonConfig.quickCheckQuestions.length, 6);
  assert.equal(lessonConfig.exercises.length, 20);
  assert.deepEqual(
    lessonConfig.exercises.map(question => question.type),
    [
      ...Array(10).fill("single_select"),
      ...Array(5).fill("fill_blank"),
      ...Array(5).fill("true_false")
    ]
  );
  for (const question of [...lessonConfig.quickCheckQuestions, ...lessonConfig.exercises]) {
    assert.ok(sentenceIds.has(String(question.evidenceId)), "each question must point to an existing evidence sentence");
    if (question.type === "fill_blank") {
      assert.ok(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0);
    } else {
      assert.ok(question.correctAnswer);
      assert.equal(question.options.length, question.type === "true_false" ? 2 : 4);
    }
  }
  assert.ok(lessonConfig.quickCheckQuestions.every(question => question.type === "true_false"));
  assert.ok(lessonConfig.passageSentences.every(sentence => [1, 2].includes(sentence.page)));
  assert.ok(lessonConfig.passageSentences.some(sentence => sentence.text.startsWith("The tiny classic is back, measuring")));
  assert.ok(lessonConfig.passageSentences.some(sentence => sentence.text === "Bicycles were invented in France in the 1790s."));
  assert.ok(lessonConfig.passageSentences.some(sentence => sentence.text.includes("Kirkpatrick MacMillan")));
  assert.ok(lessonConfig.passageSentences.every(sentence => !sentence.text.includes("returned with a fresh design")));
});

test("exercise page keeps Quick Check separate and uses the evidence-aware quiz script", () => {
  assert.match(quiz, /Quick Check/);
  assert.match(quiz, /id="quick-questions"/);
  assert.match(quiz, /id="extra-exercises"/);
  assert.match(quiz, /id="quiz-status"/);
  assert.match(quiz, /ثلاثة أنواع من التمارين/);
  assert.match(quizScript, /evidenceIsValid/);
  assert.match(quizScript, /اعرض مكان الإجابة/);
  assert.match(quizScript, /تحقق من الإجابة/);
  assert.match(quizScript, /missingAnswerKeys/);
  assert.match(quizScript, /missingEvidence/);
  assert.match(quizScript, /sentence-/);
});

test("student exercise state is not persisted between visits", () => {
  assert.doesNotMatch(quizScript, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(viewer, /localStorage|sessionStorage|indexedDB/);
});

test("reading sentence highlight is visually distinct and contained to the sentence", () => {
  assert.match(styles, /\.passage-sentence/);
  assert.match(styles, /\.passage-sentence\.is-speaking/);
  assert.match(styles, /pdf-upload-row/);
});
