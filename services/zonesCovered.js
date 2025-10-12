// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// Everest Protocol v4.8 – RENDER SAFE NO-AWAIT EDITION
// ==========================================================
import { addEngineLog } from "./engineState.js";

// Variables globales (remplies après init)
let modules = {};
let COVERED_ZONES = [];
let initialized = false;

// ==========================================================
// 🧠 INITIALISATION ASYNCHRONE
// ==========================================================
export async function initZones() {
  if (initialized) return; // évite double chargement
  modules = {
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

  for (const [key, path] of imports) {
    try {
      const mod = await import(path);
      if (mod[key]) modules[key] = mod[key];
    } catch {
      modules[key] = [];
    }
  }

  COVERED_ZONES = Object.values(modules).flat();
  initialized = true;
  await addEngineLog(`✅ Zones initialisées (${COVERED_ZONES.length})`, "info", "zonesCovered");
}

// ==========================================================
// 🔎 ENUMÉRATION + LOGS
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
  if (!initialized) await initZones();
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} zones (${new Date().toISOString()})`;
  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

// ==========================================================
// 🌐 EXPORTS
// ==========================================================
export const getZones = () => modules;
export const getCoveredZones = () => COVERED_ZONES;

export default { initZones, enumerateCoveredPoints, logZoneStats, getZones, getCoveredZones };
