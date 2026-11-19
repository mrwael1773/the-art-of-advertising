import { mkdir, writeFile } from "node:fs/promises";

const version = "3.11.174";
const sourceUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
const outputDirectory = new URL("../public/vendor/", import.meta.url);
const outputPath = new URL("pdf.worker.min.js", outputDirectory);

const response = await fetch(sourceUrl, { redirect: "follow" });
if (!response.ok) {
  throw new Error(`Could not download the pinned PDF.js worker (HTTP ${response.status}).`);
}
const bytes = Buffer.from(await response.arrayBuffer());
const source = bytes.toString("utf8");
if (bytes.length < 100_000 || !source.includes(version) || !source.includes("pdfjsWorker")) {
  throw new Error("The downloaded PDF.js worker did not pass its version and integrity checks.");
}
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, bytes);
console.log(`Downloaded and verified PDF.js worker ${version} (${bytes.length} bytes).`);
