#!/usr/bin/env node
// Build src/data/zip-zones.json from the official 2023 USDA Plant Hardiness
// Zone Map ZIP-code CSVs published by PRISM Climate Group, Oregon State Univ.
//
// Source: https://prism.oregonstate.edu/phzm/
// License: Free to reproduce and redistribute with attribution.
// Data covers CONUS, Alaska, Hawaii, and Puerto Rico — ~40,500 ZIPs total.
//
// Usage: node scripts/build-zip-zones.mjs
// Re-run when PRISM publishes a new revision.

import { writeFile, mkdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE_DIR = join(ROOT, ".cache", "phzm");
const OUT_PATH = join(ROOT, "src", "data", "zip-zones.json");

const SOURCES = [
  { name: "conus", file: "phzm_us_zipcode_2023.csv" },
  { name: "ak", file: "phzm_ak_zipcode_2023.csv" },
  { name: "hi", file: "phzm_hi_zipcode_2023.csv" },
  { name: "pr", file: "phzm_pr_zipcode_2023.csv" },
];

const BASE_URL = "https://prism.oregonstate.edu/phzm/data/2023/";

async function fetchCached(file) {
  const cached = join(CACHE_DIR, file);
  try {
    await stat(cached);
    return cached;
  } catch {
    // not cached
  }
  await mkdir(CACHE_DIR, { recursive: true });
  const url = BASE_URL + file;
  process.stderr.write(`Downloading ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const text = await res.text();
  await writeFile(cached, text, "utf8");
  return cached;
}

function parseCsv(text) {
  // Each row: zipcode,zone,trange,zonetitle. Header is line 0.
  // PRISM data has no embedded commas/quotes, so a plain split is safe.
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [zip, zone] = line.split(",");
    if (!zip || !zone) continue;
    out.push([zip, zone]);
  }
  return out;
}

const main = async () => {
  const map = {};
  let count = 0;
  for (const { file } of SOURCES) {
    const path = await fetchCached(file);
    const text = await readFile(path, "utf8");
    for (const [zip, zone] of parseCsv(text)) {
      map[zip] = zone;
      count++;
    }
  }

  // Sort keys so the JSON file diff is stable across regenerations.
  const sorted = Object.fromEntries(
    Object.keys(map)
      .sort()
      .map((k) => [k, map[k]]),
  );

  await writeFile(OUT_PATH, JSON.stringify(sorted) + "\n", "utf8");
  process.stderr.write(
    `Wrote ${count} ZIPs to ${OUT_PATH} (${Object.keys(sorted).length} unique).\n`,
  );

  // Spot-check the issue's required examples.
  const checks = [
    ["10001", "NYC"],
    ["94110", "SF"],
    ["99501", "Anchorage"],
  ];
  for (const [zip, label] of checks) {
    process.stderr.write(`  ${zip} (${label}) -> ${sorted[zip] ?? "?"}\n`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
