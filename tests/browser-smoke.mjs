import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

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
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    assert.match(await page.title(), /The Art of Advertising/);
    assert.equal(await page.locator("#account-panel").isVisible(), false);
    assert.equal(await page.locator("#reading-list .reading-card").count(), 6);
    assert.equal(await page.locator("#vocabulary-list .vocab-card").count(), 43);
    assert.equal(await page.locator("#quiz-area .quiz-question").count(), 15);

    await page.getByRole("tab", { name: "إنشاء حساب" }).click();
    await page.locator("#username").fill("browser_alpha");
    await page.locator("#password").fill("browser-test-password-1");
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await page.locator("#account-panel").waitFor({ state: "visible" });
    assert.match(await page.locator("#account-name").textContent(), /browser_alpha/);
    assert.match(await page.locator("#progress-label").textContent(), /لم يبدأ الدرس بعد/);

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

    // The result must survive a browser refresh and a fresh authenticated page load.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#account-panel").waitFor({ state: "visible" });
    await page.getByText("نتيجة الاختبار السابقة: 15/15").waitFor();

    await page.locator("#logout-button").click();
    await page.locator("#auth-form").waitFor({ state: "visible" });
    await page.getByRole("tab", { name: "تسجيل الدخول" }).click();
    await page.locator("#username").fill("browser_alpha");
    await page.locator("#password").fill("browser-test-password-1");
    await page.getByRole("button", { name: "دخول" }).click();
    await page.locator("#account-panel").waitFor({ state: "visible" });
    await page.getByText("نتيجة الاختبار السابقة: 15/15").waitFor();

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

    console.log("Browser smoke tests passed: rendered lesson, registration, learner controls, quiz submission, persisted result after refresh/login, logout, and second-account progress isolation.");
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
