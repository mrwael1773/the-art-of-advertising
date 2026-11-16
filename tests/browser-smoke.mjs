import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import axe from "axe-core";

const wranglerVersion = "4.159.0";
const port = 8792;
const origin = `http://127.0.0.1:${port}`;
const stateDir = mkdtempSync(join(tmpdir(), "art-advertising-local-browser-"));
const env = { ...process.env, DO_NOT_TRACK: "1", CI: "1" };
let server;
let serverOutput = "";

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Worker exited before readiness.\n" + serverOutput);
    try {
      const response = await fetch(origin + "/");
      if (response.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Timed out waiting for local Worker.\n" + serverOutput);
}

async function main() {
  server = spawn("npx", [
    "--yes", `wrangler@${wranglerVersion}`, "dev", "--config", "wrangler.toml",
    "--local", "--ip", "127.0.0.1", "--port", String(port), "--persist-to", stateDir
  ], {
    cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32"
  });
  server.stdout.on("data", chunk => { serverOutput += chunk.toString(); });
  server.stderr.on("data", chunk => { serverOutput += chunk.toString(); });
  await waitForServer();

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const apiRequests = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.match(await page.title(), /The Art of Advertising/);
    assert.equal(await page.locator(".learning-link").count(), 2);
    assert.equal(await page.locator(".learning-link[href=\"./sentences.html\"]").count(), 0);
    assert.equal(await page.locator(".learning-link[href=\"./words.html\"]").count(), 0);
    assert.equal(await page.locator(".learning-link[href=\"./audio.html\"]").count(), 0);
    const homeTheme = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.notEqual(homeTheme, "rgb(255, 255, 255)");

    await page.evaluate(() => localStorage.setItem("art-of-advertising:student-progress:v1", "legacy-progress"));

    await page.goto(origin + "/textbook.html", { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("iframe").count(), 0, "The lesson must show the page itself, not the full external book");
    assert.match(await page.locator(".page-intro").textContent(), /الصفحة 60/);
    assert.equal(await page.locator(".textbook-paper").count(), 1);
    assert.equal(await page.locator(".textbook-art").count(), 0, "The original textbook passage page has no added credit-card illustrations");
    assert.equal(await page.locator(".textbook-column-left .textbook-paragraph").count(), 3);
    assert.equal(await page.locator(".textbook-column-right .textbook-paragraph").count(), 4);
    assert.match(await page.locator(".textbook-column-left").textContent(), /The Diner’s Club Card soon became a cultural icon\./);
    assert.match(await page.locator(".textbook-column-right").textContent(), /Hollywood cashed in on the “charge-it craze”/);
    const textbookResponse = await page.request.get(origin + "/textbook.html");
    assert.doesNotMatch(textbookResponse.headers()["content-security-policy"], /fliphtml5/);
    assert.equal(await page.locator(".page-nav a[href=\"./sentences.html\"]").count(), 0);
    assert.equal(await page.locator(".page-nav a[href=\"./words.html\"]").count(), 0);
    assert.equal(await page.locator("#speech-speed").getAttribute("min"), "0.25");
    assert.equal(await page.locator("#speech-speed").getAttribute("max"), "1");
    await page.locator("#speech-speed").evaluate(el => { el.value = "0.25"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    assert.equal(await page.locator("#speed-value").textContent(), "0.25×");
    await page.evaluate(() => {
      window.__spoken = [];
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: class {
          constructor(text) { this.text = text; this.lang = ""; this.rate = 1; }
        }
      });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() {},
          speak(utterance) { window.__spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate }); }
        }
      });
    });
    await page.locator("#textbook-page .sentence-row .mini-actions .mini-button").first().click();
    let spoken = await page.evaluate(() => window.__spoken.at(-1));
    assert.equal(spoken.lang, "en-US");
    assert.equal(spoken.rate, 0.25);
    assert.match(spoken.text, /^Can you imagine/);
    assert.equal(await page.locator("#textbook-page .textbook-paragraph").count(), 7, "Paragraph 3 is split across columns as in the printed page");
    assert.equal(await page.locator("#textbook-page .sentence-en").count(), 29);
    assert.ok(await page.locator("#textbook-page .word-token").count() > 0);
    const firstTextbookRow = await page.locator("#textbook-page .sentence-row").first().evaluate(el => ({ sentence: el.querySelector(".sentence-en").getBoundingClientRect(), actions: el.querySelector(".mini-actions").getBoundingClientRect(), viewportWidth: window.innerWidth }));
    if (firstTextbookRow.viewportWidth > 700) {
      assert.ok(firstTextbookRow.actions.left < firstTextbookRow.sentence.left, "Desktop sentence controls should be on the left");
    } else {
      assert.ok(firstTextbookRow.actions.top >= firstTextbookRow.sentence.bottom - 1, "Mobile sentence controls should appear below the sentence");
    }
    await page.locator("#textbook-page .sentence-row .mini-actions .mini-button").nth(1).click();
    assert.equal(await page.locator("#textbook-page .sentence-ar").first().isVisible(), true);
    const firstWord = page.locator("#textbook-page .word-token").first();
    await firstWord.click();
    assert.equal(await firstWord.getAttribute("aria-pressed"), "true");
    assert.equal(await firstWord.evaluate(el => el.classList.contains("selected")), true);
    await firstWord.locator("xpath=../..").locator(".word-action-panel button").first().click();
    spoken = await page.evaluate(() => window.__spoken.at(-1));
    assert.equal(spoken.text, "Can");
    assert.equal(spoken.rate, 0.25);
    const firstWordPanel = page.locator("#textbook-page .word-action-panel").first();
    assert.equal(await firstWordPanel.isVisible(), true);
    await firstWordPanel.getByRole("button", { name: "ترجمة الكلمة" }).click();
    assert.match(await firstWordPanel.locator(".selected-word-meaning").textContent(), /Can = يستطيع/);
    const wordTranslationChecks = await page.locator("#textbook-page .word-token").evaluateAll(nodes => {
      const seen = new Set();
      const checks = [];
      for (const node of nodes) {
        const word = node.textContent.trim();
        const key = word.toLowerCase().replace(/[’']s$/, "");
        if (seen.has(key)) continue;
        seen.add(key);
        node.click();
        const panel = node.closest(".sentence-row").querySelector(".word-action-panel");
        panel.querySelector('button:nth-child(2)').click();
        checks.push({ word, message: panel.querySelector(".selected-word-meaning").textContent });
      }
      return checks;
    });
    assert.ok(wordTranslationChecks.length >= 200, "The textbook should expose translations for its full word set");
    assert.deepEqual(
      wordTranslationChecks.filter(item => item.message.startsWith("لا تتوفر ترجمة")).map(item => item.word),
      [],
      "Every clickable textbook word must show an Arabic meaning"
    );
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.client + 1, `Textbook horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(origin + "/quiz.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator('.page-nav a[href="./sentences.html"]').count(), 0);
    assert.equal(await page.locator('.page-nav a[href="./words.html"]').count(), 0);
    assert.match(await page.locator(".page-intro .eyebrow").textContent(), /STEP 2/);
    assert.equal(await page.locator("#quiz-area .quiz-question").count(), 20);
    assert.equal(await page.locator(".quiz-section-title").count(), 4);
    await page.locator('input[name="question-10"][value="0"]').check();
    assert.equal(await page.locator('input[name="question-11"][value="0"]').isDisabled(), true, "A matching number must not be reusable");
    await page.locator('input[name="question-10"][value="1"]').check();
    assert.equal(await page.locator('input[name="question-11"][value="0"]').isDisabled(), false, "Changing a match must release its previous number");
    assert.equal(await page.locator("h2").filter({ hasText: "التمارين" }).count(), 1);
    assert.equal(await page.locator(".answer-feedback").count(), 0);
    assert.equal(await page.locator(".quiz-section-title").count(), 4);
    await page.locator(`input[name="question-0"][value="1"]`).check();
    assert.equal(await page.locator(".answer-feedback").count(), 0);
    await page.locator("#finish-quiz").click();
    assert.equal(new URL(page.url()).pathname, "/quiz");
    assert.match(await page.locator("#quiz-result").textContent(), /أكمل جميع الأسئلة/);
    assert.equal(await page.locator("#account-panel").count(), 0);

    const response = await page.request.get(origin + "/");
    assert.equal(response.status(), 200);
    assert.equal(response.headers()["x-frame-options"], "DENY");
    assert.equal(response.headers()["x-content-type-options"], "nosniff");
    assert.ok(response.headers()["content-security-policy"]);

    await page.route(origin + "/__test/axe.js", route => route.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", body: axe.source }));
    await page.addScriptTag({ url: origin + "/__test/axe.js" });
    const accessibility = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
      });
      return result.violations.map(item => ({
        id: item.id, impact: item.impact,
        nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
      }));
    });
    assert.deepEqual(accessibility, [], `Accessibility violations: ${JSON.stringify(accessibility)}`);

    const answers = [1, 0, 0, 2, 0, 0, 1, 2, 0, 1, 0, 1, 2, 3, 4, 0, 0, 1, 0, 0];
    for (let i = 0; i < answers.length; i++) {
      await page.locator(`input[name="question-${i}"][value="${answers[i]}"]`).check();
    }
    await page.locator("#finish-quiz").click();
    await page.waitForURL("**/results");
    assert.match(await page.locator("h2").textContent(), /النتيجة النهائية/);
    assert.match(await page.locator("#final-score").textContent(), /18\s*\/\s*20/);
    assert.equal(await page.locator(".wrong-answer").count(), 2);
    assert.match(await page.locator(".wrong-answer").first().textContent(), /When did Frank McNamara first forget his wallet/);
    assert.match(await page.locator(".wrong-answer").first().textContent(), /الإجابة الصحيحة/);
    assert.match(await page.locator(".wrong-answer").first().textContent(), /1949/);
    assert.equal(await page.evaluate(() => sessionStorage.getItem("art-of-advertising:attempt-result:v1")), null);
    assert.equal(await page.locator('#result-content a[href="./index.html"]').count(), 1);
    assert.match(await page.locator("#result-content a[href=\"./index.html\"]").textContent(), /العودة إلى القائمة الرئيسية/);
    await page.route(origin + "/__test/axe.js", route => route.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", body: axe.source }));
    await page.addScriptTag({ url: origin + "/__test/axe.js" });
    const resultAccessibility = await page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
    });
    assert.deepEqual(resultAccessibility, [], `Result accessibility violations: ${JSON.stringify(resultAccessibility)}`);
    await page.reload({ waitUntil: "networkidle" });
    assert.match(await page.locator("#result-unavailable").textContent(), /غير متاحة/);
    assert.equal(await page.locator(".wrong-answer").count(), 0);
    await page.goto(origin + "/quiz.html", { waitUntil: "networkidle" });
    const allCorrectAnswers = [0, 1, 0, 2, 0, 0, 1, 2, 0, 1, 0, 1, 2, 3, 4, 0, 0, 1, 0, 0];
    for (let i = 0; i < allCorrectAnswers.length; i++) {
      await page.locator(`input[name="question-${i}"][value="${allCorrectAnswers[i]}"]`).check();
    }
    await page.locator("#finish-quiz").click();
    await page.waitForURL("**/results");
    assert.match(await page.locator("#final-score").textContent(), /20\s*\/\s*20/);
    assert.equal(await page.locator(".wrong-answer").count(), 0);
    assert.equal(await page.locator("#all-correct").isVisible(), true);
    assert.equal(await page.locator("#wrong-heading").isVisible(), false);
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client + 1,
        `Horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    assert.deepEqual(apiRequests, [], "The page must not send progress or account API requests");
    await context.close();
    console.log("Local browser checks passed: direct entry, lesson rendering, accessibility, final results with incorrect-answer review and one-time result transfer, responsive widths, and no account/progress API calls.");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} finally {
  if (server && server.exitCode === null) {
    if (process.platform !== "win32" && server.pid) {
      try { process.kill(-server.pid, "SIGTERM"); } catch {}
    } else {
      server.kill("SIGTERM");
    }
  }
  rmSync(stateDir, { recursive: true, force: true });
}