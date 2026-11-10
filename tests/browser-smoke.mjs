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
    assert.equal(await page.locator("#auth-form, #username, #password, #login-tab, #register-tab").count(), 0);
    assert.equal(await page.locator("#reading-list .reading-card").count(), 6);
    assert.equal(await page.locator("#vocabulary-list .vocab-card").count(), 43);
    assert.equal(await page.locator("#quiz-area .quiz-question").count(), 15);
    assert.equal(await page.locator("#account-panel").isVisible(), true);

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

    const answers = [0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1];
    for (let i = 0; i < answers.length; i++) {
      await page.locator(`input[name="question-${i}"][value="${answers[i]}"]`).check();
    }
    await page.locator("#finish-quiz").click();
    await page.waitForFunction(() => document.querySelector("#quiz-result")?.textContent.includes("15 من 15"));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("art-of-advertising:student-progress:v1")));
    assert.equal(stored["world-of-plastic-reading"].score, 15);
    assert.equal(stored["world-of-plastic-reading"].total, 15);

    await page.reload({ waitUntil: "networkidle" });
    assert.match(await page.locator("#progress-label").textContent(), /15\/15/);
    assert.match(await page.locator("#quiz-result").textContent(), /15 من 15/);
    for (let i = 0; i < answers.length; i++) {
      assert.equal(
        await page.locator(`input[name="question-${i}"][value="${answers[i]}"]`).isChecked(),
        true,
        `Saved answer for question ${i + 1} was not restored`
      );
    }

    // A separate browser profile must not see this profile's local progress.
    const otherContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const otherPage = await otherContext.newPage();
    await otherPage.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await otherPage.evaluate(() => localStorage.getItem("art-of-advertising:student-progress:v1")), null);
    assert.match(await otherPage.locator("#progress-label").textContent(), /لم يبدأ الدرس بعد/);
    await otherContext.close();

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
    console.log("Local browser checks passed: direct entry, lesson rendering, accessibility, quiz save/reload including selected answers, profile isolation, responsive widths, and no account/progress API calls.");
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