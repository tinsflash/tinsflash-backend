// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// Everest Protocol v4.5 – FULL CONNECT TOTAL FR/EN
// ==========================================================

import { addEngineLog } from "./engineState.js";

// ==========================================================
// 📦 Imports RÉELS (selon tes fichiers existants)
// ==========================================================
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";
import { CANADA_ZONES } from "./runGlobalCanada.js";
import { AFRICA_NORD_ZONES } from "./runGlobalAfricaNord.js";
import { AFRICA_CENTRALE_ZONES } from "./runGlobalAfricaCentrale.js";
import { AFRICA_OUEST_ZONES } from "./runGlobalAfricaOuest.js";
import { AFRICA_SUD_ZONES } from "./runGlobalAfricaSud.js";
import { AFRICA_EST_ZONES } from "./runGlobalAfricaEst.js";
import { AMERIQUE_SUD_ZONES } from "./runGlobalAmeriqueSud.js";
import { ASIA_ZONES } from "./runGlobalAsie.js";
import { OCEANIE_ZONES } from "./runGlobalOceanie.js";
import { CARIBBEAN_ZONES } from "./runGlobalCaribbean.js";
import { BOUKE_ZONES } from "./runBouke.js";
import { BELGIQUE_ZONES } from "./runBelgique.js";

// ==========================================================
// 🌐 EXPORTS DIRECTS – compatibilité FR & EN
// ==========================================================
export {
  EUROPE_ZONES,
  USA_ZONES,
  CANADA_ZONES,
  AFRICA_NORD_ZONES,
  AFRICA_CENTRALE_ZONES,
  AFRICA_OUEST_ZONES,
  AFRICA_SUD_ZONES,
  AFRICA_EST_ZONES,
  AMERIQUE_SUD_ZONES,
  ASIA_ZONES,
  OCEANIE_ZONES,
  CARIBBEAN_ZONES,
  BOUKE_ZONES,
  BELGIQUE_ZONES,
};

// ✅ Alias anglais et variantes régionales
export const AMERICA_SUD_ZONES = AMERIQUE_SUD_ZONES;
export const OCEANIA_ZONES = OCEANIE_ZONES;
export const ASIA_EST_ZONES = ASIA_ZONES;
export const ASIA_SUD_ZONES = ASIA_ZONES;

// ==========================================================
// 🌍 FUSION COMPLÈTE EN TABLEAU GLOBAL
// ==========================================================
export const COVERED_ZONES = [
  ...(EUROPE_ZONES || []),
  ...(USA_ZONES || []),
  ...(CANADA_ZONES || []),
  ...(AFRICA_NORD_ZONES || []),
  ...(AFRICA_CENTRALE_ZONES || []),
  ...(AFRICA_OUEST_ZONES || []),
  ...(AFRICA_SUD_ZONES || []),
  ...(AFRICA_EST_ZONES || []),
  ...(AMERIQUE_SUD_ZONES || []),
  ...(ASIA_ZONES || []),
  ...(OCEANIE_ZONES || []),
  ...(CARIBBEAN_ZONES || []),
  ...(BELGIQUE_ZONES || []),
  ...(BOUKE_ZONES || []),
];

// ==========================================================
// 🔎 ENUMÉRATION + FILTRAGE
// ==========================================================
export function enumerateCoveredPoints(filter = "All") {
  const out = [];

  for (const p of COVERED_ZONES) {
    const continent = p.continent || "Unknown";
    const name = p.region || p.name || "Inconnu";
    const lat = p.lat ?? p.latitude;
    const lon = p.lon ?? p.longitude;

    if (
      filter === "All" ||
      (filter === "Main" && ["Europe", "North America"].includes(continent)) ||
      (filter === "World" && !["Europe", "North America"].includes(continent)) ||
      (p.country && p.country.toLowerCase().includes(filter.toLowerCase())) ||
      (name.toLowerCase().includes(filter.toLowerCase()))
    ) {
      out.push({
        region: name,
        lat,
        lon,
        continent,
        country: p.country || "Inconnu",
      });
    }
  }

  return out;
}

// ==========================================================
// 📊 STATISTIQUES & LOGS
// ==========================================================
export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} zones (${new Date().toISOString()})`;
  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

export default { COVERED_ZONES, enumerateCoveredPoints, logZoneStats };
