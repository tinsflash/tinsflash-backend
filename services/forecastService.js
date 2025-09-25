// PATH: services/forecastService.js
// Service prévisions météo locales et nationales

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import openweather from "./openweather.js";
import { askAI } from "./aiService.js";

// Zones couvertes
const COVERED_REGIONS = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Czech Republic","Romania","Slovakia",
  "Slovenia","Sweden",
  "Ukraine",
  "United Kingdom","UK","England","Scotland","Wales","Northern Ireland",
  "Norway",
  "USA","United States"
];

function isCovered(country) {
  if (!country) return false;
  return COVERED_REGIONS.includes(country);
}

/**
 * Prévisions locales (par coordonnées)
 */
async function getLocalForecast(lat, lon, country = null) {
  if (isCovered(country)) {
    const [gfsData, ecmwfData, iconData] = await Promise.all([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
    ]);

    const prompt = `
Prévisions météo locales pour coordonnées: lat=${lat}, lon=${lon}.
Pays: ${country}.

Données modèles:
- GFS: ${JSON.stringify(gfsData)}
- ECMWF: ${JSON.stringify(ecmwfData)}
- ICON: ${JSON.stringify(iconData)}

Consignes:
- Résumé pour aujourd'hui + 7 jours.
- Inclure températures, précipitations, vents.
- Mentionner incertitudes.
- Style clair en français.
`;

    const analysis = await askAI(prompt);
    return { lat, lon, country, covered: true, forecast: analysis };
  } else {
    const owData = await openweather(lat, lon);
    const prompt = `
Prévisions météo simplifiées (zone non couverte).
Coordonnées: lat=${lat}, lon=${lon}.
Pays: ${country ?? "inconnu"}.

Données Open Data:
${JSON.stringify(owData)}

Consignes:
- Fournir tendances générales locales/nationales.
- Pas d'alertes locales (continentales seulement).
- Style concis en français.
`;
    const analysis = await askAI(prompt);
    return { lat, lon, country, covered: false, forecast: analysis };
  }
}

/**
 * Prévisions nationales (par pays)
 */
async function getForecast(country) {
  if (isCovered(country)) {
    const [gfsData, ecmwfData, iconData] = await Promise.all([
      gfs({ country }),
      ecmwf({ country }),
      icon({ country }),
    ]);

    const prompt = `
Prévisions météo nationales pour ${country}.
Données modèles:
- GFS: ${JSON.stringify(gfsData)}
- ECMWF: ${JSON.stringify(ecmwfData)}
- ICON: ${JSON.stringify(iconData)}

Consignes:
- Résumé national (aujourd'hui + 7 jours).
- Inclure températures, précipitations, vents, risques météo.
- Mentionner incertitudes.
- Style clair en français.
`;
    const analysis = await askAI(prompt);
    return { country, covered: true, forecast: analysis };
  } else {
    const prompt = `
Prévisions météo nationales simplifiées pour ${country} (zone non couverte).
Consignes:
- Résumé global basé sur tendances continentales.
- Pas de détail local.
- Style concis en français.
`;
    const analysis = await askAI(prompt);
    return { country, covered: false, forecast: analysis };
  }
}

export default { getLocalForecast, getForecast };
