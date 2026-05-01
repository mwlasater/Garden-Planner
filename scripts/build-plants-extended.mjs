#!/usr/bin/env node
// Build src/data/plants-extended.json from the USDA PLANTS Database web API.
//
// Source:  https://plants.usda.gov/  (public domain — US federal work)
// API:     https://plantsservices.sc.egov.usda.gov/api/PlantSearch
//
// We can't pull the full ~80,000-record bulk export from the new SPA,
// but the same backend powers the search UI and accepts genus-prefix
// queries via "Begins With". The cap is 200 results per query (no
// pagination), which is fine because we only need the ~30 garden-
// relevant genera; together they comfortably exceed the 500-entry
// goal in #32 after dedup and filtering.
//
// Usage: node scripts/build-plants-extended.mjs
// Re-run when USDA updates or you add genera to GARDEN_GENERA below.

import { writeFile, mkdir, readFile, rename, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE_DIR = join(ROOT, ".cache", "usda-plants");
const OUT_PATH = join(ROOT, "src", "data", "plants-extended.json");
const SEARCH_URL = "https://plantsservices.sc.egov.usda.gov/api/PlantSearch";

// Genera covering the staples of US vegetable / herb / fruit / flower
// gardens. Category is the default for entries from that genus; users
// can re-categorize when they add companion data.
//
// Keep this list focused — adding obscure genera produces a lot of
// wild-species noise that crowds out the searchable plant catalog.
const GARDEN_GENERA = [
  // Solanaceae — nightshades
  ["Solanum",       "vegetable"],
  ["Capsicum",      "vegetable"],
  ["Physalis",      "fruit"],
  // Brassicaceae — cabbage family
  ["Brassica",      "vegetable"],
  ["Raphanus",      "root"],
  ["Eruca",         "vegetable"], // arugula
  ["Nasturtium",    "herb"],      // watercress (the herb genus, not garden nasturtium)
  // Cucurbitaceae — gourd family
  ["Cucumis",       "vegetable"],
  ["Cucurbita",     "vegetable"],
  ["Citrullus",     "fruit"],
  ["Lagenaria",     "vegetable"],
  // Amaryllidaceae / Alliaceae — alliums
  ["Allium",        "root"],
  // Fabaceae — legumes
  ["Phaseolus",     "vegetable"],
  ["Pisum",         "vegetable"],
  ["Vicia",         "vegetable"],
  ["Vigna",         "vegetable"],
  ["Glycine",       "vegetable"], // soy
  ["Arachis",       "vegetable"], // peanut
  // Apiaceae — carrot family
  ["Daucus",        "root"],
  ["Apium",         "vegetable"], // celery / celeriac
  ["Petroselinum",  "herb"],
  ["Anethum",       "herb"],
  ["Foeniculum",    "herb"],
  ["Coriandrum",    "herb"],
  ["Pastinaca",     "root"],      // parsnip
  // Lamiaceae — mints
  ["Mentha",        "herb"],
  ["Ocimum",        "herb"],
  ["Origanum",      "herb"],
  ["Salvia",        "herb"],
  ["Thymus",        "herb"],
  ["Lavandula",     "flower"],
  ["Rosmarinus",    "herb"],
  // Asteraceae — composites (lettuce, sunflower, marigold)
  ["Lactuca",       "vegetable"],
  ["Cichorium",     "vegetable"], // endive / chicory
  ["Helianthus",    "flower"],
  ["Tagetes",       "flower"],
  ["Echinacea",     "flower"],
  ["Calendula",     "flower"],
  // Chenopodiaceae / Amaranthaceae — beets, spinach, chard
  ["Spinacia",      "vegetable"],
  ["Beta",          "root"],
  ["Atriplex",      "vegetable"],
  // Rosaceae — strawberry, brambles
  ["Fragaria",      "fruit"],
  ["Rubus",         "fruit"],
  // Misc edibles & garden flowers
  ["Asparagus",     "vegetable"],
  ["Zea",           "vegetable"], // corn
  ["Tropaeolum",    "flower"],    // garden nasturtium
];

// Curated catalog scientific names (lowercased, authority stripped) so we
// can drop extended entries that duplicate the hand-curated 44.
const CURATED_SCIENTIFIC = new Set([
  "solanum lycopersicum",
  "capsicum annuum",
  "solanum melongena",
  "solanum tuberosum",
  "brassica oleracea",
  "brassica oleracea var. italica",
  "brassica oleracea var. sabellica",
  "brassica oleracea var. botrytis",
  "brassica oleracea var. gemmifera",
  "brassica oleracea var. gongylodes",
  "daucus carota",
  "lactuca sativa",
  "spinacia oleracea",
  "raphanus sativus",
  "beta vulgaris",
  "allium cepa",
  "allium sativum",
  "allium ampeloprasum",
  "allium schoenoprasum",
  "phaseolus vulgaris",
  "pisum sativum",
  "zea mays",
  "cucumis sativus",
  "cucurbita pepo",
  "citrullus lanatus",
  "fragaria × ananassa",
  "asparagus officinalis",
  "apium graveolens",
  "ocimum basilicum",
  "origanum vulgare",
  "petroselinum crispum",
  "anethum graveolens",
  "salvia rosmarinus",
  "salvia officinalis",
  "thymus vulgaris",
  "mentha",
  "coriandrum sativum",
  "foeniculum vulgare",
  "tagetes",
  "tropaeolum majus",
  "helianthus annuus",
]);

// Strip <i></i> wrappers and the trailing taxonomic authority so we can
// match against CURATED_SCIENTIFIC. Examples:
//   "<i>Solanum lycopersicum</i> L."                 -> "solanum lycopersicum"
//   "<i>Aethusa cynapium</i> L."                     -> "aethusa cynapium"
//   "<i>Agastache foeniculum</i> (Pursh) Kuntze"     -> "agastache foeniculum"
//   "<i>Brassica oleracea</i> L. var. <i>italica</i> Plenck"
//                                                    -> "brassica oleracea var. italica"
//
// Strategy: walk tokens on the *original* case. Authority tokens are the
// first uppercase-leading or parenthesized token *after* the genus, and
// everything from there until the next infraspecific marker (var./subsp.)
// is dropped.
function normalizeSci(html) {
  if (!html) return "";
  const noTags = html.replace(/<[^>]+>/g, " ");
  const collapsed = noTags.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const tokens = collapsed.split(" ");
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i === 0) {
      // Genus is always capitalized — keep verbatim (lowercased at the end).
      out.push(t);
      continue;
    }
    // Infraspecific markers — keep them and the epithet that follows.
    if (t === "var." || t === "subsp." || t === "ssp." || t === "f.") {
      out.push(t);
      continue;
    }
    // Authority tokens start with an uppercase letter or open paren and
    // mark the end of the current taxonomic name. Skip ahead until we
    // hit the next infraspecific marker (e.g. "var." after "L.").
    if (/^[A-Z(]/.test(t) || t === "&") {
      while (
        i + 1 < tokens.length &&
        tokens[i + 1] !== "var." &&
        tokens[i + 1] !== "subsp." &&
        tokens[i + 1] !== "ssp." &&
        tokens[i + 1] !== "f."
      ) {
        i++;
      }
      continue;
    }
    out.push(t);
  }
  return out.join(" ").trim().toLowerCase();
}

async function fetchCached(genus) {
  const cached = join(CACHE_DIR, `${genus}.json`);
  try {
    await stat(cached);
    return cached;
  } catch {
    // not cached — fall through
  }
  await mkdir(CACHE_DIR, { recursive: true });
  const url = `${SEARCH_URL}?searchText=${encodeURIComponent(
    genus,
  )}&Field=Scientific%20Name&Type=Begins%20With`;
  process.stderr.write(`Fetching ${genus}…\n`);
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "garden-planner/0.1" },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const text = await res.text();
  // Atomic: write to .tmp then rename so an interrupted run doesn't
  // leave a truncated cache file.
  const tmp = `${cached}.tmp`;
  try {
    await writeFile(tmp, text, "utf8");
    await rename(tmp, cached);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
  return cached;
}

const main = async () => {
  const bySymbol = new Map();
  const stats = {
    fetched: 0,
    kept: 0,
    droppedNoCommon: 0,
    droppedRank: 0,
    droppedCurated: 0,
    droppedDup: 0,
    droppedWrongGenus: 0,
  };

  for (const [genus, defaultCategory] of GARDEN_GENERA) {
    const genusLower = genus.toLowerCase();
    const path = await fetchCached(genus);
    const text = await readFile(path, "utf8");
    let rows;
    try {
      rows = JSON.parse(text);
    } catch {
      process.stderr.write(`  ${genus}: cache file is invalid JSON, skipping\n`);
      continue;
    }
    if (!Array.isArray(rows)) continue;
    stats.fetched += rows.length;

    for (const row of rows) {
      const p = row?.Plant;
      if (!p) continue;

      // Only keep species and varieties — skip Genus, Family, Class entries.
      if (p.Rank !== "Species" && p.Rank !== "Variety" && p.Rank !== "Subspecies") {
        stats.droppedRank++;
        continue;
      }

      // Skip entries with no human-readable common name. Wild species
      // without one are taxonomic placeholders the user wouldn't recognize,
      // and falling back to row.Text would leak HTML scientific names.
      const common = (p.CommonName ?? "").trim();
      if (!common) {
        stats.droppedNoCommon++;
        continue;
      }

      const sci = normalizeSci(p.ScientificName ?? "");
      if (!sci) continue;

      // The "Begins With" search isn't a strict genus-prefix filter — it
      // matches any species name containing the search string as a
      // substring (e.g. searching "Beta" returns "Astragalus tibetanus"
      // and "Cyphomandra betacea"). Reject anything whose actual genus
      // (the first token) doesn't match what we asked for. Without this,
      // categories get assigned wildly wrong defaults.
      const actualGenus = sci.split(" ", 1)[0];
      if (actualGenus !== genusLower) {
        stats.droppedWrongGenus++;
        continue;
      }

      // Drop entries that duplicate a hand-curated plant.
      if (CURATED_SCIENTIFIC.has(sci)) {
        stats.droppedCurated++;
        continue;
      }

      const symbol = (p.Symbol ?? "").trim();
      if (!symbol) continue;
      const id = symbol.toLowerCase();

      // Dedupe across multiple genera-search responses (a Solanum search
      // can return Capsicum entries via cross-references in some cases).
      if (bySymbol.has(id)) {
        stats.droppedDup++;
        continue;
      }

      // Display form: capitalize the genus only, leave species/variety
      // epithets lowercase per botanical convention. e.g.
      //   "allium aaseae" -> "Allium aaseae"
      //   "brassica oleracea var. italica" -> "Brassica oleracea var. italica"
      const scientificDisplay = sci.charAt(0).toUpperCase() + sci.slice(1);

      bySymbol.set(id, {
        id,
        name: common,
        scientificName: scientificDisplay,
        category: defaultCategory,
        companions: [],
        antagonists: [],
        extended: true,
      });
      stats.kept++;
    }
  }

  // Sort by id so the output diff is stable across regenerations.
  const sorted = [...bySymbol.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(OUT_PATH, JSON.stringify(sorted, null, 0) + "\n", "utf8");

  process.stderr.write(
    `\nWrote ${sorted.length} entries to ${OUT_PATH}\n` +
      `  fetched: ${stats.fetched}\n` +
      `  kept: ${stats.kept}\n` +
      `  dropped (rank not species/variety): ${stats.droppedRank}\n` +
      `  dropped (no common name): ${stats.droppedNoCommon}\n` +
      `  dropped (genus mismatch from loose search): ${stats.droppedWrongGenus}\n` +
      `  dropped (duplicates curated): ${stats.droppedCurated}\n` +
      `  dropped (duplicate symbol): ${stats.droppedDup}\n`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
