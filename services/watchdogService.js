// ==========================================================
// 🛰️  TINSFLASH – watchdogService.js
// v1.0 REAL CONNECT – Surveillance continue mondiale
// ==========================================================
// Mission : observer en temps réel les phénomènes météo
// via radars, satellites, stations, et seuils dynamiques,
// pour générer des pré-alertes automatiques (mode TOCSIN).
// ==========================================================

import axios from "axios";
import mongoose from "mongoose";
import { addEngineLog, addEngineError } from "./engineState.js";
import { getThresholds } from "../config/alertThresholds.js";

const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));

// ----------------------------------------------------------
// 🔧 Modèle Mongo pour les pré-alertes
// ----------------------------------------------------------
const schema = new mongoose.Schema({}, { strict: false });
const Prealert =
  mongoose.models.watchdog_prealerts ||
  mongoose.model("watchdog_prealerts", schema, "watchdog_prealerts");

// ----------------------------------------------------------
// 📡 Sources open-data légères
// ----------------------------------------------------------
const SOURCES = {
  // Sat24 : images radar pluie/neige Europe/US
  radar_eu: "https://api.sat24.com/region/eu/rain",
  radar_us: "https://api.sat24.com/region/us/rain",
  // Open-Meteo (vent/température extraits)
  openmeteo: "https://api.open-meteo.com/v1/forecast",
};

// ----------------------------------------------------------
// 🧠  Fonction principale
// ----------------------------------------------------------
export async function runWatchdog() {
  try {
    await addEngineLog("🔎 Watchdog – Surveillance continue engagée", "info", "TOCSIN");
    const thresholds = getThresholds();
    const now = new Date();

    const zones = [
      { name: "Belgique", lat: 50.5, lon: 4.7 },
      { name: "France", lat: 48.8, lon: 2.3 },
      { name: "Suisse", lat: 46.8, lon: 8.3 },
      { name: "Italie", lat: 45.4, lon: 9.2 },
      { name: "Espagne", lat: 40.4, lon: -3.7 },
      { name: "États-Unis", lat: 39.0, lon: -98.0 },
    ];

    const detected = [];

    for (const z of zones) {
      try {
        // ----------------------------
        // 🌦️ Données météo rapides
        // ----------------------------
        const meteo = await axios.get(SOURCES.openmeteo, {
          params: {
            latitude: z.lat,
            longitude: z.lon,
            current_weather: true,
            hourly: ["precipitation", "windspeed_10m", "temperature_2m"],
          },
          timeout: 8000,
        });

        const cur = meteo.data?.current_weather || {};
        const precip = Number(cur.precipitation ?? 0);
        const wind = Number(cur.windspeed ?? 0);
        const temp = Number(cur.temperature ?? 0);

        // ----------------------------
        // ⚠️  Seuils d’alerte
        // ----------------------------
        const rainHeavy = precip >= thresholds.rain.heavy;
        const windStrong = wind >= thresholds.wind.strong;
        const cold = temp <= thresholds.temperature.freeze;
        const heat = temp >= thresholds.temperature.heat;

        const found = [];
        if (rainHeavy) found.push("Pluie intense");
        if (windStrong) found.push("Vent violent");
        if (cold) found.push("Gel probable");
        if (heat) found.push("Chaleur extrême");

        if (found.length) {
          for (const f of found) {
            const confidence =
              f.includes("Pluie") ? clamp01(precip / thresholds.rain.extreme) :
              f.includes("Vent") ? clamp01(wind / thresholds.wind.extreme) :
              0.8;

            const doc = {
              phenomenon: f,
              zone: z.name,
              lat: z.lat,
              lon: z.lon,
              level:
                confidence >= 0.9
                  ? "extrême"
                  : confidence >= 0.75
                  ? "forte"
                  : "pré-alerte",
              confidence,
              confidence_pct: Math.round(confidence * 100),
              createdAt: now,
              visualEvidence: false,
              source: "Watchdog v1.0 REAL",
            };

            detected.push(doc);
            await Prealert.create(doc);

            await addEngineLog(
              `🕵️ Pré-alerte ${f} (${z.name}) – confiance ${Math.round(confidence * 100)}%`,
              "info",
              "TOCSIN"
            );
          }
        }
      } catch (err) {
        await addEngineError(`Erreur zone ${z.name}: ${err.message}`, "TOCSIN");
      }
    }

    await addEngineLog(
      `✅ Surveillance terminée – ${detected.length} pré-alerte(s) générée(s)`,
      "success",
      "TOCSIN"
    );
    return { count: detected.length };
  } catch (e) {
    await addEngineError("Erreur globale Watchdog : " + e.message, "TOCSIN");
    return { error: e.message };
  }
}

export default { runWatchdog };
