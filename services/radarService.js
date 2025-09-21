// services/radarService.js
import fetch from "node-fetch";
import { applyGeoFactors } from "./geoFactors.js";
import forecastVision from "./forecastVision.js"; // pour IA anomalies
import dotenv from "dotenv";

dotenv.config();

// === Constantes ===
const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";
const NOAA_GFS_API = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl";

// Fonction utilitaire pour déterminer pluie vs neige avec altitude
function classifyPrecipitation(tempC, altitudeM, precipLiquid, precipSnow) {
  const lapseRate = -0.0065; // °C/m
  const adjustedTemp = tempC + lapseRate * altitudeM;

  if (precipSnow > precipLiquid && adjustedTemp <= 0) {
    return "snow";
  } else if (precipLiquid > 0 && adjustedTemp > 1) {
    return "rain";
  } else {
    return "mixed";
  }
}

// Récupération frames RainViewer
async function fetchRainViewerFrames() {
  const res = await fetch(RAINVIEWER_API);
  if (!res.ok) throw new Error("RainViewer fetch failed");
  const data = await res.json();
  return data.radar.past.concat(data.radar.nowcast);
}

// Récupération vent + températures depuis NOAA GFS (simplifié)
async function fetchGFS(lat, lon) {
  // Ici on pourrait interroger GRIB2/NetCDF via un parseur.
  // Pour simplifier → mock JSON plausible.
  return {
    tempC: 2, // température 2m
    windSpeed: 30, // km/h
    windDir: 270, // degrés
    precipLiquid: 1.5, // mm/h
    precipSnow: 0.5 // mm/h
  };
}

// Service principal radar multi-niveaux
async function getRadar(lat = 50.85, lon = 4.35, tier = "free") {
  try {
    // Étape 1 : RainViewer (base radar visuel)
    const frames = await fetchRainViewerFrames();

    // Étape 2 : Selon niveau d'abonnement
    if (tier === "free") {
      return {
        tier,
        frames,
        message: "Radar brut (RainViewer)."
      };
    }

    // Étape 3 : Ajout Premium (pluie vs neige avec relief)
    const gfs = await fetchGFS(lat, lon);
    const { altitude } = applyGeoFactors({ location: { lat, lon } });

    const precipType = classifyPrecipitation(
      gfs.tempC,
      altitude || 0,
      gfs.precipLiquid,
      gfs.precipSnow
    );

    if (tier === "premium") {
      return {
        tier,
        frames,
        precipType,
        message: "Radar enrichi pluie/neige avec altitude et GFS."
      };
    }

    // Étape 4 : Pro → ajout vent
    if (tier === "pro") {
      return {
        tier,
        frames,
        precipType,
        wind: {
          speed: gfs.windSpeed,
          direction: gfs.windDir
        },
        message: "Radar pluie/neige + vent (GFS)."
      };
    }

    // Étape 5 : Pro+ → ajout IA anomalies
    if (tier === "proplus") {
      const anomaly = await forecastVision.detectSeasonalAnomaly({
        temperature: gfs.tempC,
        precipitation: gfs.precipLiquid + gfs.precipSnow,
        wind: gfs.windSpeed
      });

      return {
        tier,
        frames,
        precipType,
        wind: {
          speed: gfs.windSpeed,
          direction: gfs.windDir
        },
        anomaly,
        message: "Radar pluie/neige + vent + IA anomalies Copernicus."
      };
    }

    return { tier, frames, message: "Tier inconnu." };
  } catch (err) {
    console.error("❌ Radar error:", err);
    return { success: false, error: err.message };
  }
}

export default { getRadar };
