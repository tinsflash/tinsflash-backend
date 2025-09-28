// PATH: services/superForecast.js
// SuperForecast — prévisions enrichies multi-sources par point unique
// ⚡ Centrale nucléaire météo – Moteur atomique

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import { askOpenAI } from "./openaiService.js"; // ✅ IA centrale
import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

// ✅ Export NOMMÉ uniquement
export async function runSuperForecast({ lat, lon, country, region }) {
  const state = getEngineState();
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
    ] = await Promise.allSettled([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
      meteomatics({ lat, lon, country }),
      nasaSat({ lat, lon, country }),
      copernicus("reanalysis-era5-land", copernicusRequest),
      trullemans({ lat, lon, country }),
      wetterzentrale({ lat, lon, country }),
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
    };
    addEngineLog("✅ Sources météo collectées");

    // === Étape 3 : analyse IA
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

Données comparatives (benchmarks qualité, ne pas copier):
- Trullemans: ${JSON.stringify(sources.trullemans)}
- Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Consignes IA:
- Croiser et fusionner uniquement les données principales.
- Comparer avec Trullemans/Wetterzentrale uniquement pour ajuster la fiabilité.
- Fournir un bulletin détaillé: températures, précipitations, vent, risques météo.
- Horizon: aujourd'hui + 7 jours.
- Mentionner incertitudes et fiabilité globale.
- Style clair, professionnel, bulletin météo en français.
`;

    // ✅ Appel IA corrigé : plus de max_tokens/temperature → openaiService gère
    const analysis = await askOpenAI(
      "Tu es un moteur météo avancé qui rédige un bulletin météo fiable.",
      prompt
    );

    addEngineLog("✅ Analyse IA terminée");

    // === Étape 4 : sauvegarde
    if (!state.superForecasts) state.superForecasts = [];
    state.superForecasts.push({
      lat,
      lon,
      country,
      region,
      forecast: analysis,
      sources,
    });
    saveEngineState(state);
    addEngineLog("💾 SuperForecast sauvegardé");

    addEngineLog("🏁 SuperForecast terminé avec succès");
    return { lat, lon, country, region, forecast: analysis, sources };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue SuperForecast");
    addEngineLog("❌ Erreur dans SuperForecast");
    return { error: err.message };
  }
}
