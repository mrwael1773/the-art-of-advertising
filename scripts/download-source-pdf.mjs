import { mkdir, writeFile } from "node:fs/promises";

const sourceUrl = "https://drive.google.com/uc?export=download&id=12uTt_P9J_uIQDkTMPQBsgDCYiTfa8QY1";
const outputPath = new URL("../public/assets/art-advertising-source.pdf", import.meta.url);

const response = await fetch(sourceUrl, { redirect: "follow" });
if (!response.ok) {
  throw new Error(`Could not download the original textbook PDF (HTTP ${response.status}).`);
}
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 1000 || bytes.subarray(0, 4).toString("ascii") !== "%PDF") {
  const preview = bytes.subarray(0, 80).toString("utf8").replace(/\s+/g, " ");
  throw new Error(`The shared source did not return a valid PDF. Response began: ${preview}`);
}
await mkdir(new URL("../public/assets/", import.meta.url), { recursive: true });
await writeFile(outputPath, bytes);
console.log(`Downloaded and verified original textbook PDF (${bytes.length} bytes).`);
