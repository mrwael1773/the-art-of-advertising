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
    if (server.exitCode !== null) throw new Error("Worker exited before readiness.\\n" + serverOutput);
    try {
      const response = await fetch(origin + "/");
      if (response.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Timed out waiting for local Worker.\\n" + serverOutput);
}

async function auditAccessibility(page) {
  await page.route(origin + "/__test/axe.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript; charset=utf-8",
    body: axe.source
  }));
  await page.addScriptTag({ url: origin + "/__test/axe.js" });
  const violations = await page.evaluate(async () => {
    const result = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
    });
    return result.violations.map(item => ({
      id: item.id,
      impact: item.impact,
      targets: item.nodes.map(node => node.target)
    }));
  });
  assert.deepEqual(violations, [], `Accessibility violations: ${JSON.stringify(violations)}`);
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
    await context.addInitScript(() => {
      window.__spoken = [];
      class TestUtterance {
        constructor(text) { this.text = text; this.lang = ""; this.rate = 1; }
      }
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: TestUtterance });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() {},
          pause() {},
          resume() {},
          speak(utterance) {
            window.__spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
            window.__lastUtterance = utterance;
          },
          get speaking() { return Boolean(window.__lastUtterance); }
        }
      });
    });
    const page = await context.newPage();
    const apiRequests = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
    });

    await page.goto(origin, { waitUntil: "networkidle" });
    assert.match(await page.title(), /The Art of Advertising/);
    assert.equal(await page.locator(".learning-link").count(), 2);
    assert.equal(await page.locator('.learning-link[href="./textbook.html"]').count(), 1);
    assert.equal(await page.locator('.learning-link[href="./quiz.html"]').count(), 1);
    assert.match(await page.locator(".learning-link").nth(0).textContent(), /القراءة والاستماع/);
    assert.match(await page.locator(".learning-link").nth(1).textContent(), /التمارين/);
    assert.match(await page.locator(".home-note").textContent(), /لا تُحفظ إجابات التمارين/);
    assert.equal(await page.locator('input[type="password"]').count(), 0);
    await auditAccessibility(page);

    // Keep CI deterministic: the real public Drive preview is verified separately;
    // this browser test checks that the page wires the configured preview URL correctly.
    await page.route("https://drive.google.com/**", route => route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: "<!doctype html><title>Google Drive preview test stub</title>"
    }));
    await page.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator("#passage-sentences .passage-sentence").count(), 18);
    assert.match(await page.locator("#sentence-henk-3").textContent(), /25 grams/,
      "The Henk suitcase reading detail should retain the source's 25-gram light-pull fact.");
    assert.equal(await page.locator("#pdf-frame-wrap").isVisible(), true, "The configured textbook PDF viewer should be visible on page load.");
    assert.equal(
      await page.locator("#book-pdf").getAttribute("src"),
      "https://drive.google.com/file/d/12uTt_P9J_uIQDkTMPQBsgDCYiTfa8QY1/preview",
      "The textbook viewer should use the verified public Google Drive preview URL."
    );
    assert.equal(await page.locator("#open-book-pdf").isVisible(), true);
    assert.match(await page.locator("#pdf-status").textContent(), /تم تحميل صفحتي الدرس/);
    assert.equal(await page.locator("#book-pdf-file").count(), 1);
    assert.equal(await page.locator("#play-reading").count(), 1);
    assert.equal(await page.locator("#pause-reading").count(), 1);
    assert.equal(await page.locator("#resume-reading").count(), 1);
    assert.equal(await page.locator("#stop-reading").count(), 1);
    assert.equal(await page.locator("#speech-speed").getAttribute("min"), "0.25");
    assert.equal(await page.locator("#speech-speed").getAttribute("max"), "1");
    await page.locator("#speech-speed").evaluate(el => {
      el.value = "0.25";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(await page.locator("#speed-value").textContent(), "0.25×");
    await page.locator("#play-reading").click();
    let spoken = await page.evaluate(() => window.__spoken.at(-1));
    assert.equal(spoken.lang, "en-US");
    assert.equal(spoken.rate, 0.25);
    assert.equal(spoken.text, "The FIAT 500 is a small classic car that returned with a fresh design.");
    assert.equal(await page.locator(".passage-sentence.is-speaking").count(), 1);
    await page.locator("#pause-reading").click();
    await page.locator("#resume-reading").click();
    await page.locator("#stop-reading").click();
    assert.equal(await page.locator(".passage-sentence.is-speaking").count(), 0);

    await page.locator("#book-pdf-file").setInputFiles({
      name: "sample.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\\n% local preview smoke test")
    });
    assert.equal(await page.locator("#pdf-frame-wrap").isVisible(), true);
    assert.match(await page.locator("#pdf-status").textContent(), /معاينة محلية/);
    assert.match(await page.locator("#book-pdf").getAttribute("src"), /^blob:/);
    assert.equal(await page.locator("#open-book-pdf").isVisible(), true);
    await auditAccessibility(page);

    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client + 1,
        `Reading page horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/quiz.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator("#quick-questions .question-card").count(), 6);
    assert.equal(await page.locator("#extra-exercises .question-card").count(), 20);
    assert.equal(await page.locator(".question-card").count(), 26);
    assert.equal(await page.locator("#extra-exercises [data-type='single_select']").count(), 10);
    assert.equal(await page.locator("#extra-exercises [data-type='fill_blank']").count(), 5);
    assert.equal(await page.locator("#extra-exercises [data-type='true_false']").count(), 5);
    assert.equal(await page.locator(".evidence-button").count(), 26);
    assert.equal(await page.locator(".evidence-button:disabled").count(), 0);
    assert.equal(await page.locator("#extra-exercises .answer-options").nth(0).locator("input[type=radio]").count(), 4);
    assert.equal(await page.locator("#extra-exercises .answer-options").nth(14).locator("input[type=radio]").count(), 2);

    const mcCard = page.locator("#extra-exercises .question-card").first();
    const mcAnswer = await mcCard.getAttribute("data-correct");
    await mcCard.locator(`input[type="radio"][value="${mcAnswer}"]`).check();
    await mcCard.locator(".check-answer").click();
    assert.match(await mcCard.locator(".question-feedback").textContent(), /إجابة صحيحة/);

    const blankCard = page.locator("#extra-exercises .question-card").nth(10);
    const accepted = JSON.parse(await blankCard.getAttribute("data-accepted"));
    await blankCard.locator(".blank-input").fill(accepted[0]);
    await blankCard.locator(".check-answer").click();
    assert.match(await blankCard.locator(".question-feedback").textContent(), /إجابة صحيحة/);

    const quickCard = page.locator("#quick-questions .question-card").first();
    const quickAnswer = await quickCard.getAttribute("data-correct");
    await quickCard.locator(`input[type="radio"][value="${quickAnswer}"]`).check();
    await quickCard.locator(".check-answer").click();
    assert.match(await quickCard.locator(".question-feedback").textContent(), /إجابة صحيحة/);

    const firstEvidenceButton = page.locator(".evidence-button").first();
    assert.equal(await firstEvidenceButton.getAttribute("href"), "./textbook.html#sentence-fiat-1");
    const evidenceUrl = new URL(await firstEvidenceButton.getAttribute("href"), page.url()).href;
    await page.goto(evidenceUrl, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).hash, "#sentence-fiat-1");
    await page.waitForTimeout(350);
    assert.equal(await page.locator(".passage-sentence.is-speaking").count(), 1);
    assert.equal(await page.locator("#passage-sentences .passage-sentence.is-speaking").getAttribute("id"), "sentence-fiat-1");
    await auditAccessibility(page);

    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client + 1,
        `Exercises page horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    assert.deepEqual(apiRequests, [], "The lesson must not send account or progress API requests.");
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await context.close();
    console.log("Browser checks passed: lesson navigation, PDF local preview, sentence audio/highlighting, all 26 evidence-linked questions, answer checking, accessibility, responsive layouts, and no persistence/API calls.");
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
