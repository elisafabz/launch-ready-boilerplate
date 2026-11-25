#!/usr/bin/env node
// Pre-launch gate: flags every "vibe-coded and never finished" tell that a
// linter or test cannot catch (placeholders, missing assets, env).
// Run: npm run launch-check   (exit code 1 on any failure)
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const fail = [];
const warn = [];
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

// Placeholder hashes of the assets this boilerplate ships. Replace the files, not the hashes.
const PLACEHOLDER = {
  "public/favicon.svg": read("public/favicon.svg").includes("TODO: Replace with project favicon"),
  "public/og-image.png": existsSync("public/og-image.png") && sha("public/og-image.png") === read("public/.placeholder-hashes").match(/og-image.png (\w+)/)?.[1],
  "public/apple-touch-icon.png": existsSync("public/apple-touch-icon.png") && sha("public/apple-touch-icon.png") === read("public/.placeholder-hashes").match(/apple-touch-icon.png (\w+)/)?.[1],
};

// 1. Site URL + preview domain
const env = { ...Object.fromEntries(read(".env").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => l.split("=").map((s) => s.trim().replace(/^["']|["']$/g, "")))), ...process.env };
const siteUrl = env.VITE_SITE_URL ?? "";
if (!siteUrl) fail.push("VITE_SITE_URL is not set (.env). Canonical, og:url, sitemap and robots.txt need the production domain.");
else if (/localhost|\.(netlify|vercel)\.app$/.test(new URL(siteUrl).hostname)) fail.push(`VITE_SITE_URL points to a preview domain: ${siteUrl}`);
else if (!siteUrl.startsWith("https://")) fail.push(`VITE_SITE_URL must be https: ${siteUrl}`);

// 2. index.html placeholders
const html = read("index.html");
const titleM = html.match(/<title>(.*?)<\/title>/);
if (!titleM || !titleM[1].trim() || /Project Name|Vite \+ React|My App/i.test(titleM[1])) fail.push("index.html: <title> is empty or still a placeholder");
const descM = html.match(/<meta name="description" content="(.*?)"/);
if (!descM || !descM[1].trim() || /Short project description|TODO/i.test(descM[1])) fail.push("index.html: meta description missing or placeholder");
else if (descM[1].length > 160) warn.push(`index.html: meta description is ${descM[1].length} chars, keep it under 160`);
if (/content="Project Name"/.test(html)) fail.push("index.html: og:/twitter: tags still say \"Project Name\"");
if (/example\.com/.test(html)) fail.push("index.html: example.com placeholder left");
if (!/rel="canonical"/.test(html)) fail.push("index.html: no canonical link");
if (!/property="og:image" content="%VITE_SITE_URL%\/|property="og:image" content="https:\/\//.test(html)) fail.push("index.html: og:image must be an absolute URL");

// 3. Assets
for (const f of ["public/favicon.svg", "public/og-image.png", "public/apple-touch-icon.png"]) {
  if (!existsSync(f)) fail.push(`${f} missing`);
  else if (PLACEHOLDER[f]) fail.push(`${f} is still the boilerplate placeholder`);
}
if (existsSync("public/og-image.png") && statSync("public/og-image.png").size > 600_000) warn.push("public/og-image.png is over 600 kB, LinkedIn and WhatsApp may skip it");

// 4. Per-page placeholders in src
const srcHits = [];
for (const f of ["src/pages/Index.tsx"]) {
  const s = read(f);
  if (/Project Name|Short description of the project/.test(s)) srcHits.push(f);
}
if (srcHits.length) fail.push(`usePageMeta still has placeholder title/description in: ${srcHits.join(", ")}`);

// 5. robots.txt must not be hand-maintained (generated at build)
if (existsSync("public/robots.txt")) warn.push("public/robots.txt exists and will override the generated one (vite.config.ts seoAssets)");

// Report
for (const w of warn) console.warn(`WARN  ${w}`);
for (const f of fail) console.error(`FAIL  ${f}`);
if (!fail.length) console.log(`launch-check: clean${warn.length ? ` (${warn.length} warning${warn.length > 1 ? "s" : ""})` : ""}`);
process.exit(fail.length ? 1 : 0);
