// ==========================================================
// 🌍 Everest Protocol v3.8 – compatibilité Phase 5 IA J.E.A.N.
// 🔹 Version augmentée avec VisionIA (anomalies saisonnières)
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import Alert from "../models/Alert.js";
import mongoose from "mongoose";
import forecastVision from "./forecastVision.js"; // 🧠 VisionIA intégrée

// ==========================================================
// 🧱 Modèle PublicForecast – sauvegarde Mongo Phase 5
// ==========================================================
const PublicForecast =
  mongoose.models.PublicForecast ||
  mongoose.model(
    "PublicForecast",
    new mongoose.Schema({
      lat: Number,
      lon: Number,
      country: String,
      region: String,
      temperature: Number,
      temperature_min: Number,
      temperature_max: Number,
      precipitation: Number,
      wind: Number,
      humidity: Number,
      reliability: Number,
      icon: String,
      updatedAt: Date,
      anomaly: Object, // ⚡ ajouté pour VisionIA
    })
  );

// ==========================================================
// 🔧 Fonctions utilitaires
// ==========================================================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (Math.PI / 180) * (lat2 - lat1);
  const dLon = (Math.PI / 180) * (lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((Math.PI / 180) * lat1) *
      Math.cos((Math.PI / 180) * lat2) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function normalizeReliability(r) {
  if (r == null) return 0.75;
  return r > 1 ? clamp(r / 100, 0, 1) : clamp(r, 0, 1);
}
function pickIcon(d) {
  const p = d.precipitation ?? 0;
  const t = d.temperature ?? 0;
  const w = d.wind ?? 0;
  if (p > 5) return "🌧️";
  if (w > 50) return "💨";
  if (t < 0) return "❄️";
  return "⛅";
}

// ==========================================================
// 🔮 generateForecast – Fusion Phases 1 + 5 (+ VisionIA)
// ==========================================================
export async function generateForecast(
  lat,
  lon,
  country = "Unknown",
  region = "GENERIC"
) {
  try {
    // 🧩 Étape 1 : on tente d’abord de lire les prévisions publiques générées par la Phase 5
    const existing = await PublicForecast.findOne({
      lat: { $gte: lat - 0.25, $lte: lat + 0.25 },
      lon: { $gte: lon - 0.25, $lte: lon + 0.25 },
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (existing) {
      await addEngineLog(
        `♻️ Lecture prévisions Phase 5 pour ${country} (${lat.toFixed(
          2
        )}, ${lon.toFixed(2)})`,
        "info",
        "forecast"
      );
      return {
        forecast: existing,
        localDaily: [],
        nationalDaily: [],
        alerts: await Alert.find().limit(10).lean(),
      };
    }

    // 🧮 Étape 2 : sinon on relance une prévision brute via superForecast (Phase 1)
    const sf = await superForecast({
      lat,
      lon,
      country,
      region,
      horizonDays: 7,
    });
    const nowLocal = sf?.forecast ?? sf?.now ?? {};

    let forecast = {
      lat,
      lon,
      country,
      region,
      temperature: nowLocal.temperature ?? nowLocal.temp ?? null,
      temperature_min: nowLocal.tmin ?? null,
      temperature_max: nowLocal.tmax ?? null,
      precipitation: nowLocal.precipitation ?? nowLocal.rain ?? 0,
      wind: nowLocal.wind ?? nowLocal.windSpeed ?? 0,
      humidity: nowLocal.humidity ?? null,
      reliability: normalizeReliability(nowLocal.reliability ?? 0.7),
      icon: pickIcon(nowLocal),
      updatedAt: new Date(),
    };

    // 🗺️ Étape 3 : fallback pour 7 jours si dispo
    const mapDays = (arr) =>
      (Array.isArray(arr) ? arr : [])
        .slice(0, 7)
        .map((d) => ({
          date: d.date ?? d.time ?? new Date().toISOString().slice(0, 10),
          tmin: d.tmin ?? d.min ?? null,
          tmax: d.tmax ?? d.max ?? null,
          precipitation: d.precipitation ?? d.rain ?? 0,
          wind: d.wind ?? d.windSpeed ?? 0,
          reliability: normalizeReliability(d.reliability ?? 0.7),
          icon: pickIcon(d),
        }));

    const localDaily7 = mapDays(sf.dailyLocal ?? []);
    const nationalDaily7 = mapDays(sf.dailyNational ?? []);

    // 🧠 Étape 4 : alertes proches
    let alertsNearby = [];
    try {
      const all = await Alert.find().lean();
      alertsNearby = all
        .map((a) => ({
          ...a,
          distanceKm: haversineKm(lat, lon, a.lat, a.lon),
        }))
        .filter((a) => a.distanceKm <= 250);
    } catch {
      await addEngineLog(
        "⚠️ Lecture alertes proches échouée (fallback vide)",
        "warn",
        "forecast"
      );
    }

    // 💾 Étape 5 : sauvegarde dans l’état moteur
    const state = await getEngineState();
    if (!state.forecasts) state.forecasts = [];
    state.forecasts.push({ ...forecast, savedAt: new Date() });
    if (state.forecasts.length > 100)
      state.forecasts = state.forecasts.slice(-100);
    await saveEngineState(state);

    await addEngineLog(
      `✅ Prévision brute générée (Phase 1 fallback) pour ${country} @ ${lat.toFixed(
        2
      )},${lon.toFixed(2)}`,
      "info",
      "forecast"
    );

    // 🧠 Étape 6 : Analyse VisionIA (anomalies saisonnières)
    try {
      const anomaly = forecastVision.detectSeasonalAnomaly({
        temperature: [
          forecast.temperature_min ?? forecast.temperature ?? 0,
          forecast.temperature_max ?? forecast.temperature ?? 0,
        ],
      });
      if (anomaly) {
        forecast.anomaly = anomaly;
        await addEngineLog(
          `🔎 VisionIA : anomalie ${anomaly.type} (${anomaly.value}°C) détectée`,
          "info",
          "forecast"
        );
      }
    } catch (e) {
      await addEngineError("Erreur VisionIA : " + e.message, "forecast");
    }

    // 💽 Étape 7 : sauvegarde Mongo Phase 5 (avec anomalie si présente)
    try {
      await PublicForecast.updateOne(
        { lat, lon },
        { $set: { ...forecast, anomaly: forecast.anomaly } },
        { upsert: true }
      );
    } catch (e) {
      await addEngineError(
        "Erreur Mongo PublicForecast : " + e.message,
        "forecast"
      );
    }

    return {
      forecast,
      localDaily: localDaily7,
      nationalDaily: nationalDaily7,
      alerts: alertsNearby,
    };
  } catch (err) {
    await addEngineError(
      "Erreur forecastService (fusion Phases 1+5): " + err.message,
      "forecast"
    );
    return {
      error: err.message,
      forecast: null,
      localDaily: [],
      nationalDaily: [],
      alerts: [],
    };
  }
}
