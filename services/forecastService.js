// PATH: services/forecastService.js
// 🎯 Service de prévision publique pour index.html
// Retourne: forecast (local “now”) + localDaily[7j] + nationalDaily[7j] + alerts[]
// Everest Protocol v3.6 — 100% réel

// ✅ Import corrigé : superForecast() (non runSuperForecast)
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import Alert from "../models/Alert.js";

/** Petite aide: borne une valeur dans [min,max] */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Haversine (km) pour filtrer les alertes à proximité */
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

/** Normalise la fiabilité en [0..1] si fournie en % */
function normalizeReliability(r) {
  if (r == null) return 0.7;
  return r > 1 ? clamp(r / 100, 0, 1) : clamp(r, 0, 1);
}

/** Détermine une icône simple (texte) selon l’état (à mapper côté UI si besoin) */
function pickIcon(d) {
  const p = d?.precipitation ?? 0;
  const t = d?.temperature ?? 0;
  const w = d?.wind ?? 0;
  if (p > 10) return "🌧️";
  if (w > 70) return "💨";
  if (t <= 0 && p > 0) return "❄️";
  if (t >= 30) return "🔥";
  return "⛅";
}

/**
 * Génère un paquet complet attendu par index.html
 * @param {number} lat
 * @param {number} lon
 * @param {string} country
 * @param {string} region
 */
export async function generateForecast(lat, lon, country = "Unknown", region = "GENERIC") {
  try {
    // 1️⃣ Appel du moteur SuperForecast (corrigé)
    const sf = await superForecast({
      lat,
      lon,
      country,
      region,
      horizonDays: 7,
      includeNational: true
    });

    // Tolérance format
    const nowLocal = sf?.forecast ?? sf?.now ?? {};
    const localDaily = sf?.dailyLocal ?? sf?.daily?.local ?? [];
    const nationalDaily = sf?.dailyNational ?? sf?.daily?.national ?? [];

    // 2️⃣ Normalisations
    const forecast = {
      lat, lon, country, region,
      temperature: nowLocal.temperature ?? nowLocal.temp ?? null,
      precipitation: nowLocal.precipitation ?? nowLocal.rain ?? 0,
      wind: nowLocal.wind ?? nowLocal.windSpeed ?? 0,
      humidity: nowLocal.humidity ?? null,
      reliability: normalizeReliability(nowLocal.reliability ?? nowLocal.confidence ?? 0.75),
      icon: pickIcon(nowLocal),
      generatedAt: new Date()
    };

    const mapDays = (arr) =>
      (Array.isArray(arr) ? arr : []).slice(0, 7).map(d => ({
        date: d.date ?? d.time ?? new Date().toISOString().slice(0, 10),
        tmin: d.tmin ?? d.min ?? null,
        tmax: d.tmax ?? d.max ?? null,
        precipitation: d.precipitation ?? d.rain ?? 0,
        wind: d.wind ?? d.windSpeed ?? 0,
        reliability: normalizeReliability(d.reliability ?? d.confidence ?? forecast.reliability),
        icon: pickIcon(d)
      }));

    const localDaily7 = mapDays(localDaily);
    const nationalDaily7 = mapDays(nationalDaily);

    // 3️⃣ Alertes proches
    let alertsNearby = [];
    try {
      const all = await Alert.find().lean();
      alertsNearby = (all || [])
        .map(a => ({
          ...a,
          distanceKm: (a.lat != null && a.lon != null) ? haversineKm(lat, lon, a.lat, a.lon) : 999999
        }))
        .filter(a => a.distanceKm <= 250)
        .sort((a, b) => (b.reliability ?? 0) - (a.reliability ?? 0))
        .slice(0, 15);
    } catch (e) {
      await addEngineLog("⚠️ Lecture alertes proches échouée (fallback vide)", "warn", "forecast");
    }

    // 4️⃣ Persistance légère
    const state = await getEngineState();
    if (!state.forecasts) state.forecasts = [];
    state.forecasts.push({ ...forecast, savedAt: new Date() });
    if (state.forecasts.length > 100) state.forecasts = state.forecasts.slice(-100);
    await saveEngineState(state);

    await addEngineLog(
      `✅ Prévision packagée pour ${country} ${region || ""} @ ${lat.toFixed(2)},${lon.toFixed(2)}`,
      "info",
      "forecast"
    );

    // 5️⃣ Retour final
    return {
      forecast,
      localDaily: localDaily7,
      nationalDaily: nationalDaily7,
      alerts: alertsNearby
    };
  } catch (err) {
    await addEngineError("Erreur forecastService: " + err.message, "forecast");
    return { error: err.message, forecast: null, localDaily: [], nationalDaily: [], alerts: [] };
  }
}
