// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// Everest Protocol v4.6 – FULL AUTO-SAFE MODE
// ==========================================================

import { addEngineLog } from "./engineState.js";

// ==========================================================
// 📦 Imports RÉELS (tolérants aux modules vides)
// ==========================================================
let EUROPE_ZONES, USA_ZONES, CANADA_ZONES,
  AFRICA_NORD_ZONES, AFRICA_CENTRALE_ZONES, AFRICA_OUEST_ZONES,
  AFRICA_SUD_ZONES, AFRICA_EST_ZONES,
  AMERIQUE_SUD_ZONES, ASIA_ZONES, OCEANIE_ZONES, CARIBBEAN_ZONES,
  BOUKE_ZONES, BELGIQUE_ZONES;

try { ({ EUROPE_ZONES } = await import("./runGlobalEurope.js")); } catch {}
try { ({ USA_ZONES } = await import("./runGlobalUSA.js")); } catch {}
try { ({ CANADA_ZONES } = await import("./runGlobalCanada.js")); } catch {}
try { ({ AFRICA_NORD_ZONES } = await import("./runGlobalAfricaNord.js")); } catch {}
try { ({ AFRICA_CENTRALE_ZONES } = await import("./runGlobalAfricaCentrale.js")); } catch {}
try { ({ AFRICA_OUEST_ZONES } = await import("./runGlobalAfricaOuest.js")); } catch {}
try { ({ AFRICA_SUD_ZONES } = await import("./runGlobalAfricaSud.js")); } catch {}
try { ({ AFRICA_EST_ZONES } = await import("./runGlobalAfricaEst.js")); } catch {}
try { ({ AMERIQUE_SUD_ZONES } = await import("./runGlobalAmeriqueSud.js")); } catch {}
try { ({ ASIA_ZONES } = await import("./runGlobalAsie.js")); } catch {}
try { ({ OCEANIE_ZONES } = await import("./runGlobalOceanie.js")); } catch {}
try { ({ CARIBBEAN_ZONES } = await import("./runGlobalCaribbean.js")); } catch {}
try { ({ BOUKE_ZONES } = await import("./runBouke.js")); } catch {}
try { ({ BELGIQUE_ZONES } = await import("./runBelgique.js")); } catch {}

// Sécurisation : si un module ne renvoie rien → tableau vide
EUROPE_ZONES ||= [];
USA_ZONES ||= [];
CANADA_ZONES ||= [];
AFRICA_NORD_ZONES ||= [];
AFRICA_CENTRALE_ZONES ||= [];
AFRICA_OUEST_ZONES ||= [];
AFRICA_SUD_ZONES ||= [];
AFRICA_EST_ZONES ||= [];
AMERIQUE_SUD_ZONES ||= [];
ASIA_ZONES ||= [];
OCEANIE_ZONES ||= [];
CARIBBEAN_ZONES ||= [];
BOUKE_ZONES ||= [];
BELGIQUE_ZONES ||= [];

// ==========================================================
// 🌐 EXPORTS – Compatibilité FR / EN
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

// Alias anglais pour les vieux imports
export const AMERICA_SUD_ZONES = AMERIQUE_SUD_ZONES;
export const ASIA_EST_ZONES = ASIA_ZONES;
export const ASIA_SUD_ZONES = ASIA_ZONES;
export const OCEANIA_ZONES = OCEANIE_ZONES;

// ==========================================================
// 🌍 Fusion complète (tableau unique)
// ==========================================================
export const COVERED_ZONES = [
  ...EUROPE_ZONES,
  ...USA_ZONES,
  ...CANADA_ZONES,
  ...AFRICA_NORD_ZONES,
  ...AFRICA_CENTRALE_ZONES,
  ...AFRICA_OUEST_ZONES,
  ...AFRICA_SUD_ZONES,
  ...AFRICA_EST_ZONES,
  ...AMERIQUE_SUD_ZONES,
  ...ASIA_ZONES,
  ...OCEANIE_ZONES,
  ...CARIBBEAN_ZONES,
  ...BELGIQUE_ZONES,
  ...BOUKE_ZONES,
];

// ==========================================================
// 🔎 Enumération & Stats
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
      name.toLowerCase().includes(filter.toLowerCase())
    ) {
      out.push({ region: name, lat, lon, continent, country: p.country || "Inconnu" });
    }
  }

  return out;
}

export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} zones (${new Date().toISOString()})`;
  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

export default { COVERED_ZONES, enumerateCoveredPoints, logZoneStats };
