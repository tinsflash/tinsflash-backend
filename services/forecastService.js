// PATH: services/forecastService.js
// Service prévisions météo locales et nationales enrichi

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import openweather from "./openweather.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import { askAI } from "./aiService.js";

// ======================
// Zones couvertes
// ======================
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
    // Multi-sources en parallèle
    const [
      gfsData, ecmwfData, iconData,
      meteomaticsData, nasaData, copernicusData,
      trullemansData, wetterzentraleData
    ] = await Promise.allSettled([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
      meteomatics({ lat, lon, country }),
      nasaSat({ lat, lon, country }),
      copernicus({ lat, lon, country }),
      trullemans({ lat, lon, country }),
      wetterzentrale({ lat, lon, country })
    ]);

    const sources = {
      gfs: gfsData.value ?? { error: gfsData.reason?.message },
      ecmwf: ecmwfData.value ?? { error: ecmwfData.reason?.message },
      icon: iconData.value ?? { error: iconData.reason?.message },
      meteomatics: meteomaticsData.value ?? { error: meteomaticsData.reason?.message },
      nasaSat: nasaData.value ?? { error: nasaData.reason?.message },
      copernicus: copernicusData.value ?? { error: copernicusData.reason?.message },
      trullemans: trullemansData.value ?? { error: trullemansData.reason?.message },
      wetterzentrale: wetterzentraleData.value ?? { error: wetterzentraleData.reason?.message }
    };

    const prompt = `
Prévisions météo locales pour lat=${lat}, lon=${lon}, pays=${country}.
Sources principales:
- GFS: ${JSON.stringify(sources.gfs)}
- ECMWF: ${JSON.stringify(sources.ecmwf)}
- ICON: ${JSON.stringify(sources.icon)}
- Meteomatics: ${JSON.stringify(sources.meteomatics)}
- NASA POWER / Satellites: ${JSON.stringify(sources.nasaSat)}
- Copernicus ERA5: ${JSON.stringify(sources.copernicus)}

Données comparatives (benchmark qualité, ne pas copier):
- Trullemans: ${JSON.stringify(sources.trullemans)}
- Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Consignes IA:
- Croiser et fusionner les données principales.
- Comparer avec Trullemans/Wetterzentrale uniquement pour ajuster la fiabilité.
- Fournir tendances aujourd'hui + 7 jours.
- Inclure températures, précipitations, vents, risques météo.
- Mentionner incertitudes et fiabilité.
- Style clair, bulletin météo professionnel en français.
`;

    const analysis = await askAI(prompt);
    return { lat, lon, country, covered: true, forecast: analysis, raw: sources };
  } else {
    // Zone non couverte → fallback OpenWeather
    const owData = await openweather(lat, lon);

    const prompt = `
Prévisions météo simplifiées (zone non couverte).
Coordonnées: lat=${lat}, lon=${lon}, pays=${country ?? "inconnu"}.

Données Open Data:
${JSON.stringify(owData)}

Consignes IA:
- Fournir tendances locales/nationales simplifiées.
- Horizon: aujourd'hui + 7 jours.
- Pas d'alertes locales (continentales seulement).
- Style concis en français.
`;

    const analysis = await askAI(prompt);
    return { lat, lon, country, covered: false, forecast: analysis, raw: owData };
  }
}

/**
 * Prévisions nationales (par pays)
 */
async function getForecast(country) {
  if (isCovered(country)) {
    const [
      gfsData, ecmwfData, iconData,
      meteomaticsData, nasaData, copernicusData,
      trullemansData, wetterzentraleData
    ] = await Promise.allSettled([
      gfs({ country }),
      ecmwf({ country }),
      icon({ country }),
      meteomatics({ country }),
      nasaSat({ country }),
      copernicus({ country }),
      trullemans({ country }),
      wetterzentrale({ country })
    ]);

    const sources = {
      gfs: gfsData.value ?? { error: gfsData.reason?.message },
      ecmwf: ecmwfData.value ?? { error: ecmwfData.reason?.message },
      icon: iconData.value ?? { error: iconData.reason?.message },
      meteomatics: meteomaticsData.value ?? { error: meteomaticsData.reason?.message },
      nasaSat: nasaData.value ?? { error: nasaData.reason?.message },
      copernicus: copernicusData.value ?? { error: copernicusData.reason?.message },
      trullemans: trullemansData.value ?? { error: trullemansData.reason?.message },
      wetterzentrale: wetterzentraleData.value ?? { error: wetterzentraleData.reason?.message }
    };

    const prompt = `
Prévisions météo nationales pour ${country}.
Sources principales:
- GFS: ${JSON.stringify(sources.gfs)}
- ECMWF: ${JSON.stringify(sources.ecmwf)}
- ICON: ${JSON.stringify(sources.icon)}
- Meteomatics: ${JSON.stringify(sources.meteomatics)}
- NASA POWER / Satellites: ${JSON.stringify(sources.nasaSat)}
- Copernicus ERA5: ${JSON.stringify(sources.copernicus)}

Données comparatives (benchmark qualité, ne pas copier):
- Trullemans: ${JSON.stringify(sources.trullemans)}
- Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Consignes IA:
- Croiser et fusionner les données principales.
- Comparer avec Trullemans/Wetterzentrale uniquement pour fiabilité.
- Fournir résumé national aujourd'hui + 7 jours.
- Inclure températures, précipitations, vents, risques météo.
- Mentionner incertitudes et fiabilité.
- Style clair, bulletin météo professionnel en français.
`;

    const analysis = await askAI(prompt);
    return { country, covered: true, forecast: analysis, raw: sources };
  } else {
    const prompt = `
Prévisions météo nationales simplifiées pour ${country} (zone non couverte).
Consignes IA:
- Fournir résumé global basé sur tendances continentales.
- Pas de détail local.
- Horizon: aujourd'hui + 7 jours.
- Style concis en français.
`;
    const analysis = await askAI(prompt);
    return { country, covered: false, forecast: analysis };
  }
}

export default { getLocalForecast, getForecast };
