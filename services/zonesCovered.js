// ==========================================================
// 🌍 TINSFLASH – zonesCovered.js (Everest Protocol v3.97 PRO+++)
// ==========================================================
// Centralisation SANS coordonnées en dur : agrège uniquement les exports
// des fichiers runGlobal*.js + zones médias (Bouké, Belgique).
// 100 % réel, 100 % connecté, compatible Render.
// ==========================================================

import { addEngineLog } from "./engineState.js";

// --- Imports modules (aucune hypothèse forte sur les noms des exports) ---
import * as EUROPE   from "./runGlobalEurope.js";
import * as USA      from "./runGlobalUSA.js";
import * as CANADA   from "./runGlobalCanada.js";       // présent dans ton repo
import * as AFRIQUE  from "./runGlobalAfrique.js";
import * as ASIE     from "./runGlobalAsie.js";
import * as OCEANIE  from "./runGlobalOceanie.js";
import * as AMSUD    from "./runGlobalAmeriqueSud.js";
import * as CARIB    from "./runGlobalCaribbean.js";
import * as BOUKE    from "./runBouke.js";
import * as BELG     from "./runBelgique.js";

// ----------------------------------------------------------
// Tolérance aux variantes d'exports (anglais/français, etc.)
// ----------------------------------------------------------
const EUROPE_ZONES             = EUROPE.EUROPE_ZONES || EUROPE.ZONES || [];
const USA_ZONES                = USA.USA_ZONES || USA.NORTH_AMERICA_ZONES || USA.ZONES || [];
const CANADA_ZONES             = CANADA.CANADA_ZONES || USA.CANADA_ZONES || CANADA.ZONES || [];

const AFRICA_NORD_ZONES        = AFRIQUE.AFRICA_NORD_ZONES     || AFRIQUE.AFRIQUE_NORD_ZONES     || AFRIQUE.NORD_ZONES     || [];
const AFRICA_OUEST_ZONES       = AFRIQUE.AFRICA_OUEST_ZONES    || AFRIQUE.AFRIQUE_OUEST_ZONES    || AFRIQUE.OUEST_ZONES    || [];
const AFRICA_CENTRALE_ZONES    = AFRIQUE.AFRICA_CENTRALE_ZONES || AFRIQUE.AFRIQUE_CENTRALE_ZONES || AFRIQUE.CENTRALE_ZONES || [];
const AFRICA_SUD_ZONES         = AFRIQUE.AFRICA_SUD_ZONES      || AFRIQUE.AFRIQUE_SUD_ZONES      || AFRIQUE.SUD_ZONES      || [];
const AFRICA_EST_ZONES         = AFRIQUE.AFRICA_EST_ZONES      || AFRIQUE.AFRIQUE_EST_ZONES      || AFRIQUE.EST_ZONES      || [];

const AMERICA_SUD_ZONES        = AMSUD.AMERICA_SUD_ZONES       || AMSUD.AMERIQUE_SUD_ZONES       || AMSUD.ZONES            || [];

const ASIA_EST_ZONES           = ASIE.ASIA_EST_ZONES           || ASIE.ASIE_EST_ZONES            || ASIE.EST_ZONES         || [];
const ASIA_SUD_ZONES           = ASIE.ASIA_SUD_ZONES           || ASIE.ASIE_SUD_ZONES            || ASIE.SUD_ZONES         || [];
const ASIA_OUEST_ZONES         = ASIE.ASIA_OUEST_ZONES         || ASIE.ASIE_OUEST_ZONES          || ASIE.OUEST_ZONES       || [];

const OCEANIA_ZONES            = OCEANIE.OCEANIA_ZONES         || OCEANIE.OCEANIE_ZONES          || OCEANIE.ZONES          || [];

const CARIBBEAN_ZONES          = CARIB.CARIBBEAN_ZONES         || CARIB.CARAIBES_ZONES           || CARIB.ZONES            || [];

const BOUKE_ZONES              = BOUKE.BOUKE_ZONES             || BOUKE.ZONES                    || [];
const BELGIQUE_ZONES           = BELG.BELGIQUE_ZONES           || BELG.ZONES                     || [];

// ----------------------------------------------------------
// Normalisation : accepte Array OU Object {country: [points]}
// et injecte un continent par défaut si manquant.
// ----------------------------------------------------------
function isPlainObject(o) {
  return o && typeof o === "object" && !Array.isArray(o);
}

function addPoint(target, country, p, defaultContinent) {
  if (!country) country = p.country || p.countryName || p.nation || "Unknown";
  const lat = p.lat ?? p.latitude;
  const lon = p.lon ?? p.longitude;
  if (typeof lat === "undefined" || typeof lon === "undefined") return;

  if (!target[country]) target[country] = [];
  target[country].push({
    name: p.name || p.city || p.region || "Inconnu",
    region: p.region || p.name || p.city || "Inconnu",
    lat: Number(lat),
    lon: Number(lon),
    continent: p.continent || defaultContinent || "Unknown",
  });
}

function normalizeInto(target, raw, defaultContinent) {
  if (!raw) return;
  if (Array.isArray(raw)) {
    for (const p of raw) addPoint(target, p.country, p, defaultContinent);
  } else if (isPlainObject(raw)) {
    for (const [country, arr] of Object.entries(raw)) {
      if (Array.isArray(arr)) arr.forEach(p => addPoint(target, country, p, defaultContinent));
    }
  }
}

// ----------------------------------------------------------
// Construction de l’objet global COVERED_ZONES {country: [points]}
// ----------------------------------------------------------
const COVERED_ZONES = {};

normalizeInto(COVERED_ZONES, EUROPE_ZONES, "Europe");

normalizeInto(COVERED_ZONES, USA_ZONES, "North America");
normalizeInto(COVERED_ZONES, CANADA_ZONES, "North America");

normalizeInto(COVERED_ZONES, AFRICA_NORD_ZONES, "Africa");
normalizeInto(COVERED_ZONES, AFRICA_OUEST_ZONES, "Africa");
normalizeInto(COVERED_ZONES, AFRICA_CENTRALE_ZONES, "Africa");
normalizeInto(COVERED_ZONES, AFRICA_SUD_ZONES, "Africa");
normalizeInto(COVERED_ZONES, AFRICA_EST_ZONES, "Africa");

normalizeInto(COVERED_ZONES, AMERICA_SUD_ZONES, "South America");

normalizeInto(COVERED_ZONES, ASIA_EST_ZONES, "Asia");
normalizeInto(COVERED_ZONES, ASIA_SUD_ZONES, "Asia");
normalizeInto(COVERED_ZONES, ASIA_OUEST_ZONES, "Asia");

normalizeInto(COVERED_ZONES, OCEANIA_ZONES, "Oceania");

normalizeInto(COVERED_ZONES, CARIBBEAN_ZONES, "Caribbean");

// Médias
normalizeInto(COVERED_ZONES, BELGIQUE_ZONES, "Europe");
normalizeInto(COVERED_ZONES, BOUKE_ZONES, "Europe");

// ----------------------------------------------------------
// Énumération simple à plat (compat avec superForecast & runGlobal)
// filter accepte : "All", "Europe", "Africa", "Asia", "Oceania",
// "North America", "South America", "Caribbean", "belgique", "bouke", etc.
// ----------------------------------------------------------
export function enumerateCoveredPoints(filter = "All") {
  const out = [];
  const f = (filter || "All").toLowerCase();

  for (const [country, points] of Object.entries(COVERED_ZONES)) {
    for (const p of points) {
      const continent = (p.continent || "Unknown");
      const continentKey = continent.toLowerCase();
      const countryKey = (country || "").toLowerCase();

      const keep =
        f === "all" ||
        continentKey.includes(f) ||
        countryKey.includes(f) ||
        // cas médias directs
        (f === "belgique" && countryKey.includes("belgique")) ||
        (f === "bouke" && (countryKey.includes("bouke") || p.region?.toLowerCase().includes("bouk")));

      if (keep) {
        out.push({
          country,
          region: p.region || p.name || "Inconnu",
          lat: p.lat,
          lon: p.lon,
          continent,
        });
      }
    }
  }
  return out;
}

// ----------------------------------------------------------
// Stats + Logs
// ----------------------------------------------------------
export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} points couverts (${new Date().toISOString()})`;
  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

// ----------------------------------------------------------
// Réexports explicites (compatibilité maximale)
// ----------------------------------------------------------
export {
  EUROPE_ZONES,
  USA_ZONES,
  CANADA_ZONES,
  AFRICA_NORD_ZONES,
  AFRICA_OUEST_ZONES,
  AFRICA_CENTRALE_ZONES,
  AFRICA_SUD_ZONES,
  AFRICA_EST_ZONES,
  AMERICA_SUD_ZONES,
  ASIA_EST_ZONES,
  ASIA_SUD_ZONES,
  ASIA_OUEST_ZONES,
  OCEANIA_ZONES,
  CARIBBEAN_ZONES,
  BOUKE_ZONES,
  BELGIQUE_ZONES,
};

// Export principal groupé
export default {
  COVERED_ZONES,
  enumerateCoveredPoints,
  logZoneStats,
  EUROPE_ZONES,
  USA_ZONES,
  CANADA_ZONES,
  AFRICA_NORD_ZONES,
  AFRICA_OUEST_ZONES,
  AFRICA_CENTRALE_ZONES,
  AFRICA_SUD_ZONES,
  AFRICA_EST_ZONES,
  AMERICA_SUD_ZONES,
  ASIA_EST_ZONES,
  ASIA_SUD_ZONES,
  ASIA_OUEST_ZONES,
  OCEANIA_ZONES,
  CARIBBEAN_ZONES,
  BOUKE_ZONES,
  BELGIQUE_ZONES,
};
