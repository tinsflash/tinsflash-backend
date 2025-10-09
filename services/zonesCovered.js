// PATH: services/zonesCovered.js
// 🌍 CENTRALISATION MONDIALE DES ZONES COUVERTES – TINSFLASH PRO+++
//
// Compatible avec :
// - runMain.js  → Europe + USA + Canada (2x/jour)
// - runWorld.js → reste du monde (1x/jour)
// - runAll.js   → exécution globale totale
// ===============================================================

import { addEngineLog } from "./engineState.js";

import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";
import { CANADA_ZONES } from "./runGlobalCanada.js";
import { AFRICA_NORD_ZONES } from "./runGlobalAfricaNord.js";
import { AFRICA_CENTRALE_ZONES } from "./runGlobalAfricaCentrale.js";
import { AFRICA_OUEST_ZONES } from "./runGlobalAfricaOuest.js";
import { AFRICA_SUD_ZONES } from "./runGlobalAfricaSud.js";
import { AMERICA_SUD_ZONES } from "./runGlobalAmericaSud.js";
import { ASIA_EST_ZONES } from "./runGlobalAsiaEst.js";
import { ASIA_SUD_ZONES } from "./runGlobalAsiaSud.js";
import { OCEANIA_ZONES } from "./runGlobalOceania.js";
import { CARIBBEAN_ZONES } from "./runGlobalCaribbean.js";

// ===============================================================
// 🌐 FUSION GLOBALE DES ZONES COUVERTES
// ===============================================================
export const COVERED_ZONES = {
  ...(EUROPE_ZONES || {}),
  ...(USA_ZONES || {}),
  ...(CANADA_ZONES || {}),
  ...(AFRICA_NORD_ZONES || {}),
  ...(AFRICA_CENTRALE_ZONES || {}),
  ...(AFRICA_OUEST_ZONES || {}),
  ...(AFRICA_SUD_ZONES || {}),
  ...(AMERICA_SUD_ZONES || {}),
  ...(ASIA_EST_ZONES || {}),
  ...(ASIA_SUD_ZONES || {}),
  ...(OCEANIA_ZONES || {}),
  ...(CARIBBEAN_ZONES || {}),
};

// ===============================================================
// 🔍 GÉNÉRATION DE LA LISTE À PLAT DES POINTS COUVERTS
// ===============================================================
export function enumerateCoveredPoints(filter = "All") {
  const out = [];

  for (const [country, points] of Object.entries(COVERED_ZONES)) {
    for (const p of points) {
      // Détection du continent
      let continent = "Unknown";

      if (
        [
          "France", "Belgium", "Germany", "Italy", "Spain", "UK", "Poland",
          "Norway", "Sweden", "Finland", "Netherlands", "Switzerland",
          "Austria", "Ireland", "Denmark"
        ].includes(country)
      ) {
        continent = "Europe";
      } else if (["USA", "Canada"].includes(country)) {
        continent = "North America";
      } else if (["Brazil", "Argentina", "Chile", "Peru", "Colombia"].includes(country)) {
        continent = "South America";
      } else if (
        [
          "Morocco", "Algeria", "Tunisia", "Egypt", "Congo", "SouthAfrica",
          "Nigeria", "Ghana", "Abba"
        ].includes(country)
      ) {
        continent = "Africa";
      } else if (
        [
          "China", "India", "Japan", "Thailand", "Philippines", "Indonesia",
          "SouthKorea", "Vietnam"
        ].includes(country)
      ) {
        continent = "Asia";
      } else if (["Australia", "NewZealand"].includes(country)) {
        continent = "Oceania";
      } else if (["Cuba", "Haiti", "DominicanRepublic", "Jamaica"].includes(country)) {
        continent = "Caribbean";
      }

      // Application du filtre
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

// ===============================================================
// 🧭 COMPTEUR GLOBAL
// ===============================================================
export function countZones(filter = "All") {
  return enumerateCoveredPoints(filter).length;
}

// ===============================================================
// 🛰️ DIAGNOSTIC AUTOMATIQUE DE COUVERTURE
// ===============================================================
export async function logZoneStats() {
  const all = enumerateCoveredPoints("All");
  const main = enumerateCoveredPoints("Main");
  const world = enumerateCoveredPoints("World");

  const byContinent = {
    Europe: all.filter((z) => z.continent === "Europe").length,
    "North America": all.filter((z) => z.continent === "North America").length,
    "South America": all.filter((z) => z.continent === "South America").length,
    Africa: all.filter((z) => z.continent === "Africa").length,
    Asia: all.filter((z) => z.continent === "Asia").length,
    Oceania: all.filter((z) => z.continent === "Oceania").length,
    Caribbean: all.filter((z) => z.continent === "Caribbean").length,
  };

  const summary = `🌍 Zones couvertes :
    • Europe : ${byContinent.Europe}
    • Amérique Nord : ${byContinent["North America"]}
    • Amérique Sud : ${byContinent["South America"]}
    • Afrique : ${byContinent.Africa}
    • Asie : ${byContinent.Asia}
    • Océanie : ${byContinent.Oceania}
    • Caraïbes : ${byContinent.Caribbean}
    — TOTAL : ${all.length} zones actives —
  `;

  console.log(summary);
  await addEngineLog(summary, "info", "zonesCovered");
  return summary;
}

// ===============================================================
// ✅ EXPORT GLOBAL
// ===============================================================
export default { COVERED_ZONES, enumerateCoveredPoints, countZones, logZoneStats };
