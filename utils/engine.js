// utils/engine.js
// Cœur météo TINSFLASH 🚀
// Génère prévisions & alertes basées sur nos calculs internes
// Ne copie PAS les autres sources → seulement comparaison/ajustement

import fetch from "node-fetch";

// --- Seuils TINSFLASH pour déclenchement d'alertes ---
const ALERT_THRESHOLDS = {
  wind: 90,        // km/h
  rain: 50,        // mm/h
  snow: 20,        // cm/24h
  tempHeat: 40,    // °C
  tempCold: -15,   // °C
  storm: true      // si CAPE + shear élevés → orage
};

// --- Fonction principale : prévisions locales ---
export async function generateForecast(lat, lon) {
  try {
    // Récupère données OpenWeather (exemple simple)
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.SATELLITE_API}`
    );
    const data = await res.json();

    if (!data.list) {
      throw new Error("Pas de données météo disponibles");
    }

    // Exemple : prend le prochain créneau (3h)
    const point = data.list[0];
    const forecast = {
      ts: point.dt_txt,
      temp: point.main.temp,
      wind: point.wind.speed * 3.6, // m/s → km/h
      rain: point.rain ? point.rain["3h"] || 0 : 0,
      desc: point.weather[0].description,
    };

    // Vérifie alertes
    const alerts = checkAlerts(forecast);

    return {
      place: data.city.name,
      forecast,
      alerts,
      reliability: computeReliability(forecast, alerts)
    };

  } catch (err) {
    console.error("Erreur prévision:", err);
    return null;
  }
}

// --- Vérification des seuils ---
function checkAlerts(forecast) {
  const alerts = [];

  if (forecast.wind >= ALERT_THRESHOLDS.wind) {
    alerts.push({
      type: "Vent violent",
      level: forecast.wind >= 120 ? "🔴 Rouge" : "🟠 Orange",
      message: `Rafales prévues à ${forecast.wind.toFixed(0)} km/h`
    });
  }

  if (forecast.rain >= ALERT_THRESHOLDS.rain) {
    alerts.push({
      type: "Pluie intense",
      level: "🔴 Rouge",
      message: `${forecast.rain.toFixed(1)} mm/h attendus`
    });
  }

  if (forecast.temp >= ALERT_THRESHOLDS.tempHeat) {
    alerts.push({
      type: "Canicule",
      level: "🟠 Orange",
      message: `${forecast.temp.toFixed(1)} °C prévus`
    });
  }

  if (forecast.temp <= ALERT_THRESHOLDS.tempCold) {
    alerts.push({
      type: "Grand froid",
      level: "🟠 Orange",
      message: `${forecast.temp.toFixed(1)} °C prévus`
    });
  }

  return alerts;
}

// --- Calcul fiabilité ---
function computeReliability(forecast, alerts) {
  let base = 70; // par défaut
  if (alerts.length > 0) base += 10;
  if (forecast.rain === 0 && forecast.wind < 30) base += 10;
  if (forecast.desc.includes("clear")) base += 5;
  return Math.min(100, base);
}


---

🔗 Exemple d’utilisation

Dans ton fichier routes/forecast.js :

import express from "express";
import { generateForecast } from "../utils/engine.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude et longitude requises" });
  }

  const forecast = await generateForecast(lat, lon);
  if (!forecast) {
    return res.status(500).json({ error: "Erreur génération prévision" });
  }

  res.json(forecast);
});

export default router;
