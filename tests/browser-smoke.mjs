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

const pdfJsStub = `
window.pdfjsLib = {
  GlobalWorkerOptions: {},
  getDocument() {
    return { promise: Promise.resolve({
      numPages: 2,
      async getPage(pageNumber) {
        return {
          getViewport({ scale }) { return { width: 612 * scale, height: 792 * scale, scale }; },
          render() { return { promise: Promise.resolve() }; },
          async getTextContent() {
            return { items: window.ART_AD_CONFIG.passageSentences
              .filter(sentence => sentence.page === pageNumber)
              .map(sentence => ({ str: sentence.text })) };
          }
        };
      }
    }) };
  },
  renderTextLayer({ textContent, container, textDivs }) {
    for (const item of textContent.items) {
      const span = document.createElement("span");
      span.textContent = item.str;
      container.append(span);
      textDivs.push(span);
    }
    return { promise: Promise.resolve() };
  }
};
`;

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
          cancel() { window.__paused = false; },
          pause() { window.__paused = true; },
          resume() { window.__paused = false; },
          speak(utterance) {
            window.__spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
            window.__lastUtterance = utterance;
          },
          get speaking() { return Boolean(window.__lastUtterance) && !window.__paused; },
          get paused() { return Boolean(window.__paused); }
        }
      });
    });
    const page = await context.newPage();
    await page.route("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: pdfJsStub }));
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

    const textbookResponse = await page.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
    const textbookCsp = textbookResponse.headers()["content-security-policy"] || "";
    assert.match(textbookCsp, /script-src[^;]*cdnjs\.cloudflare\.com/);
    await page.waitForFunction(() => document.querySelectorAll(".pdf-page .textLayer span").length === 23);
    assert.equal(await page.locator(".pdf-page").count(), 2);
    assert.equal(await page.locator(".pdf-page canvas").count(), 2);
    assert.equal(await page.locator(".pdf-page .textLayer span").count(), 23);
    assert.equal(await page.locator("#passage-sentences").count(), 0);
    assert.equal(await page.locator(".passage-text").count(), 0);
    assert.match(await page.locator("#speech-status").textContent(), /الصفحتان الأصليتان جاهزتان/);
    assert.equal(await page.locator(".source-pdf-link").getAttribute("href"),
      "https://drive.google.com/file/d/12uTt_P9J_uIQDkTMPQBsgDCYiTfa8QY1/view");
    assert.equal(await page.locator("#play-reading").isDisabled(), false);
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
    assert.equal(spoken.text, "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall.");
    assert.equal(await page.locator(".textLayer .sentence-speaking").count(), 1);
    await page.locator("#pause-reading").click();
    assert.match(await page.locator("#speech-status").textContent(), /متوقف مؤقتًا/);
    await page.locator("#resume-reading").click();
    await page.locator("#stop-reading").click();
    assert.equal(await page.locator(".textLayer .sentence-speaking").count(), 0);

    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client + 1,
        `Reading page horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    await auditAccessibility(page);

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

    const evidenceTargets = await page.locator(".evidence-button").evaluateAll(links =>
      links.map(link => decodeURIComponent(new URL(link.href).hash.replace(/^#sentence-/, "")))
    );
    const sentenceIds = await page.evaluate(() =>
      window.ART_AD_CONFIG.passageSentences.map(sentence => String(sentence.id))
    );
    assert.ok(evidenceTargets.every(id => sentenceIds.includes(id)));
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

    const firstEvidence = page.locator(".evidence-button").first();
    assert.equal(await firstEvidence.getAttribute("href"), "./textbook.html#sentence-fiat-1");
    await page.goto(new URL(await firstEvidence.getAttribute("href"), page.url()).href, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector(".textLayer .sentence-speaking"));
    assert.equal(new URL(page.url()).hash, "#sentence-fiat-1");
    assert.equal(await page.locator(".textLayer .sentence-speaking").count(), 1);
    assert.equal((await page.evaluate(() => window.__spoken.at(-1))).text, "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall.");
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

    // Verify the real public PDF and the real PDF.js CDN in Chromium, not only the deterministic stub.
    const realPdfPage = await context.newPage();
    await realPdfPage.goto(origin + "/textbook.html", { waitUntil: "domcontentloaded" });
    await realPdfPage.waitForFunction(() => {
      const value = document.querySelector("#speech-status")?.textContent || "";
      return value.includes("الصفحتان الأصليتان جاهزتان") || value.includes("تعذر تحميل") || value.includes("تعذر تشغيل");
    }, { timeout: 60000 });
    assert.match(await realPdfPage.locator("#speech-status").textContent(), /الصفحتان الأصليتان جاهزتان/,
      "The locally hosted original textbook PDF must load through PDF.js, and every passage sentence must map to its page text.");
    assert.ok(await realPdfPage.locator(".pdf-page .textLayer span").count() > 23);
    await realPdfPage.locator("#play-reading").click();
    assert.ok(await realPdfPage.locator(".textLayer .sentence-speaking").count() > 0,
      "Real PDF.js text spans should receive the active sentence highlight.");
    await realPdfPage.close();

    const unsupportedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const unsupportedPage = await unsupportedContext.newPage();
    await unsupportedPage.addInitScript(() => {
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: undefined });
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    });
    await unsupportedPage.route("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: pdfJsStub }));
    await unsupportedPage.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
    assert.equal(await unsupportedPage.locator("#play-reading").isDisabled(), true);
    assert.match(await unsupportedPage.locator("#speech-status").textContent(), /لا يدعم النطق الصوتي/);
    await unsupportedContext.close();

    await context.close();
    console.log("Browser checks passed: original-page PDF text layer, on-page sentence highlighting, playback controls, speed control, all 26 evidence-linked questions, accessibility, responsive layouts, and no persistence/API calls.");
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
