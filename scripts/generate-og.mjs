#!/usr/bin/env node
// Renders public/og-image.png (1200x630) and public/apple-touch-icon.png (180x180)
// from scripts/og-template.html with headless Chromium (Playwright).
// Edit the template with the project's name, claim and colors, then:
//   npm run og:generate
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const browser = await chromium.launch();
const shots = [
  { file: "public/og-image.png", width: 1200, height: 630, selector: "#og" },
  { file: "public/apple-touch-icon.png", width: 180, height: 180, selector: "#icon" },
];
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL("scripts/og-template.html").href);
  await page.locator(s.selector).screenshot({ path: s.file });
  await page.close();
  console.log(`wrote ${s.file} (${s.width}x${s.height})`);
}
await browser.close();

// Record hashes only when generating the boilerplate placeholder (so launch-check
// can tell "still placeholder" from "project replaced it").
if (process.env.RECORD_PLACEHOLDER === "1") {
  const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
  writeFileSync("public/.placeholder-hashes", `og-image.png ${sha("public/og-image.png")}\napple-touch-icon.png ${sha("public/apple-touch-icon.png")}\n`);
  console.log("recorded placeholder hashes");
}
