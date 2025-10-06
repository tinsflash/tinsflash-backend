// PATH: services/localFactors.js
// ⚙️ Ajustements locaux – moteur TINSFLASH
// Inclut : température, relief, saison, return levels, cohérence spatiale

import axios from "axios";

// ==========================
// 📌 Tables de référence
// ==========================
const SEASON_FACTORS = { winter: 0.9, spring: 1.0, summer: 1.1, autumn: 0.95 };
const RETURN_LEVELS = {
  Belgium: 35, France: 40, Germany: 42, Spain: 45, Italy: 50, Alps: 60
};

// Mémoire circulaire pour cohérence spatiale
let lastPoints = [];

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

function tempScaling(tempC) {
  const base = 15;
  if (tempC == null) return 1;
  return tempC < base ? 1 + 0.07 * (tempC - base) : 1 + 0.03 * (tempC - base);
}

function reliefScaling(altitude) {
  if (!altitude) return 1;
  if (altitude > 1500) return 1.2;
  if (altitude > 800) return 1.1;
  return 1.0;
}

function getReturnLevel(country) {
  return RETURN_LEVELS[country] || 40;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function spatialSmoothing(lat, lon, currentValue) {
  if (!lastPoints.length) return currentValue;
  let weightedSum = 0, totalWeight = 0;

  for (const p of lastPoints) {
    const d = haversine(lat, lon, p.lat, p.lon);
    if (d < 30) {
      const w = 1 / (1 + d);
      weightedSum += p.adjustedPrecip * w;
      totalWeight += w;
    }
  }

  if (totalWeight > 0) {
    const neighborAvg = weightedSum / totalWeight;
    return (currentValue * 0.5) + (neighborAvg * 0.5);
  }
  return currentValue;
}

// ==========================
// 📌 Fonction principale
// ==========================
export async function adjustWithLocalFactors(forecast, country = "GENERIC", lat = null, lon = null) {
  if (!forecast) return forecast;

  try {
    let altitude = null;
    if (lat && lon) {
      try {
        const res = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        altitude = res.data.results[0].elevation;
      } catch {
        altitude = null;
      }
    }

    const temp = forecast.temperature ?? forecast.temp ?? null;
    const coeffSeason = getSeasonFactor();
    const coeffTemp = tempScaling(temp);
    const coeffRelief = reliefScaling(altitude);
    const returnLevel = getReturnLevel(country);

    let adjustedForecast = { ...forecast };

    if (adjustedForecast.precipitation || adjustedForecast.rain) {
      const raw = adjustedForecast.precipitation ?? adjustedForecast.rain;
      let adjusted = raw * coeffSeason * coeffTemp * coeffRelief;

      // ✅ Lissage spatial
      if (lat && lon) {
        adjusted = spatialSmoothing(lat, lon, adjusted);
        lastPoints.unshift({ lat, lon, adjustedPrecip: adjusted });
        if (lastPoints.length > 100) lastPoints.pop();
      }

      adjustedForecast.precipitation_adjusted = adjusted;
      adjustedForecast.returnLevel = returnLevel;
      adjustedForecast.alertTrigger = adjusted > returnLevel ? "ALERTE" : "RAS";
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

// ✅ Export objet (rétro-compatibilité)
export default { adjustWithLocalFactors };
