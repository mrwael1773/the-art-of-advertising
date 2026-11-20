import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, webkit } from "playwright";
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

async function verifyFirstTwoPrintedLines(page, inputMode = "mouse") {
  // Earlier real-PDF checks may leave page 1 outside the viewport. Bring it
  // into view before deriving viewport-relative tap coordinates; otherwise
  // a stale/negative Y coordinate can hit text on page 2 instead.
  await page.locator("#pdf-page-1").scrollIntoViewIfNeeded();
  const targets = await page.evaluate(() => {
    const sentence = window.ART_AD_CONFIG.passageSentences[0];
    const root = document.querySelector("#pdf-page-1");
    const rendered = [];
    for (const span of root.querySelectorAll(".textLayer span[data-pdf-item-index]")) {
      const node = span.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) continue;
      for (const match of node.textContent.matchAll(/[a-z0-9ﬁﬂ]+(?:['’][a-zﬁﬂ]+)?/gi)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        if (rect.width && rect.height) rendered.push({
          value: match[0].replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/[’‘]/g, "'").toLowerCase(),
          x: rect.left + rect.width / 2, y: rect.top + rect.height / 2
        });
      }
    }
    const expected = Array.from(sentence.text.matchAll(/[a-z0-9ﬁﬂ]+(?:['’][a-zﬁﬂ]+)?/gi));
    const normalized = expected.map(match =>
      match[0].replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/[’‘]/g, "'").toLowerCase()
    );
    let start = -1;
    for (let index = 0; index <= rendered.length - normalized.length; index++) {
      if (normalized.every((word, offset) => rendered[index + offset].value === word)) {
        start = index;
        break;
      }
    }
    if (start < 0) throw new Error("Could not map the first source sentence to rendered PDF words.");
    const words = expected.map((match, offset) => ({
      word: match[0], expectedStart: sentence.text.slice(match.index),
      x: rendered[start + offset].x, y: rendered[start + offset].y
    }));
    const lineTops = [];
    for (const item of [...words].sort((a, b) => a.y - b.y)) {
      if (!lineTops.some(top => Math.abs(top - item.y) <= 3)) lineTops.push(item.y);
    }
    const firstTwo = lineTops.sort((a, b) => a - b).slice(0, 2);
    return words.filter(item => firstTwo.some(top => Math.abs(top - item.y) <= 3));
  });
  assert.ok(targets.length >= 5, "The first two printed lines must expose at least five words.");
  for (const target of targets) {
    if (inputMode === "touch") await page.touchscreen.tap(target.x, target.y);
    else await page.mouse.click(target.x, target.y);
    const result = await page.evaluate(() => {
      const group = document.querySelector(".sentence-highlight-layer .active-spoken-word");
      if (!group) return null;
      const root = group.closest(".pdf-page");
      const canvas = root.querySelector("canvas");
      const canvasRect = canvas.getBoundingClientRect();
      const span = root.querySelector(`.textLayer [data-pdf-item-index="${group.dataset.itemIndex}"]`);
      const range = document.createRange();
      range.setStart(span.firstChild, Number(group.dataset.start));
      range.setEnd(span.firstChild, Number(group.dataset.end));
      const source = range.getBoundingClientRect();
      const sx = canvas.width / canvasRect.width, sy = canvas.height / canvasRect.height;
      const x0 = Math.max(0, Math.floor((source.left - canvasRect.left) * sx));
      const y0 = Math.max(0, Math.floor((source.top - canvasRect.top) * sy));
      const x1 = Math.min(canvas.width, Math.ceil((source.right - canvasRect.left) * sx));
      const y1 = Math.min(canvas.height, Math.ceil((source.bottom - canvasRect.top) * sy));
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(x0, y0, x1 - x0, y1 - y0);
      const bands = [];
      for (let y = 0; y < pixels.height; y++) {
        let min = pixels.width, max = -1, count = 0;
        for (let x = 0; x < pixels.width; x++) {
          const i = (y * pixels.width + x) * 4;
          const l = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
          if (pixels.data[i + 3] > 0 && l < 225) { min = Math.min(min, x); max = Math.max(max, x); count++; }
        }
        if (!count) continue;
        let band = bands[bands.length - 1];
        if (!band || y - band.bottom > 2) { band = { top: y, bottom: y, minX: min, maxX: max, ink: 0 }; bands.push(band); }
        band.bottom = y; band.minX = Math.min(band.minX, min); band.maxX = Math.max(band.maxX, max); band.ink += count;
      }
      if (!bands.length) throw new Error("No printed ink for " + group.dataset.word);
      const center = pixels.height / 2;
      const glyph = bands.reduce((best, band) => {
        const d = Math.abs((band.top + band.bottom + 1) / 2 - center);
        const bd = Math.abs((best.top + best.bottom + 1) / 2 - center);
        return d < bd || (d === bd && band.ink > best.ink) ? band : best;
      });
      const expected = {
        left: canvasRect.left + (x0 + glyph.minX) / sx - 1,
        top: canvasRect.top + (y0 + glyph.top) / sy - 1,
        width: (glyph.maxX - glyph.minX + 1) / sx + 2,
        height: (glyph.bottom - glyph.top + 1) / sy + 2
      };
      const overlay = group.querySelector(".spoken-word-fragment").getBoundingClientRect();
      return {
        spoken: window.__spoken.at(-1)?.text || "", highlighted: group.dataset.word,
        alignment: { left: Math.abs(overlay.left - expected.left), top: Math.abs(overlay.top - expected.top),
          width: Math.abs(overlay.width - expected.width), height: Math.abs(overlay.height - expected.height) }
      };
    });
    assert.ok(result, "Each first-two-lines tap must create a highlight.");
    assert.equal(result.highlighted.toLowerCase(), target.word.toLowerCase(),
      `Expected first-two-lines highlight "${target.word}", got "${result.highlighted}".`);
    assert.equal(result.spoken, target.expectedStart,
      `Expected speech to start at "${target.word}", got "${result.spoken}".`);
    assert.ok(["left", "top", "width", "height"].every(key => result.alignment[key] < 1.5),
      `First-two-lines glyph alignment failed for "${target.word}": ${JSON.stringify(result.alignment)}`);
  }
  return targets.length;
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
    // Use the real pinned PDF.js build with the original PDF asset here.
    // The deterministic stub has no glyph pixels and cannot test ink geometry.
    const apiRequests = [];
    const workerResponses = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
      if (new URL(request.url()).pathname.endsWith(".pdf")) console.log("PDF request:", request.url());
    });
    page.on("response", response => {
      const pathname = new URL(response.url()).pathname;
      if (pathname.endsWith("/vendor/pdf.worker.min.js")) workerResponses.push({ status: response.status(), contentType: response.headers()["content-type"] || "" });
      if (pathname.endsWith(".pdf")) console.log("PDF response:", response.status(), response.url(), response.headers()["content-type"] || "");
    });
    page.on("requestfailed", request => console.log("Browser request failed:", request.url(), request.failure()?.errorText));
    page.on("pageerror", error => console.log("Browser page error:", error.message));
    page.on("console", message => { if (message.type() === "error") console.log("Browser console error:", message.text()); });

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
    await page.waitForFunction(() => {
      const status = document.querySelector("#speech-status")?.textContent || "";
      const pages = Array.from(document.querySelectorAll(".pdf-page"));
      return pages.length === 2 &&
        pages.every(page => page.querySelector(".textLayer span")) &&
        status !== "جارٍ تحميل ملف الكتاب الأصلي…";
    }, { timeout: 60000 });
    assert.equal(await page.locator(".pdf-page").count(), 2);
    assert.equal(await page.locator(".pdf-page canvas").count(), 2);
    assert.ok(await page.locator(".pdf-page .textLayer span").count() >= 23);
    assert.equal(await page.locator("#passage-sentences").count(), 0);
    assert.equal(await page.locator(".passage-text").count(), 0);
    assert.ok(workerResponses.some(item => item.status === 200 && item.contentType.includes("javascript")),
      "PDF.js worker must load successfully from the same origin.");
    assert.match(await page.locator("#speech-status").textContent(), /الصفحتان الأصليتان جاهزتان/);
    assert.equal(await page.locator(".source-pdf-link").getAttribute("href"),
      "./assets/art-advertising-source.pdf");
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
    assert.ok(await page.locator(".sentence-highlight-layer .active-spoken-word").count() > 0);
    await page.locator("#pause-reading").click();
    assert.match(await page.locator("#speech-status").textContent(), /متوقف مؤقتًا/);
    await page.locator("#resume-reading").click();
    await page.locator("#stop-reading").click();
    assert.equal(await page.locator(".sentence-highlight-layer .active-spoken-word").count(), 0);
    // Tap a span known to belong to the first source sentence, rather than
    // an arbitrary leading page/header span that may not be part of a passage.
    const firstSentenceTextSpan = page.locator("#pdf-page-1 .textLayer span").filter({ hasText: /tiny/i }).first();
    assert.ok(await firstSentenceTextSpan.count() > 0, "The first source sentence must have a rendered text span.");
    assert.equal(await firstSentenceTextSpan.evaluate(el => getComputedStyle(el).pointerEvents), "auto");
    assert.equal(await firstSentenceTextSpan.evaluate(el => getComputedStyle(el).userSelect), "text");
    assert.match(await firstSentenceTextSpan.evaluate(el => getComputedStyle(el).touchAction), /pinch-zoom/);
    // Reproduce Safari/iOS behavior: a tap may create a temporary text
    // selection after pointerdown. It must still activate sentence playback.
    await firstSentenceTextSpan.evaluate(span => {
      const textNode = span.firstChild;
      const targetStart = textNode.textContent.indexOf("measuring");
      const range = document.createRange();
      range.setStart(textNode, targetStart);
      range.setEnd(textNode, targetStart + "measuring".length);
      const rect = range.getBoundingClientRect();
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      span.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, pointerId: 1, pointerType: "touch", isPrimary: true
      }));
      span.dispatchEvent(new MouseEvent("click", {
        bubbles: true, cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      }));
      selection.removeAllRanges();
    });
    const tappedSentence = await page.evaluate(() => window.__spoken.at(-1)?.text || "");
    assert.equal(tappedSentence, "measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall.",
      "Tapping a word in the middle of a source sentence must speak from that exact word, not from the sentence beginning.");
    const tapHighlightCount = await page.locator(".sentence-highlight-layer .active-spoken-word").count();
    assert.equal(tapHighlightCount, 1,
      "Only the currently spoken word must be highlighted, never every word in the sentence.");
    const tappedWordText = await page.locator(".sentence-highlight-layer .active-spoken-word").first().getAttribute("data-word");
    assert.equal(tappedWordText.toLowerCase(), "measuring",
      "The first highlight must be the exact word tapped.");
    const firstWordText = tappedWordText;
    await page.evaluate(() => window.__lastUtterance.onboundary?.({ name: "word", charIndex: 10 }));
    assert.equal(await page.locator(".sentence-highlight-layer .active-spoken-word").count(), 1,
      "A word boundary must replace the previous mark instead of adding another one.");
    const nextWordText = await page.locator(".sentence-highlight-layer .active-spoken-word").first().getAttribute("data-word");
    assert.notEqual(nextWordText, firstWordText,
      "The highlight must move to the word identified by the speech boundary.");
    assert.equal(nextWordText.toLowerCase(), "10",
      "Speech boundary offsets from the shortened utterance must map to the correct original sentence word.");

    // Exercise hit-testing at different positions within the same printed
    // sentence. Each tap must highlight and speak the exact word under it.
    for (const expectedWord of ["tiny", "classic", "back", "measuring", "centimeters", "tall"]) {
      await page.locator("#pdf-page-1 .textLayer span").evaluateAll((spans, word) => {
        const span = spans.find(item => item.firstChild?.nodeType === Node.TEXT_NODE &&
          Array.from(item.firstChild.textContent.matchAll(/[a-z0-9]+/gi))
            .some(match => match[0].toLowerCase() === word));
        if (!span) throw new Error("Could not find target word in rendered PDF spans: " + word);
        const textNode = span.firstChild;
        const match = Array.from(textNode.textContent.matchAll(/[a-z0-9]+/gi))
          .find(item => item[0].toLowerCase() === word);
        const range = document.createRange();
        range.setStart(textNode, match.index);
        range.setEnd(textNode, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        span.dispatchEvent(new MouseEvent("click", {
          bubbles: true, cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        }));
      }, expectedWord);
      const utteranceText = await page.evaluate(() => window.__spoken.at(-1)?.text || "");
      const highlightedWord = await page.locator(".sentence-highlight-layer .active-spoken-word").getAttribute("data-word");
      assert.equal(highlightedWord.toLowerCase(), expectedWord,
        `Tap hit-testing must highlight the exact visual word: expected ${expectedWord}, got ${highlightedWord}.`);
      assert.ok(utteranceText.toLowerCase().startsWith(expectedWord),
        `Speech must start at the tapped word ${expectedWord}, got: ${utteranceText}`);
    }
    assert.match(await page.locator(".sentence-highlight-layer .active-spoken-word").first().evaluate(el =>
      getComputedStyle(el.querySelector(".spoken-word-fragment")).backgroundColor
    ), /255, 218, 75/);
    assert.equal(await page.locator(".sentence-highlight-layer .active-spoken-word").first().evaluate(el =>
      getComputedStyle(el.querySelector(".spoken-word-fragment")).position
    ), "absolute");

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
    assert.equal(await page.locator("#extra-exercises .question-card").count(), 15);
    assert.equal(await page.locator(".question-card").count(), 21);
    assert.equal(await page.locator("#extra-exercises [data-type='single_select']").count(), 10);
    assert.equal(await page.locator("#extra-exercises [data-type='fill_blank']").count(), 5);
    assert.equal(await page.locator(".evidence-button").count(), 21);
    assert.equal(await page.locator(".evidence-button:disabled").count(), 0);


    const evidenceTargets = await page.locator(".evidence-button").evaluateAll(links =>
      links.map(link => decodeURIComponent(new URL(link.href).hash.replace(/^#sentence-/, "")))
    );
    const sentenceIds = await page.evaluate(() =>
      window.ART_AD_CONFIG.passageSentences.map(sentence => String(sentence.id))
    );
    assert.ok(evidenceTargets.every(id => sentenceIds.includes(id)));
    assert.equal(await page.locator("#extra-exercises .answer-options").nth(0).locator("input[type=radio]").count(), 4);
    assert.equal(await page.locator("#extra-exercises .answer-options").nth(9).locator("input[type=radio]").count(), 4);

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
    await page.waitForFunction(() => document.querySelector(".answer-sentence-highlight"));
    assert.equal(new URL(page.url()).hash, "#sentence-fiat-1");
    assert.equal(await page.locator(".answer-sentence-highlight").getAttribute("data-sentence-id"), "fiat-1");
    assert.equal(await page.locator(".answer-sentence-highlight").getAttribute("data-highlighted-text"),
      "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall.");
    assert.equal(await page.locator(".sentence-highlight-layer .active-spoken-word").count(), 0,
      "Opening an evidence link must highlight the source sentence without starting speech.");
    await auditAccessibility(page);

    // The five true/false questions about textbook page 55 belong on that
    // textbook page, not in the separate exercises page. Verify every answer
    // key and that each jump link scrolls to its own visible solution.
    await page.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
    const pageTwoCards = page.locator("#page-two-questions .page-two-question");
    assert.equal(await pageTwoCards.count(), 5);
    const pageTwoQuestionKeys = await page.evaluate(() =>
      window.ART_AD_CONFIG.pageTwoQuestions.map(question => question.correctAnswer)
    );
    assert.deepEqual(pageTwoQuestionKeys, ["false", "true", "true", "true", "false"]);
    const evidenceIds = await page.evaluate(() => window.ART_AD_CONFIG.pageTwoQuestions.map(question => question.evidenceId));
    for (let index = 0; index < 5; index++) {
      const card = pageTwoCards.nth(index);
      assert.equal(await card.locator(".page-two-evidence").count(), 1,
        "Each question must have exactly one answer-location button.");
      assert.equal(await card.locator(".evidence-button").count(), 1);
      await card.locator(".page-two-evidence").click();
      const highlight = page.locator(".answer-sentence-highlight");
      await highlight.waitFor();
      assert.equal(await highlight.getAttribute("data-sentence-id"), evidenceIds[index]);
      const highlightedText = await highlight.getAttribute("data-highlighted-text");
      const expectedEvidence = await page.evaluate(id =>
        window.ART_AD_CONFIG.passageSentences.find(sentence => sentence.id === id).text, evidenceIds[index]);
      const wordsOnly = value => (value.match(/[a-z0-9]+(?:['’][a-z]+)?/gi) || []).join(" ").toLowerCase();
      assert.equal(wordsOnly(highlightedText), wordsOnly(expectedEvidence),
        "The evidence button must highlight every word in the complete matching source sentence.");
      const firstFragment = await highlight.locator(".answer-sentence-fragment").first().boundingBox();
      assert.ok(firstFragment && firstFragment.width > 10 && firstFragment.height > 5,
        "The complete evidence sentence must have a visible highlight.");
    }

    await page.goto(origin + "/quiz.html", { waitUntil: "networkidle" });
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

    // Crucial regression coverage: tap the actual PDF.js text layer, not the
    // one-span-per-sentence stub above. The source PDF splits and positions
    // text independently, so only this verifies sentence-to-word mapping.
    const realPdfTapCases = [
      { page: 1, word: "tiny", sentence: "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall." },
      { page: 1, word: "measuring", sentence: "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall." },
      { page: 1, word: "triumph", sentence: "The new FIAT 500 is a triumph of Italian design." },
      { page: 1, word: "crafted", sentence: "Every line has been crafted to reflect the legendary original, and buyers will be offered a variety of colors and options to customize their car." },
      { page: 1, word: "introduced", sentence: "The FIAT 500 two-seater was introduced in 1957, and it became an automotive legend." },
      { page: 1, word: "According", sentence: "According to Forbes magazine, Henk is the most expensive suitcase in the world." },
      { page: 2, word: "portable", sentence: "It looks like an ordinary bike, but it’s portable." },
      { page: 2, word: "transported", sentence: "This folding bike can easily be transported and stored when it is not in use." },
      { page: 2, word: "contrast", sentence: "In contrast to the standard bike, it is much smaller and less bulky, so it can be parked and stored more readily." },
      { page: 2, word: "invented", sentence: "Bicycles were invented in France in the 1790s." },
      { page: 2, word: "steerable", sentence: "In 1817, a steerable front wheel was developed by Baron Karl von Drais in Germany, and in 1839, the first pedals were introduced by Kirkpatrick MacMillan, a blacksmith from Scotland." }
    ];
    for (const testCase of realPdfTapCases) {
      const tapped = await realPdfPage.evaluate(({ pageNumber, word }) => {
        const root = document.querySelector("#pdf-page-" + pageNumber);
        const spans = Array.from(root.querySelectorAll(".textLayer span"));
        for (const span of spans) {
          const node = span.firstChild;
          if (!node || node.nodeType !== Node.TEXT_NODE) continue;
          const match = Array.from(node.textContent.matchAll(/[a-z0-9]+(?:['’][a-z]+)?/gi))
            .find(item => item[0].toLowerCase() === word.toLowerCase());
          if (!match) continue;
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rect = range.getBoundingClientRect();
          span.dispatchEvent(new MouseEvent("click", {
            bubbles: true, cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
          }));
          return { word: range.toString(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        throw new Error("Could not locate real PDF.js word: " + word);
      }, { pageNumber: testCase.page, word: testCase.word });
      const result = await realPdfPage.evaluate(() => ({
        spoken: window.__spoken.at(-1)?.text || "",
        highlighted: document.querySelector(".sentence-highlight-layer .active-spoken-word")?.dataset.word || ""
      }));
      const expectedStart = testCase.sentence.slice(testCase.sentence.toLowerCase().indexOf(testCase.word.toLowerCase()));
      assert.equal(result.highlighted.toLowerCase(), testCase.word.toLowerCase(),
        "Real PDF tap must highlight the exact tapped word " + testCase.word + "; got " + result.highlighted);
      assert.equal(result.spoken, expectedStart,
        "Real PDF tap must start within the correct source sentence for " + testCase.word +
        "; tap=" + JSON.stringify(tapped) + "; got=" + result.spoken);
    }

    // A delayed word-boundary callback from a completed sentence must not
    // overwrite the first-word highlight of the next sentence. Some speech
    // engines dispatch boundary events late around utterance transitions.
    const staleBoundaryResult = await realPdfPage.evaluate(() => {
      const previous = window.__lastUtterance;
      if (typeof previous?.onend !== "function" || typeof previous?.onboundary !== "function") {
        throw new Error("The speech test utterance must expose end and boundary callbacks.");
      }
      previous.onend();
      const next = window.__lastUtterance;
      if (!next || next === previous) throw new Error("The next sentence utterance did not start.");
      const before = document.querySelector(".sentence-highlight-layer .active-spoken-word")?.dataset.word || "";
      previous.onboundary({ name: "word", charIndex: 8 });
      const after = document.querySelector(".sentence-highlight-layer .active-spoken-word")?.dataset.word || "";
      return { before, after, nextText: next.text };
    });
    assert.equal(staleBoundaryResult.after, staleBoundaryResult.before,
      "A stale boundary from the previous sentence must not replace the next sentence's active highlight.");

    const firstTwoLineWordCount = await verifyFirstTwoPrintedLines(realPdfPage, "mouse");
    assert.ok(firstTwoLineWordCount >= 5, "All words in the first two printed lines must be tested.");
    await realPdfPage.evaluate(() => {
      const root = document.querySelector("#pdf-page-1");
      root.style.transformOrigin = "top left";
      root.style.transform = "scale(1.35)";
    });
    const zoomedFirstTwoLineWordCount = await verifyFirstTwoPrintedLines(realPdfPage, "mouse");
    assert.equal(zoomedFirstTwoLineWordCount, firstTwoLineWordCount,
      "Zoom must not change which words are covered by the first-two-lines regression test.");
    await realPdfPage.evaluate(() => {
      document.querySelector("#pdf-page-1").style.transform = "";
    });

    await realPdfPage.locator("#play-reading").click();
    assert.ok(await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").count() > 0,
      "Every spoken word should receive an independent highlight mark over the real PDF.js text layer.");
    const realPageWidth = await realPdfPage.locator("#pdf-page-1").evaluate(el => el.getBoundingClientRect().width);
    const widestHighlight = await realPdfPage.locator(".sentence-highlight-layer .spoken-word-fragment").evaluateAll(elements =>
      Math.max(...elements.map(el => el.getBoundingClientRect().width))
    );
    assert.ok(widestHighlight < realPageWidth * 0.75,
      `A sentence highlight must not bridge the two separate textbook columns (widest=${widestHighlight.toFixed(1)}px, page=${realPageWidth.toFixed(1)}px).`);

    const geometry = await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").evaluate(group => {
      const page = group.closest(".pdf-page");
      const canvas = page.querySelector("canvas");
      const canvasRect = canvas.getBoundingClientRect();
      const textSpan = page.querySelector(`.textLayer [data-pdf-item-index="${group.dataset.itemIndex}"]`);
      const range = document.createRange();
      range.setStart(textSpan.firstChild, Number(group.dataset.start));
      range.setEnd(textSpan.firstChild, Number(group.dataset.end));
      const selectedText = range.toString();
      const source = range.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const x0 = Math.max(0, Math.floor((source.left - canvasRect.left) * scaleX));
      const y0 = Math.max(0, Math.floor((source.top - canvasRect.top) * scaleY));
      const x1 = Math.min(canvas.width, Math.ceil((source.right - canvasRect.left) * scaleX));
      const y1 = Math.min(canvas.height, Math.ceil((source.bottom - canvasRect.top) * scaleY));
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(x0, y0, x1 - x0, y1 - y0);
      let minX = pixels.width, minY = pixels.height, maxX = -1, maxY = -1;
      for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {
        const i = (y * pixels.width + x) * 4;
        const l = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
        if (pixels.data[i + 3] > 0 && l < 225) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      const overlay = group.querySelector(".spoken-word-fragment").getBoundingClientRect();
      const ink = {
        left: canvasRect.left + (x0 + minX) / scaleX - 1,
        top: canvasRect.top + (y0 + minY) / scaleY - 1,
        width: (maxX - minX + 1) / scaleX + 2,
        height: (maxY - minY + 1) / scaleY + 2
      };
      return {
        selectedText, expectedWord: group.dataset.word,
        left: Math.abs(ink.left - overlay.left),
        top: Math.abs(ink.top - overlay.top),
        width: Math.abs(ink.width - overlay.width),
        height: Math.abs(ink.height - overlay.height),
        inkHeight: ink.height, rangeHeight: source.height
      };
    });
    assert.equal(geometry.selectedText, geometry.expectedWord,
      `Highlight offsets must select exactly the intended rendered word: ${JSON.stringify(geometry)}`);
    assert.ok(["left", "top", "width", "height"].every(key => geometry[key] < 1.5),
      `Word overlay must match the visible ink bounds in the original Drive PDF render: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.inkHeight <= geometry.rangeHeight,
      `Ink-tight highlight must not exceed the PDF text line box: ${JSON.stringify(geometry)}`);

    // Simulate a pinch-zoom scale on the original page. The overlay is
    // absolutely positioned in page-local CSS pixels, whereas Range and
    // canvas client rectangles are viewport pixels. They must remain aligned.
    await realPdfPage.evaluate(() => {
      const root = document.querySelector("#pdf-page-1");
      root.style.transformOrigin = "top left";
      root.style.transform = "scale(1.35)";
      window.__lastUtterance.onboundary?.({ name: "word", charIndex: 5 });
    });
    const zoomedAlignment = await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").evaluate(group => {
      const page = group.closest(".pdf-page");
      const canvas = page.querySelector("canvas");
      const canvasRect = canvas.getBoundingClientRect();
      const span = page.querySelector(`.textLayer [data-pdf-item-index="${group.dataset.itemIndex}"]`);
      const range = document.createRange();
      range.setStart(span.firstChild, Number(group.dataset.start));
      range.setEnd(span.firstChild, Number(group.dataset.end));
      const source = range.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const x0 = Math.max(0, Math.floor((source.left - canvasRect.left) * scaleX));
      const y0 = Math.max(0, Math.floor((source.top - canvasRect.top) * scaleY));
      const x1 = Math.min(canvas.width, Math.ceil((source.right - canvasRect.left) * scaleX));
      const y1 = Math.min(canvas.height, Math.ceil((source.bottom - canvasRect.top) * scaleY));
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(x0, y0, x1 - x0, y1 - y0);
      let minX = pixels.width, minY = pixels.height, maxX = -1, maxY = -1;
      for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {
        const i = (y * pixels.width + x) * 4;
        const luminance = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
        if (pixels.data[i + 3] > 0 && luminance < 225) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      if (maxX < minX || maxY < minY) throw new Error("The tapped word must have visible PDF ink after zoom.");
      const expected = {
        left: canvasRect.left + (x0 + minX) / scaleX - 1,
        top: canvasRect.top + (y0 + minY) / scaleY - 1,
        width: (maxX - minX + 1) / scaleX + 2,
        height: (maxY - minY + 1) / scaleY + 2
      };
      const overlay = group.querySelector(".spoken-word-fragment").getBoundingClientRect();
      return {
        left: Math.abs(overlay.left - expected.left),
        top: Math.abs(overlay.top - expected.top),
        width: Math.abs(overlay.width - expected.width),
        height: Math.abs(overlay.height - expected.height),
        overlay: { top: overlay.top, bottom: overlay.bottom, left: overlay.left, right: overlay.right },
        expected
      };
    });
    assert.ok(["left", "top", "width", "height"].every(key => zoomedAlignment[key] < 1.5),
      `Word highlight must stay aligned to the actual printed ink after zoom: ${JSON.stringify(zoomedAlignment)}`);
    await realPdfPage.locator("#pdf-page-1").evaluate(el => {
      el.style.transform = "";
      el.style.transformOrigin = "";
    });

    // A responsive re-render must keep the exact word currently spoken,
    // rather than jumping back to the first word of the sentence.
    await realPdfPage.evaluate(() => window.__lastUtterance.onboundary?.({ name: "word", charIndex: 5 }));
    const spokenWordBeforeResize = await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").getAttribute("data-word");
    await realPdfPage.setViewportSize({ width: 360, height: 844 });
    await realPdfPage.waitForFunction(expected =>
      document.querySelector(".sentence-highlight-layer .active-spoken-word")?.dataset.word === expected,
      spokenWordBeforeResize
    );
    assert.equal(await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").count(), 1);
    assert.equal(await realPdfPage.locator(".sentence-highlight-layer .active-spoken-word").getAttribute("data-word"), spokenWordBeforeResize,
      "Resizing the original PDF page must preserve the currently spoken word.");
    await realPdfPage.close();

    // Safari uses WebKit. Run the same real-PDF hit test there, with a
    // touch-style pointer and an iOS-like selection-before-click sequence.
    const webkitBrowser = await webkit.launch({ headless: true });
    try {
      const webkitContext = await webkitBrowser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true
      });
      await webkitContext.addInitScript(() => {
        window.__spoken = [];
        class TestUtterance {
          constructor(text) { this.text = text; this.lang = ""; this.rate = 1; }
        }
        Object.defineProperty(window, "SpeechSynthesisUtterance", {
          configurable: true, value: TestUtterance
        });
        Object.defineProperty(window, "speechSynthesis", {
          configurable: true,
          value: {
            cancel() {}, pause() {}, resume() {},
            speak(utterance) {
              window.__spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
              window.__lastUtterance = utterance;
            },
            get speaking() { return Boolean(window.__lastUtterance); },
            get paused() { return false; }
          }
        });
      });
      const safariPage = await webkitContext.newPage();
      await safariPage.goto(origin + "/textbook.html", { waitUntil: "networkidle" });
      await safariPage.waitForFunction(() =>
        (document.querySelector("#speech-status")?.textContent || "").includes("الصفحتان الأصليتان جاهزتان"),
      { timeout: 60000 });

      const safariTapCases = [
        { page: 1, word: "measuring", sentence: "The tiny classic is back, measuring 10 feet 11 inches (335 centimeters) long, 5 feet 5 inches (165 centimeters) wide, and 4 feet 11 inches (149 centimeters) tall." },
        { page: 1, word: "triumph", sentence: "The new FIAT 500 is a triumph of Italian design." },
        { page: 1, word: "introduced", sentence: "The FIAT 500 two-seater was introduced in 1957, and it became an automotive legend." },
        { page: 1, word: "According", sentence: "According to Forbes magazine, Henk is the most expensive suitcase in the world." },
        { page: 2, word: "portable", sentence: "It looks like an ordinary bike, but it’s portable." },
        { page: 2, word: "invented", sentence: "Bicycles were invented in France in the 1790s." }
      ];
      for (const testCase of safariTapCases) {
        const tapPoint = await safariPage.evaluate(({ pageNumber, word }) => {
          const root = document.querySelector("#pdf-page-" + pageNumber);
          for (const span of root.querySelectorAll(".textLayer span")) {
            const node = span.firstChild;
            if (!node || node.nodeType !== Node.TEXT_NODE) continue;
            const match = Array.from(node.textContent.matchAll(/[a-z0-9]+(?:['’][a-z]+)?/gi))
              .find(item => item[0].toLowerCase() === word.toLowerCase());
            if (!match) continue;
            // A real student taps only visible text. Scroll the original PDF word
            // into the mobile viewport before measuring its physical touch point.
            span.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const rect = range.getBoundingClientRect();
            window.getSelection().removeAllRanges();
            const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            if (point.x < 0 || point.x > window.innerWidth || point.y < 0 || point.y > window.innerHeight) {
              throw new Error("WebKit tap target is outside the visible viewport: " + JSON.stringify(point));
            }
            return point;
          }
          throw new Error("Could not locate WebKit PDF word: " + word);
        }, { pageNumber: testCase.page, word: testCase.word });
        // Use Playwright's real touch input (touchstart/end -> pointer -> click).
        // The app resolves the source span from touch coordinates, not event.target,
        // because WebKit may retarget the generated click to a wrapper element.
        await safariPage.touchscreen.tap(tapPoint.x, tapPoint.y);
        const result = await safariPage.evaluate(() => ({
          spoken: window.__spoken.at(-1)?.text || "",
          highlighted: document.querySelector(".sentence-highlight-layer .active-spoken-word")?.dataset.word || ""
        }));
        const expectedStart = testCase.sentence.slice(testCase.sentence.toLowerCase().indexOf(testCase.word.toLowerCase()));
        assert.equal(result.highlighted.toLowerCase(), testCase.word.toLowerCase(),
          "WebKit touch tap must highlight the exact word " + testCase.word + "; got " + result.highlighted);
        assert.equal(result.spoken, expectedStart,
          "WebKit touch tap must use the sentence containing " + testCase.word + "; got " + result.spoken);
      }
      const safariFirstTwoLineWordCount = await verifyFirstTwoPrintedLines(safariPage, "touch");
      assert.ok(safariFirstTwoLineWordCount >= 5,
        "WebKit touch must verify every word in the first two printed lines.");
      await safariPage.evaluate(() => {
        const root = document.querySelector("#pdf-page-1");
        root.style.transformOrigin = "top left";
        root.style.transform = "scale(1.35)";
      });
      const zoomedSafariWordCount = await verifyFirstTwoPrintedLines(safariPage, "touch");
      assert.equal(zoomedSafariWordCount, safariFirstTwoLineWordCount,
        "WebKit zoom must preserve first-two-lines touch coverage.");
      await webkitContext.close();
    } finally {
      await webkitBrowser.close();
    }

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
    console.log("Browser checks passed: original-page PDF text layer, on-page sentence highlighting, playback controls, speed control, all 21 quiz evidence links plus five full-sentence page-two evidence jumps, accessibility, responsive layouts, and no persistence/API calls.");
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
