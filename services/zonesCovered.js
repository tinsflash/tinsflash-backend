// ==========================================================
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
// v4.2 resilient import style (tolérant aux variations d'exports)
// ==========================================================

import { addEngineLog } from "./engineState.js";

// Import en namespace pour éviter les erreurs si l'export nommé manque
import * as europeMod from "./runGlobalEurope.js";
import * as usaMod from "./runGlobalUSA.js";
import * as canadaMod from "./runGlobalCanada.js";
import * as africaNordMod from "./runGlobalAfricaNord.js";
import * as africaCentraleMod from "./runGlobalAfricaCentrale.js";
import * as africaOuestMod from "./runGlobalAfricaOuest.js";
import * as africaSudMod from "./runGlobalAfricaSud.js";
import * as africaEstMod from "./runGlobalAfricaEst.js";
import * as ameriqueSudMod from "./runGlobalAmericaSud.js";
import * as asiaEstMod from "./runGlobalAsiaEst.js";
import * as asiaSudMod from "./runGlobalAsiaSud.js";
import * as oceanieMod from "./runGlobalOceania.js";
import * as caribbeanMod from "./runGlobalCaribbean.js";

// Médias / locales
import * as boukeMod from "./runBouke.js";
import * as belgiqueMod from "./runBelgique.js";

// Helper pour extraire la valeur correcte d'un module (tolérant)
function extractZones(mod, candidates = []) {
  // candidates: liste de clés probables dans l'ordre de préférence
  for (const c of candidates) {
    if (c in mod && mod[c]) return mod[c];
  }
  // fallback to common patterns
  if (mod.COVERED_ZONES) return mod.COVERED_ZONES;
  if (mod.default) return mod.default;
  // try to find any exported object-looking value
  for (const k of Object.keys(mod)) {
    if (Array.isArray(mod[k]) || typeof mod[k] === "object") return mod[k];
  }
  return {};
}

// ==========================================================
// Récupération tolérante des zones depuis chaque module
// Les noms ci-dessous sont des suggestions — on teste plusieurs variantes
// ==========================================================
const EUROPE_ZONES = extractZones(europeMod, ["EUROPE_ZONES", "EUROPE", "default"]);
const USA_ZONES = extractZones(usaMod, ["USA_ZONES", "US_ZONES", "USA", "default"]);
const CANADA_ZONES = extractZones(canadaMod, ["CANADA_ZONES", "CANADA", "default"]);

const AFRICA_NORD_ZONES = extractZones(africaNordMod, ["AFRICA_NORD_ZONES", "AFRICA_NORD", "AFRICA_NORTH", "default"]);
const AFRICA_CENTRALE_ZONES = extractZones(africaCentraleMod, ["AFRICA_CENTRALE_ZONES", "AFRICA_CENTRALE", "AFRICA_CENTRAL", "default"]);
const AFRICA_OUEST_ZONES = extractZones(africaOuestMod, ["AFRICA_OUEST_ZONES", "AFRICA_OUEST", "AFRICA_WEST", "default"]);
const AFRICA_SUD_ZONES = extractZones(africaSudMod, ["AFRICA_SUD_ZONES", "AFRICA_SUD", "AFRICA_SOUTH", "default"]);
const AFRICA_EST_ZONES = extractZones(africaEstMod, ["AFRICA_EST_ZONES", "AFRICA_EST", "AFRICA_EAST", "default"]);

const AMERICA_SUD_ZONES = extractZones(ameriqueSudMod, ["AMERICA_SUD_ZONES", "AMERIQUE_SUD_ZONES", "AMERICA_SUD", "AMERICA_SOUTH", "default"]);

const ASIA_EST_ZONES = extractZones(asiaEstMod, ["ASIA_EST_ZONES", "ASIA_EAST", "ASIA_EST", "default"]);
const ASIA_SUD_ZONES = extractZones(asiaSudMod, ["ASIA_SUD_ZONES", "ASIA_SOUTH", "ASIA_SUD", "default"]);

const OCEANIA_ZONES = extractZones(oceanieMod, ["OCEANIA_ZONES", "OCEANIE_ZONES", "OCEANIA", "default"]);
const CARIBBEAN_ZONES = extractZones(caribbeanMod, ["CARIBBEAN_ZONES", "CARIBBEAN", "default"]);

const BOUKE_ZONES = extractZones(boukeMod, ["BOUKE_ZONES", "BOUKE", "default"]);
const BELGIQUE_ZONES = extractZones(belgiqueMod, ["BELGIQUE_ZONES", "BELGIQUE", "BELGIUM", "default"]);

// ==========================================================
// Construction initiale — on expose aussi initZones() si tu veux forcer rebuild
// ==========================================================
export let COVERED_ZONES = {
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
  ...(BELGIQUE_ZONES || {}),
  ...(BOUKE_ZONES || {}),
};

// Fonction pour recharger explicitement (utile en debug / dev)
export async function initZones() {
  // Si besoin on peut dynamic importer ici ; pour l'instant on reconstruit à partir des variables déjà extraites
  COVERED_ZONES = {
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
    ...(BELGIQUE_ZONES || {}),
    ...(BOUKE_ZONES || {}),
  };
  await addEngineLog(`zonesCovered: initZones exécuté, ${Object.keys(COVERED_ZONES).length} pays chargés`, "info", "zonesCovered");
  return COVERED_ZONES;
}

// ==========================================================
// Énumération + filtrage
// ==========================================================
export function enumerateCoveredPoints(filter = "All") {
  const out = [];
  // Defensive: COVERED_ZONES peut être vide mais on renvoie [] plutôt que crash
  if (!COVERED_ZONES || typeof COVERED_ZONES !== "object") return out;

  for (const [country, points] of Object.entries(COVERED_ZONES)) {
    // points peut être un objet, tableau, ou map — normalisons
    const iterablePoints = Array.isArray(points) ? points : (points && typeof points === "object" ? Object.values(points) : []);
    if (!iterablePoints || !iterablePoints[Symbol.iterator]) continue;

    for (const p of iterablePoints) {
      if (!p) continue;
      const continent = p.continent || p.contry || p.region || "Unknown";
      const zoneKey = (continent || "").toString().toLowerCase();
      try {
        if (
          filter === "All" ||
          (filter === "Main" && ["Europe", "North America"].includes(continent)) ||
          (filter === "World" && !["Europe", "North America"].includes(continent)) ||
          zoneKey.includes(filter.toLowerCase()) ||
          (filter.toLowerCase() === "belgique" && country.toLowerCase().includes("belgique")) ||
          (filter.toLowerCase() === "bouke" && (country.toLowerCase().includes("bouke") || (p.name && p.name.toLowerCase().includes("bouke"))))
        ) {
          out.push({
            country,
            region: p.region || p.name || "Inconnu",
            lat: p.lat ?? p.latitude ?? p.lat_deg ?? null,
            lon: p.lon ?? p.longitude ?? p.lon_deg ?? null,
            continent,
          });
        }
      } catch (err) {
        // ignore bad point
      }
    }
  }
  return out;
}

// ==========================================================
// Statistiques
// ==========================================================
export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const summary = `🌍 Total global : ${all.length} zones (${new Date().toISOString()})`;
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

// Exports nominaux (compatibilité)
export {
  EUROPE_ZONES,
  USA_ZONES,
  CANADA_ZONES,
  AFRICA_NORD_ZONES,
  AFRICA_CENTRALE_ZONES,
  AFRICA_OUEST_ZONES,
  AFRICA_SUD_ZONES,
  AFRICA_EST_ZONES,
  AMERICA_SUD_ZONES,
  ASIA_EST_ZONES,
  ASIA_SUD_ZONES,
  OCEANIA_ZONES,
  CARIBBEAN_ZONES,
  BOUKE_ZONES,
  BELGIQUE_ZONES,
};

export default { COVERED_ZONES, enumerateCoveredPoints, logZoneStats, initZones };
