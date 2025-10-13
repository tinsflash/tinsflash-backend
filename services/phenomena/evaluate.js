// services/phenomena/evaluate.js
// Agrège automatiquement les modules phénomènes déjà présents dans services/phenomena/*
// Chaque module doit exporter une fonction async score(data) -> { label, score, details }

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const PHENOMENA_DIR = path.join(process.cwd(), "services", "phenomena");

// ordre de priorité si scores proches
const PRIORITY = ["thunder", "hail", "snow", "rain", "wind", "fog", "drizzle", "ice", "dust", "heat", "cold"];

export async function evaluatePhenomena(data) {
  const results = [];

  try {
    if (!fs.existsSync(PHENOMENA_DIR)) return { results, top: null };

    const files = fs.readdirSync(PHENOMENA_DIR)
      .filter(f => f.endsWith(".js") && !f.includes("evaluate"));

    for (const f of files) {
      try {
        const modUrl = pathToFileURL(path.join(PHENOMENA_DIR, f)).href;
        const mod = await import(modUrl);
        if (typeof mod.score === "function") {
          const r = await mod.score(data);
          if (r && typeof r.score === "number") results.push({ file: f, ...r });
        }
      } catch (e) {
        // on ignore un module HS sans casser la phase
      }
    }

    // tri par score (desc) puis priorité
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const pa = PRIORITY.indexOf((a.id || a.label || "").toLowerCase());
      const pb = PRIORITY.indexOf((b.id || b.label || "").toLowerCase());
      return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
    });

    const top = results.length ? results[0] : null;
    return { results, top };
  } catch (e) {
    return { results: [], top: null };
  }
}

export default { evaluatePhenomena };
