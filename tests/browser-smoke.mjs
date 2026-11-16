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
    assert.equal(await page.locator(".learning-link").count(), 4);
    assert.equal(await page.locator(".learning-link[href=\"./audio.html\"]").count(), 0);
    const homeTheme = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.notEqual(homeTheme, "rgb(255, 255, 255)");

    await page.evaluate(() => localStorage.setItem("art-of-advertising:student-progress:v1", "legacy-progress"));

    await page.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator("#textbook-page .textbook-paragraph").count(), 6);
    assert.equal(await page.locator("#textbook-page .sentence-en").count(), 29);
    assert.ok(await page.locator("#textbook-page .word-token").count() > 0);
    const firstTextbookRow = await page.locator("#textbook-page .sentence-row").first().evaluate(el => ({ sentence: el.querySelector(".sentence-en").getBoundingClientRect(), actions: el.querySelector(".mini-actions").getBoundingClientRect() }));
    assert.ok(firstTextbookRow.actions.left < firstTextbookRow.sentence.left, "Textbook sentence controls should be on the left");
    await page.locator("#textbook-page .sentence-row .mini-button").nth(1).click();
    assert.equal(await page.locator("#textbook-page .sentence-ar").first().isVisible(), true);
    const wordTranslationChecks = await page.locator("#textbook-page .word-token").evaluateAll(nodes => {
      const seen = new Set();
      const checks = [];
      for (const node of nodes) {
        const word = node.textContent.trim();
        const key = word.toLowerCase().replace(/[’']s$/, "");
        if (seen.has(key)) continue;
        seen.add(key);
        node.click();
        checks.push({ word, message: document.querySelector("#lesson-message").textContent });
      }
      return checks;
    });
    assert.ok(wordTranslationChecks.length >= 200, "The textbook should expose translations for its full word set");
    assert.deepEqual(
      wordTranslationChecks.filter(item => item.message.startsWith("استمع إلى نطق:")).map(item => item.word),
      [],
      "Every clickable textbook word must show an Arabic meaning"
    );
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.client + 1, `Textbook horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(origin + "/sentences.html", { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => localStorage.getItem("art-of-advertising:student-progress:v1")), null);
    assert.equal(await page.locator(".page-nav a[href=\"./audio.html\"]").count(), 0);
    assert.equal(await page.locator("#speech-speed").count(), 1);
    await page.locator("#speech-speed").evaluate(el => { el.value = "1.1"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    assert.equal(await page.locator("#speed-value").textContent(), "1.10×");
    assert.equal(await page.locator("#reading-list .reading-card").count(), 6);
    assert.equal(await page.locator("#reading-list .sentence-en").count(), 29);
    assert.equal(await page.locator(".sentence-row").count(), 29);
    assert.equal(await page.locator(".sentence-row").first().evaluate(el => getComputedStyle(el).display), "grid");
    const sentenceLayout = await page.locator(".sentence-row").first().evaluate(el => ({ sentence: el.querySelector(".sentence-en").getBoundingClientRect(), actions: el.querySelector(".mini-actions").getBoundingClientRect() }));
    assert.ok(sentenceLayout.actions.left < sentenceLayout.sentence.left, "Sentence actions should appear to the left of the English sentence");
    assert.ok(await page.locator("#reading-list .sentence-en .word-token").count() > 0);
    await page.locator("#reading-list .sentence-en .word-token").first().click();
    assert.match(await page.locator("#lesson-message").textContent(), /Can = يستطيع/);
    assert.equal(await page.locator("#reading-list .sentence-ar[hidden]").count(), 29);
    await page.locator(".reading-card").first().locator(".mini-button").nth(2).click();
    assert.equal(await page.locator(".sentence-ar").first().isVisible(), true);
    assert.match(await page.locator(".sentence-ar").first().textContent(), /تخيّل/);
    assert.equal(await page.locator(".sentence-ar[hidden]").count(), 28);
    await page.locator(".reading-card").first().locator(".mini-button").nth(2).click();
    assert.equal(await page.locator(".sentence-ar").first().isVisible(), false);

    await page.goto(origin + "/words.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator(".page-nav a[href=\"./audio.html\"]").count(), 0);
    assert.equal(await page.locator("#speech-speed").count(), 1);
    await page.locator("#speech-speed").evaluate(el => { el.value = "1.15"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    assert.equal(await page.locator("#speed-value").textContent(), "1.15×");
    assert.equal(await page.locator("#vocabulary-list .vocab-card").count(), 43);
    await page.locator(".vocab-card").first().locator(".mini-button").nth(1).click();
    assert.equal(await page.locator(".vocab-meaning").first().isVisible(), true);

    await page.goto(origin + "/quiz.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator("#quiz-area .quiz-question").count(), 20);
    assert.equal(await page.locator(".quiz-section-title").count(), 4);
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