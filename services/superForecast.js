// PATH: services/superForecast.js
// SuperForecast — prévisions enrichies multi-sources par point unique
// ⚡ Centrale nucléaire météo – Moteur atomique orchestral

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import hrrr from "./hrrr.js";          // 🇺🇸 HRRR (NOAA, USA only)
import arome from "./arome.js";        // 🇫🇷🇧🇪 AROME (France/Belgique via Meteomatics)
import { askOpenAI } from "./openaiService.js";
import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

// Facteurs d’ajustement
import { applyGeoFactors } from "./geoFactors.js";     // ✅ export nommé
import adjustWithLocalFactors from "./localFactors.js"; // saison, spatial, return levels
import forecastVision from "./forecastVision.js";       // anomalies saisonnières

// ✅ Export NOMMÉ uniquement
export async function runSuperForecast({ lat, lon, country, region }) {
  const state = await getEngineState();
  try {
    addEngineLog(
      `⚡ Lancement du SuperForecast pour ${country}${
        region ? " - " + region : ""
      } (${lat},${lon})`
    );

    // === Étape 1 : préparer Copernicus ERA5
    const copernicusRequest = {
      variable: ["2m_temperature", "total_precipitation"],
      product_type: "reanalysis",
      year: new Date().getUTCFullYear(),
      month: String(new Date().getUTCMonth() + 1).padStart(2, "0"),
      day: String(new Date().getUTCDate()).padStart(2, "0"),
      time: ["00:00", "06:00", "12:00", "18:00"],
      area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25],
      format: "json",
    };

    // === Étape 2 : récupérer toutes les sources météo
    addEngineLog("📡 Récupération multi-sources météo…");
    const [
      gfsData,
      ecmwfData,
      iconData,
      meteomaticsData,
      nasaData,
      copernicusData,
      trullemansData,
      wetterzentraleData,
      hrrrData,
      aromeData,
    ] = await Promise.allSettled([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
      meteomatics({ lat, lon, country }),
      nasaSat({ lat, lon, country }),
      copernicus("reanalysis-era5-land", copernicusRequest),
      trullemans({ lat, lon, country }),
      wetterzentrale({ lat, lon, country }),
      hrrr(lat, lon),   // ✅ HRRR pour USA
      arome(lat, lon),  // ✅ AROME pour FR/BE
    ]);

    const sources = {
      gfs: gfsData.value ?? { error: gfsData.reason?.message },
      ecmwf: ecmwfData.value ?? { error: ecmwfData.reason?.message },
      icon: iconData.value ?? { error: iconData.reason?.message },
      meteomatics: meteomaticsData.value ?? { error: meteomaticsData.reason?.message },
      nasaSat: nasaData.value ?? { error: nasaData.reason?.message },
      copernicus: copernicusData.value ?? { error: copernicusData.reason?.message },
      trullemans: trullemansData.value ?? { error: trullemansData.reason?.message },
      wetterzentrale: wetterzentraleData.value ?? { error: wetterzentraleData.reason?.message },
      hrrr: hrrrData.value ?? { error: hrrrData.reason?.message },
      arome: aromeData.value ?? { error: aromeData.reason?.message },
    };
    addEngineLog("✅ Sources météo collectées");

    // === Étape 3 : ajustements globaux (relief/climat/altitude)
    let enriched = await applyGeoFactors(sources, lat, lon, country);

    // === Étape 3bis : ajustements locaux (saison, spatial, return levels)
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    // === Étape 3ter : anomalies saisonnières
    const anomaly = forecastVision.detectSeasonalAnomaly(
      sources.gfs || sources.ecmwf || null
    );
    if (anomaly) {
      enriched.anomaly = anomaly;
    }

    // === Étape 4 : analyse IA
    addEngineLog("🤖 Analyse IA des données multi-sources…");
    const prompt = `
Prévisions météo enrichies pour un point précis.
Coordonnées: lat=${lat}, lon=${lon}, pays=${country}${
      region ? ", région=" + region : ""
    }

Sources principales:
- GFS: ${JSON.stringify(sources.gfs)}
- ECMWF: ${JSON.stringify(sources.ecmwf)}
- ICON: ${JSON.stringify(sources.icon)}
- Meteomatics: ${JSON.stringify(sources.meteomatics)}
- NASA POWER / Satellites: ${JSON.stringify(sources.nasaSat)}
- Copernicus ERA5: ${JSON.stringify(sources.copernicus)}

Données complémentaires (selon zone):
- HRRR (USA): ${JSON.stringify(sources.hrrr)}
- AROME (FR/BE): ${JSON.stringify(sources.arome)}

Benchmarks (comparatif fiabilité uniquement):
- Trullemans: ${JSON.stringify(sources.trullemans)}
- Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Ajustements appliqués:
- Facteurs globaux: relief, climat, altitude
- Facteurs locaux: saison, cohérence spatiale, return levels
- Anomalies saisonnières: ${JSON.stringify(anomaly)}

Consignes IA:
- Croiser et fusionner uniquement les données principales (GFS, ECMWF, ICON, Meteomatics, NASA, Copernicus, HRRR, AROME).
- Comparer avec Trullemans/Wetterzentrale uniquement pour calibrer la fiabilité.
- Fournir un bulletin détaillé: températures, précipitations, vent, risques météo.
- Horizon: aujourd'hui + 7 jours.
- Mentionner incertitudes et fiabilité globale.
- Style clair, professionnel, bulletin météo en français.
`;

    const analysis = await askOpenAI(
      "Tu es un moteur météo avancé qui rédige un bulletin météo fiable.",
      prompt
    );

    addEngineLog("✅ Analyse IA terminée");

    // === Étape 5 : sauvegarde
    state.superForecasts = state.superForecasts || [];
    state.superForecasts.push({
      lat,
      lon,
      country,
      region,
      forecast: analysis,
      sources,
      enriched,
    });
    await saveEngineState(state);

    addEngineLog("🏁 SuperForecast terminé avec succès");
    return { lat, lon, country, region, forecast: analysis, sources, enriched };
  } catch (err) {
    await addEngineError(err.message || "Erreur inconnue SuperForecast");
    addEngineLog("❌ Erreur dans SuperForecast");
    return { error: err.message };
  }
}
