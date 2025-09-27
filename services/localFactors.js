// services/localFactors.js
// Ajustements locaux pour le moteur TINSFLASH
// Inclut température, relief, saison, niveaux de retour (Poschlod et al.)

import axios from "axios";

// ==========================
// 📌 Tables de référence
// ==========================

// Facteurs saisonniers (coefficients multiplicateurs de seuils de pluie)
const SEASON_FACTORS = {
  winter: 0.9,  // hiver → seuil plus bas (pluie/neige dangereuse)
  spring: 1.0,
  summer: 1.1,  // été → convection forte
  autumn: 0.95 // automne → sols saturés
};

// Return levels (extrait simplifié de Poschlod et al. 2020)
// Valeurs mm/h pour événement "10 ans" → à affiner avec vrai dataset
const RETURN_LEVELS = {
  "Belgium": 35,
  "France": 40,
  "Germany": 42,
  "Spain": 45,
  "Italy": 50,
  "Alps": 60
};

// ==========================
// 📌 Fonctions auxiliaires
// ==========================

function getSeasonFactor(date = new Date()) {
  const m = date.getUTCMonth() + 1;
  if ([12,1,2].includes(m)) return SEASON_FACTORS.winter;
  if ([3,4,5].includes(m)) return SEASON_FACTORS.spring;
  if ([6,7,8].includes(m)) return SEASON_FACTORS.summer;
  return SEASON_FACTORS.autumn;
}

// Ajustement Clausius-Clapeyron / Drobinski
function tempScaling(tempC) {
  const base = 15;
  if (tempC == null) return 1;
  if (tempC < base) {
    return 1 + 0.07 * (tempC - base);  // ~7% par °C en dessous
  } else {
    return 1 + 0.03 * (tempC - base);  // hook effect → croissance plus lente
  }
}

// Relief : ajuste les seuils pluie selon altitude
function reliefScaling(altitude) {
  if (altitude == null) return 1;
  if (altitude > 1500) return 1.2;   // haute montagne
  if (altitude > 800) return 1.1;    // moyenne montagne
  return 1.0;                        // plaine
}

// Détermination des niveaux de retour extrêmes
function getReturnLevel(country) {
  return RETURN_LEVELS[country] || 40; // défaut 40 mm/h
}

// ==========================
// 📌 Fonction principale
// ==========================

async function adjustWithLocalFactors(forecast, country = "GENERIC", lat = null, lon = null) {
  if (!forecast) return forecast;

  try {
    // Obtenir altitude via API open-elevation si coordonnées disponibles
    let altitude = null;
    if (lat && lon) {
      try {
        const res = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        altitude = res.data.results[0].elevation;
      } catch {
        altitude = null;
      }
    }

    // Température de référence (si dispo dans forecast)
    const temp = forecast.temperature ?? forecast.temp ?? null;

    // Facteurs
    const coeffSeason = getSeasonFactor();
    const coeffTemp = tempScaling(temp);
    const coeffRelief = reliefScaling(altitude);
    const returnLevel = getReturnLevel(country);

    // Application aux précipitations si présentes
    let adjustedForecast = { ...forecast };
    if (adjustedForecast.precipitation || adjustedForecast.rain) {
      const raw = adjustedForecast.precipitation ?? adjustedForecast.rain;
      const adjusted =
        raw * coeffSeason * coeffTemp * coeffRelief;

      adjustedForecast.precipitation_adjusted = adjusted;
      adjustedForecast.returnLevel = returnLevel;
      adjustedForecast.alertTrigger =
        adjusted > returnLevel ? "ALERTE" : "RAS";
    }

    adjustedForecast._adjustments = {
      season: coeffSeason,
      temperature: coeffTemp,
      relief: coeffRelief,
      returnLevel
    };

    return adjustedForecast;
  } catch (err) {
    console.error("❌ adjustWithLocalFactors error:", err.message);
    return forecast;
  }
}

export default adjustWithLocalFactors;
