// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// Everest Protocol v4.7 – FULL SAFE RENDER EDITION
// ==========================================================
import { addEngineLog } from "./engineState.js";

// ----------------------------------------------------------
// ⚙️ Import dynamique encapsulé pour éviter top-level await
// ----------------------------------------------------------
const modules = await (async () => {
  const result = {
    EUROPE_ZONES: [],
    USA_ZONES: [],
    CANADA_ZONES: [],
    AFRICA_NORD_ZONES: [],
    AFRICA_CENTRALE_ZONES: [],
    AFRICA_OUEST_ZONES: [],
    AFRICA_SUD_ZONES: [],
    AFRICA_EST_ZONES: [],
    AMERIQUE_SUD_ZONES: [],
    ASIA_ZONES: [],
    OCEANIE_ZONES: [],
    CARIBBEAN_ZONES: [],
    BOUKE_ZONES: [],
    BELGIQUE_ZONES: [],
  };

  const imports = [
    ["EUROPE_ZONES", "./runGlobalEurope.js"],
    ["USA_ZONES", "./runGlobalUSA.js"],
    ["CANADA_ZONES", "./runGlobalCanada.js"],
    ["AFRICA_NORD_ZONES", "./runGlobalAfricaNord.js"],
    ["AFRICA_CENTRALE_ZONES", "./runGlobalAfricaCentrale.js"],
    ["AFRICA_OUEST_ZONES", "./runGlobalAfricaOuest.js"],
    ["AFRICA_SUD_ZONES", "./runGlobalAfricaSud.js"],
    ["AFRICA_EST_ZONES", "./runGlobalAfricaEst.js"],
    ["AMERIQUE_SUD_ZONES", "./runGlobalAmeriqueSud.js"],
    ["ASIA_ZONES", "./runGlobalAsie.js"],
    ["OCEANIE_ZONES", "./runGlobalOceanie.js"],
    ["CARIBBEAN_ZONES", "./runGlobalCaribbean.js"],
    ["BOUKE_ZONES", "./runBouke.js"],
    ["BELGIQUE_ZONES", "./runBelgique.js"],
  ];

  await Promise.all(
    imports.map(async ([key, path]) => {
      try {
        const mod = await import(path);
        if (mod[key]) result[key] = mod[key];
      } catch {
        // si erreur import : laisse vide
      }
    })
  );

  return result;
})();

// ----------------------------------------------------------
// 🌐 EXPORTS FR / EN
// ----------------------------------------------------------
export const {
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
} = modules;

// Alias anglais pour compat Render
export const AMERICA_SUD_ZONES = AMERIQUE_SUD_ZONES;
export const ASIA_EST_ZONES = ASIA_ZONES;
export const ASIA_SUD_ZONES = ASIA_ZONES;
export const OCEANIA_ZONES = OCEANIE_ZONES;

// ----------------------------------------------------------
// 🌍 FUSION COMPLÈTE
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// 🔎 ENUMÉRATION + LOGS
// ----------------------------------------------------------
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
