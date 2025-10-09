// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// Everest Protocol v3.0 – 100 % réel, 100 % connecté
// ==========================================================

import { addEngineLog } from "./engineState.js";

import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";
import { CANADA_ZONES } from "./runGlobalCanada.js";
import { AFRICA_NORD_ZONES } from "./runGlobalAfricaNord.js";
import { AFRICA_CENTRALE_ZONES } from "./runGlobalAfricaCentrale.js";
import { AFRICA_OUEST_ZONES } from "./runGlobalAfricaOuest.js";
import { AFRICA_SUD_ZONES } from "./runGlobalAfricaSud.js";
import { AFRICA_EST_ZONES } from "./runGlobalAfricaEst.js";
import { AMERICA_SUD_ZONES } from "./runGlobalAmericaSud.js";
import { ASIA_EST_ZONES } from "./runGlobalAsiaEst.js";
import { ASIA_SUD_ZONES } from "./runGlobalAsiaSud.js";
import { OCEANIA_ZONES } from "./runGlobalOceania.js";
import { CARIBBEAN_ZONES } from "./runGlobalCaribbean.js";

// ==========================================================
// 🌐 FUSION COMPLÈTE DES ZONES
// ==========================================================
export const COVERED_ZONES = {
  ...(EUROPE_ZONES || {}),
  ...(USA_ZONES || {}),
  ...(CANADA_ZONES || {}),
  ...(AFRICA_NORD_ZONES || {}),
  ...(AFRICA_CENTRALE_ZONES || {}),
  ...(AFRICA_OUEST_ZONES || {}),
  ...(AFRICA_SUD_ZONES || {}),
  ...(AFRICA_EST_ZONES || {}),
  ...(AMERICA_SUD_ZONES || {}),
  ...(ASIA_EST_ZONES || {}),
  ...(ASIA_SUD_ZONES || {}),
  ...(OCEANIA_ZONES || {}),
  ...(CARIBBEAN_ZONES || {}),
};

// ==========================================================
// 🔍 ÉNUMÉRATION À PLAT
// ==========================================================
export function enumerateCoveredPoints(filter = "All") {
  const out = [];

  for (const [country, points] of Object.entries(COVERED_ZONES)) {
    for (const p of points) {
      const continent = p.continent || "Unknown";
      if (
        filter === "All" ||
        (filter === "Main" && ["Europe", "North America"].includes(continent)) ||
        (filter === "World" && !["Europe", "North America"].includes(continent))
      ) {
        out.push({
          country,
          region: p.region || p.name || "Inconnu",
          lat: p.lat ?? p.latitude,
          lon: p.lon ?? p.longitude,
          continent,
        });
      }
    }
  }

  return out;
}

// ==========================================================
// 🛰️ STATISTIQUES & LOGS
// ==========================================================
export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} zones (${new Date().toISOString()})`;
  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

export default { COVERED_ZONES, enumerateCoveredPoints, logZoneStats };
