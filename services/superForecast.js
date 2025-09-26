// PATH: services/superForecast.js
// Fusion multi-modèles météo + IA pour interprétation

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import openweather from "./openweather.js";
import { askAI } from "./aiService.js";

// ======================
// Zones couvertes
// ======================
const COVERED_REGIONS = [
  // UE27
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Czech Republic","Romania","Slovakia",
  "Slovenia","Sweden",

  // Ajouts
  "Ukraine",
  "United Kingdom","UK","England","Scotland","Wales","Northern Ireland",
  "Norway",
  "USA","United States"
];

/**
 * Vérifie si une zone est couverte
 */
function isCovered(country) {
  if (!country) return false;
  return COVERED_REGIONS.includes(country);
}

/**
 * SuperForecast = moteur principal
 * - Zones couvertes → multi-modèles météo + IA
 * - Zones non couvertes → Open Data météo + IA
 */
export default async function runSuperForecast(location) {
  try {
    const covered = isCovered(location.country ?? "");
    let combined = {};
    let prompt = "";

    if (covered) {
      console.log("🌍 SuperForecast → zone couverte:", location.country);

      // Données multi-modèles
      const [gfsData, ecmwfData, iconData] = await Promise.all([
        gfs(location),
        ecmwf(location),
        icon(location),
      ]);

      combined = {
        location,
        gfs: gfsData,
        ecmwf: ecmwfData,
        icon: iconData,
        covered,
        generatedAt: new Date().toISOString(),
      };

      prompt = `
Prévisions météorologiques détaillées pour ${location.country}.
Localisation: ${JSON.stringify(location)}.

Données modèles:
- GFS: ${JSON.stringify(gfsData)}
- ECMWF: ${JSON.stringify(ecmwfData)}
- ICON: ${JSON.stringify(iconData)}

Consignes:
- Analyse locale (géolocalisation) + nationale.
- Inclure tendances sur 7 jours.
- Mentionner incertitudes et risques.
- Style: bulletin météo précis et concis en français.
`;
    } else {
      console.log("🌍 SuperForecast → zone NON couverte:", location.country);

      // Données Open Data
      const owData = await openweather(location.lat, location.lon);

      combined = {
        location,
        openweather: owData,
        covered,
        generatedAt: new Date().toISOString(),
      };

      prompt = `
Prévisions météo simplifiées pour ${location.country ?? "zone non couverte"}.
Localisation: ${JSON.stringify(location)}.

Données disponibles (Open Data):
${JSON.stringify(owData)}

Consignes:
- Synthèse locale/nationale simple.
- Mentionner continent et tendances globales.
- Pas d'alertes locales (uniquement continentales).
- Style: clair, concis, en français.
`;
    }

    const analysis = await askAI(prompt);
    return { zone: location.country, covered, raw: combined, analysis };
  } catch (err) {
    console.error("❌ Erreur superForecast:", err);
    return { error: "SuperForecast failed", details: err.message };
  }
}
