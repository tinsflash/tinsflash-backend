// ==========================================================
// 🌍 TINSFLASH – /services/phenomena/evaluate.js
// v5.15 PRO+++ REAL ENGINE – Assurance/Relief/Climat/Impact
// ==========================================================
// Mission : Analyser les phénomènes détectés par Phase 1
//           et générer des alertes basées sur les seuils
//           assurantiels et les risques réels.
// ==========================================================

import { getThresholds } from "../../config/alertThresholds.js";

// ==========================================================
// 🔧 Utilitaires
// ==========================================================
const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));
const round1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

// Pondération selon contexte local
function modulate(thresholds, { relief = 1, altitude = 150, temp = 10, climate = 1, visionIndex = 0 }) {
  const t = JSON.parse(JSON.stringify(thresholds));

  // Relief : forte pente -> plus sensible à la pluie et vent
  const reliefFactor = relief > 1.1 ? 0.9 : 1.0;
  // Altitude : >500 m = +neige, +vent, -pluie
  const altFactor = altitude > 500 ? 0.9 : 1.0;
  // Climat : zones chaudes -> seuil pluie augmenté, froid -> abaissé
  const climFactor = climate > 1.05 ? 1.1 : climate < 0.95 ? 0.9 : 1.0;
  // Vision : convection visible -> seuils -10 %
  const visionFactor = visionIndex > 0.6 ? 0.9 : 1.0;

  const f = reliefFactor * altFactor * climFactor * visionFactor;

  for (const key of ["rain", "wind", "snow"]) {
    for (const lvl of ["prealert", "alert", "extreme"]) {
      t[key][lvl] = Math.round(t[key][lvl] * f);
    }
  }
  return t;
}

// ==========================================================
// 🚨 Analyse principale (exportée)
// ==========================================================
export function evaluatePhenomena({
  lat,
  lon,
  altitude = 150,
  base = {},
  rain = null,
  snow = null,
  wind = null,
  stations = null,
  factors = {},
  thresholds = null,
  visionIndex = 0
}) {
  try {
    const T = thresholds || getThresholds();
    const th = modulate(T, { ...factors, altitude, visionIndex });
    const alerts = [];
    const results = {};

    // ======================================================
    // 🌧 PLUIE
    // ======================================================
    if (rain?.mm_h != null) {
      const v = rain.mm_h;
      results.rain = v;
      if (v >= th.rain.extreme)
        alerts.push({ type: "pluie", level: "extrême", confidence: 0.95, value: v });
      else if (v >= th.rain.alert)
        alerts.push({ type: "pluie", level: "alerte", confidence: 0.85, value: v });
      else if (v >= th.rain.prealert)
        alerts.push({ type: "pluie", level: "pré-alerte", confidence: 0.7, value: v });
    }

    // ======================================================
    // ❄️ NEIGE
    // ======================================================
    if (snow?.cm_h != null) {
      const v = snow.cm_h;
      results.snow = v;
      if (v >= th.snow.extreme)
        alerts.push({ type: "neige", level: "extrême", confidence: 0.95, value: v });
      else if (v >= th.snow.alert)
        alerts.push({ type: "neige", level: "alerte", confidence: 0.85, value: v });
      else if (v >= th.snow.prealert)
        alerts.push({ type: "neige", level: "pré-alerte", confidence: 0.7, value: v });
    }

    // ======================================================
    // 🌬 VENT
    // ======================================================
    if (wind?.gust_kmh != null) {
      const v = wind.gust_kmh;
      results.wind = v;
      if (v >= th.wind.extreme)
        alerts.push({ type: "vent", level: "extrême", confidence: 0.97, value: v, note: "🌪 Risque structurel" });
      else if (v >= th.wind.alert)
        alerts.push({
          type: "vent",
          level: "alerte",
          confidence: 0.9,
          value: v,
          note: "⚠️ Seuil 'tempête' assurance habitation (≥80 km/h)"
        });
      else if (v >= th.wind.prealert)
        alerts.push({ type: "vent", level: "pré-alerte", confidence: 0.75, value: v });
    }

    // ======================================================
    // 🌡️ TEMPÉRATURE / FROID / CHALEUR
    // ======================================================
    const temp = stations?.tempStation ?? base.temp ?? null;
    if (temp != null) {
      results.temperature = temp;
      if (temp >= th.heat.extreme)
        alerts.push({ type: "chaleur", level: "extrême", confidence: 0.95, value: temp });
      else if (temp >= th.heat.alert)
        alerts.push({ type: "chaleur", level: "alerte", confidence: 0.85, value: temp });
      else if (temp >= th.heat.prealert)
        alerts.push({ type: "chaleur", level: "pré-alerte", confidence: 0.7, value: temp });

      if (temp <= th.cold.extreme)
        alerts.push({ type: "froid", level: "extrême", confidence: 0.95, value: temp });
      else if (temp <= th.cold.alert)
        alerts.push({ type: "froid", level: "alerte", confidence: 0.85, value: temp });
      else if (temp <= th.cold.prealert)
        alerts.push({ type: "froid", level: "pré-alerte", confidence: 0.7, value: temp });
    }

    // ======================================================
    // 🌫 HUMIDITÉ / VERGLAS POTENTIEL
    // ======================================================
    const hum = stations?.humidityStation ?? base.humidity ?? null;
    if (hum != null && temp != null && temp < 0 && hum > 80) {
      alerts.push({
        type: "verglas",
        level: "alerte",
        confidence: 0.8,
        value: `${hum}% / ${temp}°C`,
        note: "Risque verglas (T<0°C et humidité>80%)"
      });
    }

    // ======================================================
    // 🛰 VisionIA – Instabilité visuelle directe
    // ======================================================
    if (visionIndex >= th.visionia.prealert / 100) {
      const lvl = visionIndex >= th.visionia.extreme / 100
        ? "extrême"
        : visionIndex >= th.visionia.alert / 100
        ? "alerte"
        : "pré-alerte";
      alerts.push({
        type: "instabilité",
        level: lvl,
        confidence: 0.8,
        value: Math.round(visionIndex * 100),
        note: "Observation satellite VisionIA"
      });
    }

    // ======================================================
    // 🔢 Synthèse locale
    // ======================================================
    const maxConf = alerts.length ? Math.max(...alerts.map(a => a.confidence)) : 0;
    const severity =
      alerts.some(a => a.level === "extrême")
        ? "extrême"
        : alerts.some(a => a.level === "alerte")
        ? "alerte"
        : alerts.some(a => a.level === "pré-alerte")
        ? "pré-alerte"
        : "calme";

    return {
      results,
      alerts,
      reliability: clamp01(maxConf),
      severity
    };
  } catch (err) {
    console.error("Erreur evaluatePhenomena:", err);
    return { alerts: [], results: {}, reliability: 0, severity: "erreur" };
  }
}

export default { evaluatePhenomena };
