// PATH: services/zonesCovered.js
// 🎯 Fichier unique qui centralise TOUTES les coordonnées "zones couvertes"

import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";

/**
 * EUROPE_ZONES et USA_ZONES doivent exposer un objet:
 * {
 *   "France": [{ name:"Paris IDF", lat:48.86, lon:2.34, region:"IDF" }, ...],
 *   "USA": [{ name:"California - LA", lat:34.05, lon:-118.24, region:"CA" }, ...],
 *   ...
 * }
 */

export const COVERED_ZONES = {
  ...(EUROPE_ZONES || {}),
  ...(USA_ZONES || {}),
};

// Liste à plat pratique pour itérer
export function enumerateCoveredPoints() {
  const out = [];
  for (const [country, points] of Object.entries(COVERED_ZONES)) {
    for (const p of points) {
      out.push({
        country,
        region: p.region || p.name || "Inconnu",
        lat: p.lat ?? p.latitude,
        lon: p.lon ?? p.longitude,
        continent: country === "USA" ? "North America" : "Europe",
      });
    }
  }
  return out;
}
