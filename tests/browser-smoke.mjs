import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import axe from "axe-core";

const wranglerVersion = "4.159.0";
const config = "wrangler.test.toml";
const database = "the-art-of-advertising-local-test";
const port = 8792;
const origin = `http://127.0.0.1:${port}`;
const stateDir = mkdtempSync(join(tmpdir(), "art-advertising-browser-"));
const env = { ...process.env, DO_NOT_TRACK: "1", NO_D1_WARNING: "true", CI: "1" };
let server;
let serverOutput = "";

function runWrangler(args) {
  const result = spawnSync("npx", ["--yes", `wrangler@${wranglerVersion}`, ...args], {
    cwd: process.cwd(), env, encoding: "utf8", stdio: "inherit", timeout: 180_000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler exited with code ${result.status}`);
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Worker exited before readiness.\n" + serverOutput);
    try {
      const response = await fetch(origin + "/api/me");
      if (response.status === 401) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Timed out waiting for local Worker.\n" + serverOutput);
}

async function main() {
  runWrangler([
    "d1", "migrations", "apply", database, "--local",
    "--config", config, "--persist-to", stateDir
  ]);
  server = spawn("npx", [
    "--yes", `wrangler@${wranglerVersion}`, "dev", "--config", config,
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
    const page = await browser.newPage();
    const cspViolations = [];
    page.on("console", message => {
      if (message.type() === "error" && /content security policy/i.test(message.text())) {
        cspViolations.push(message.text());
      }
    });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    assert.match(await page.title(), /The Art of Advertising/);

    await page.route(origin + "/__test/axe.js", route => route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      body: axe.source
    }));
    await page.addScriptTag({ url: origin + "/__test/axe.js" });
    const accessibility = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
      });
      return {
        violations: result.violations.map(item => ({
          id: item.id,
          impact: item.impact,
          description: item.description,
          nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
        }))
      };
    });
    assert.deepEqual(accessibility.violations, [], `Accessibility violations: ${JSON.stringify(accessibility.violations)}`);

    // Basic semantic accessibility and responsive-layout checks at common viewport widths.
    assert.equal(await page.locator("html").getAttribute("lang"), "ar");
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("footer").count(), 1);
    for (const [control, label] of [["#username", "اسم المستخدم"], ["#password", "كلمة المرور"], ["#speech-speed", "سرعة النطق"]]) {
      const id = await page.locator(control).getAttribute("id");
      assert.equal(await page.locator(`label[for="${id}"]`).count(), 1, `${label} must have an associated label`);
    }
    assert.equal(await page.locator("button").evaluateAll(buttons =>
      buttons.every(button => Boolean((button.innerText || "").trim() || button.getAttribute("aria-label")))
    ), true, "Every button must have an accessible name");
    const originalViewport = page.viewportSize();
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(30);
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client + 1, `Horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    await page.setViewportSize(originalViewport);

    // Keyboard users must be able to reach and activate the account tabs with visible focus.
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "login-tab");
    assert.notEqual(await page.locator("#login-tab").evaluate(element => getComputedStyle(element).outlineStyle), "none");
    assert.equal(await page.locator("#login-tab").getAttribute("aria-controls"), "auth-form");
    assert.equal(await page.locator("#auth-form").getAttribute("role"), "tabpanel");
    assert.equal(await page.locator("#auth-form").getAttribute("aria-labelledby"), "login-tab");
    assert.equal(await page.locator("#register-tab").getAttribute("tabindex"), "-1");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await page.evaluate(() => document.activeElement.id), "register-tab");
    assert.equal(await page.locator("#register-tab").getAttribute("aria-selected"), "true");
    assert.equal(await page.locator("#login-tab").getAttribute("tabindex"), "-1");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.id), "login-tab");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await page.evaluate(() => document.activeElement.id), "register-tab");
    await page.keyboard.press("Home");
    assert.equal(await page.evaluate(() => document.activeElement.id), "login-tab", "Home must focus the first tab");
    assert.equal(await page.locator("#login-tab").getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await page.evaluate(() => document.activeElement.id), "register-tab", "End must focus the last tab");
    assert.equal(await page.locator("#register-tab").getAttribute("aria-selected"), "true");
    await page.keyboard.press("Home");
    assert.equal(await page.evaluate(() => document.activeElement.id), "login-tab");
    await page.keyboard.press("End");
    assert.equal(await page.evaluate(() => document.activeElement.id), "register-tab");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#password-hint").isVisible(), true);
    assert.equal(await page.locator("#account-panel").isVisible(), false);
    assert.equal(await page.locator("#reading-list .reading-card").count(), 6);
    assert.equal(await page.locator("#vocabulary-list .vocab-card").count(), 43);
    assert.equal(await page.locator("#quiz-area .quiz-question").count(), 15);

    await page.getByRole("tab", { name: "إنشاء حساب" }).click();
    await page.locator("#username").fill("browser_alpha");
    await page.locator("#password").fill("browser-test-password-1");
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await page.locator("#account-panel").waitFor({ state: "visible" });
    await page.getByText("اختر إجابة واحدة لكل سؤال، ثم اضغط على «تحقق من الإجابات» لعرض نتيجتك.").waitFor({ state: "visible" });
    assert.match(await page.locator("#account-name").textContent(), /browser_alpha/);
    assert.match(await page.locator("#progress-label").textContent(), /لم يبدأ الدرس بعد/);

    // Verify that lesson audio controls call the Web Speech API with English text and the selected rate.
    await page.evaluate(() => {
      const calls = { cancel: 0, spoken: [] };
      class MockUtterance {
        constructor(text) { this.text = text; this.lang = ""; this.rate = 1; }
      }
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() { calls.cancel += 1; },
          speak(utterance) {
            calls.spoken.push({
              text: utterance.text,
              lang: utterance.lang,
              rate: utterance.rate
            });
          }
        }
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: MockUtterance
      });
      window.__speechTestCalls = calls;
    });
    await page.getByRole("button", { name: /استمع للفقرة/ }).first().click();
    let speechCalls = await page.evaluate(() => window.__speechTestCalls);
    assert.equal(speechCalls.cancel, 1, "Starting speech must cancel any previous utterance");
    assert.equal(speechCalls.spoken.length, 1);
    assert.match(speechCalls.spoken[0].text, /Credit cards have changed/);
    assert.equal(speechCalls.spoken[0].lang, "en-US");
    assert.equal(speechCalls.spoken[0].rate, 0.85);
    await page.getByRole("button", { name: /استمع للجملة 1/ }).first().click();
    speechCalls = await page.evaluate(() => window.__speechTestCalls);
    assert.equal(speechCalls.spoken.length, 2, "Sentence speech control must issue a new utterance");
    assert.equal(speechCalls.spoken[1].text, "Credit cards have changed the way people pay for goods and services.");
    await page.getByRole("button", { name: "استمع", exact: true }).first().click();
    speechCalls = await page.evaluate(() => window.__speechTestCalls);
    assert.equal(speechCalls.spoken.length, 3, "Vocabulary speech control must issue an utterance");
    assert.equal(speechCalls.spoken[2].text, "imagine");


    // An incomplete quiz must not be submitted or create a saved progress result.
    const incompleteQuizState = await page.evaluate(() => {
      document.querySelector("#finish-quiz").click();
      return {
        message: document.querySelector("#quiz-result").textContent,
        progress: document.querySelector("#progress-label").textContent
      };
    });
    assert.match(incompleteQuizState.message, /أكمل جميع الأسئلة أولًا/);
    assert.match(incompleteQuizState.progress, /لم يبدأ الدرس بعد/);
    assert.equal(incompleteQuizState.message.includes("نتيجتك:"), false);
    const incompleteSavedProgress = await page.evaluate(async () => {
      const response = await fetch("/api/progress", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Could not verify progress after an incomplete quiz.");
      return await response.json();
    });
    assert.deepEqual(incompleteSavedProgress, { progress: [] },
      "an incomplete quiz must not create a server-side progress record");

    const authenticatedAccessibility = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
      });
      return result.violations.map(item => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
      }));
    });
    assert.deepEqual(authenticatedAccessibility, [], `Authenticated accessibility violations: ${JSON.stringify(authenticatedAccessibility)}`);

    // Verify sequential keyboard access to lesson controls and labeled quiz choices.
    await page.locator("#logout-button").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "speech-speed");
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement.textContent), /إيقاف النطق/);
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement.textContent), /استمع للفقرة/);
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement.textContent), /إظهار الترجمة/);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".sentence-ar").first().isVisible(), true, "Translation reveal must work with Enter");
    assert.match(await page.evaluate(() => document.activeElement.textContent), /إخفاء الترجمة/);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".sentence-ar").first().isVisible(), false, "Translation hide must work with Enter");
    assert.match(await page.evaluate(() => document.activeElement.textContent), /إظهار الترجمة/);
    const quizChoice = page.locator('input[name="question-0"][value="0"]');
    assert.equal(await quizChoice.evaluate(input => input.labels?.length === 1), true, "Quiz radio choices must have associated labels");
    await quizChoice.focus();
    assert.equal(await quizChoice.evaluate(input => document.activeElement === input), true);

    // Confirm basic learner controls respond in the rendered browser UI.
    await page.locator("#speech-speed").evaluate(element => {
      element.value = "1.1";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.match(await page.locator("#speed-value").textContent(), /1\.10/);
    await page.getByRole("button", { name: "إظهار الترجمة" }).first().click();
    assert.equal(await page.locator(".sentence-ar").first().isVisible(), true);
    await page.getByRole("button", { name: "إخفاء الترجمة" }).first().click();

    const correctAnswers = [0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1];
    for (let i = 0; i < correctAnswers.length; i++) {
      await page.locator(`input[name="question-${i}"][value="${correctAnswers[i]}"]`).check();
    }
    await page.locator("#finish-quiz").click();
    await page.getByText("نتيجتك: 15 من 15").waitFor();
    await page.getByText("تم تصحيح إجاباتك وحفظ نتيجتك في حسابك.").waitFor();
    assert.equal(await page.locator("#progress-fill").getAttribute("data-score"), "15", "CSP-safe progress indicator must reflect the saved score");

    // A second attempt must replace the learner's previous saved result.
    for (let i = 0; i < correctAnswers.length; i++) {
      await page.locator(`input[name="question-${i}"][value="0"]`).check();
    }
    await page.locator("#finish-quiz").click();
    await page.getByText("نتيجتك: 9 من 15").waitFor();
    assert.equal(await page.locator("#progress-label").textContent(), "نتيجة الاختبار: 9/15");
    assert.equal(await page.locator("#progress-fill").getAttribute("data-score"), "9");

    // A failed retry must not present the old score as the new attempt's result.
    await page.route("**/api/progress", async route => {
      if (route.request().method() === "PUT") await route.abort();
      else await route.continue();
    });
    await page.locator("#finish-quiz").click();
    await page.getByText("لم تُحفظ المحاولة الجديدة. بقيت آخر نتيجة محفوظة كما هي.").waitFor();
    assert.equal(await page.locator("#progress-label").textContent(), "نتيجة الاختبار: 9/15");
    assert.equal(await page.locator("#progress-fill").getAttribute("data-score"), "9");
    await page.unroute("**/api/progress");

    // The latest successful result must survive a browser refresh and a fresh authenticated page load.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#account-panel").waitFor({ state: "visible" });
    await page.getByText("نتيجة الاختبار السابقة: 9/15").waitFor();
    await page.getByText("آخر نتيجة محفوظة: 9 من 15. يمكنك مراجعة الدرس ثم إعادة الاختبار.").waitFor();

    await page.locator("#logout-button").click();
    await page.locator("#auth-form").waitFor({ state: "visible" });
    await page.getByRole("tab", { name: "تسجيل الدخول" }).click();
    await page.locator("#username").fill("browser_alpha");
    await page.locator("#password").fill("browser-test-password-1");
    await page.getByRole("button", { name: "دخول" }).click();
    await page.locator("#account-panel").waitFor({ state: "visible" });
    await page.getByText("نتيجة الاختبار السابقة: 9/15").waitFor();

    // A second student's account must not display the first student's result.
    await page.locator("#logout-button").click();
    await page.locator("#auth-form").waitFor({ state: "visible" });
    await page.getByRole("tab", { name: "إنشاء حساب" }).click();
    await page.locator("#username").fill("browser_beta");
    await page.locator("#password").fill("browser-test-password-2");
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await page.locator("#account-panel").waitFor({ state: "visible" });
    assert.match(await page.locator("#progress-label").textContent(), /لم يبدأ الدرس بعد/);
    assert.doesNotMatch(await page.locator("#progress-label").textContent(), /15\/15/);

    assert.deepEqual(cspViolations, [], `Content Security Policy violations: ${JSON.stringify(cspViolations)}`);
    console.log("Browser smoke tests passed: rendered lesson, registration, learner controls, quiz submission, persisted result after refresh/login, logout, second-account progress isolation, and CSP compatibility.");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise(resolve => server.once("exit", resolve));
    try {
      if (process.platform === "win32") server.kill("SIGTERM");
      else process.kill(-server.pid, "SIGTERM");
    } catch { server.kill("SIGTERM"); }
    await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 5_000))]);
    if (server.exitCode === null && server.signalCode === null) {
      try {
        if (process.platform === "win32") server.kill("SIGKILL");
        else process.kill(-server.pid, "SIGKILL");
      } catch { server.kill("SIGKILL"); }
    }
  }
  rmSync(stateDir, { recursive: true, force: true });
}
