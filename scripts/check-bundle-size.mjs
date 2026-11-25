#!/usr/bin/env node
// Fails the build when a JS chunk exceeds the gzip budget. Runs as postbuild.
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 200); // gzip, per chunk
const dir = "dist/assets";
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const kb = gzipSync(readFileSync(`${dir}/${f}`)).length / 1024;
  const over = kb > BUDGET_KB;
  if (over) bad++;
  console.log(`${over ? "OVER " : "ok   "} ${f.padEnd(32)} ${kb.toFixed(1).padStart(7)} kB gzip (budget ${BUDGET_KB})`);
}
if (bad) {
  console.error(`\n${bad} chunk(s) over budget. Lazy-load routes (React.lazy) or split vendors via build.rollupOptions.output.manualChunks.`);
  process.exit(1);
}
