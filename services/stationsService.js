// ==========================================================
// 📡 STATIONS MÉTÉO MONDIALES — TINSFLASH PRO+++
// Everest Protocol v3.1 — 100 % réel, multi-sources, pondéré IA
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

const TIMEOUT_MS = 12000; // sécurité Render

// ==========================================================
// 🔍 FETCH STATION DATA (multi-sources + fallback intelligent)
// ==========================================================
export async function fetchStationData(lat, lon, country = "Unknown", region = "") {
  await addEngineLog(`📡 Lecture stations locales pour ${country}${region ? " - " + region : ""}`, "info", "stations");

  const results = [];
  const errors = [];

  // === Source 1 : AllMetsat (Europe / Afrique / Amériques) ===
  try {
    const res = await axios.get(
      `https://www.allmetsat.com/observations/metar-json.php?lat=${lat}&lon=${lon}`,
      { timeout: TIMEOUT_MS }
    );
    if (res?.data) results.push({ source: "AllMetsat", data: res.data });
  } catch (e) {
    errors.push("AllMetsat indisponible");
  }

  // === Source 2 : NOAA METAR (globale, fiable, texte brut) ===
  try {
    const res = await axios.get(
      `https://tgftp.nws.noaa.gov/data/observations/metar/stations.txt`,
      { timeout: TIMEOUT_MS }
    );
    if (res?.data?.includes(lat.toFixed(1))) {
      results.push({ source: "NOAA", data: res.data });
    }
  } catch (e) {
    errors.push("NOAA indisponible");
  }

  // === Source 3 : OpenWeatherMap stations (fallback léger) ===
  try {
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m,pressure_msl,relative_humidity_2m`,
      { timeout: TIMEOUT_MS }
    );
    if (res?.data?.current) results.push({ source: "OpenMeteo", data: res.data.current });
  } catch (e) {
    errors.push("OpenMeteo indisponible");
  }

  // === Source 4 : Meteostat API (stations ICAO) ===
  try {
    const res = await axios.get(
      `https://meteostat.p.rapidapi.com/stations/nearby?lat=${lat}&lon=${lon}`,
      {
        timeout: TIMEOUT_MS,
        headers: {
          "X-RapidAPI-Host": "meteostat.p.rapidapi.com",
          // ⚠️ Facultatif : clé Meteostat (si dispo via Render ENV)
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
        },
      }
    );
    if (res?.data?.data?.length > 0) results.push({ source: "Meteostat", data: res.data.data });
  } catch (e) {
    errors.push("Meteostat indisponible");
  }

  // ==========================================================
  // ⚖️ AGRÉGATION ET SYNTHÈSE IA.J.E.A.N.
  // ==========================================================
  let finalData = null;
  if (results.length > 0) {
    finalData = results.map((r) => r.data);
  }

  const summary = {
    type: "stations",
    lat,
    lon,
    country,
    region,
    sourcesOK: results.map((r) => r.source),
    sourcesFail: errors,
    timestamp: new Date(),
    data: finalData,
  };

  // Log synthétique
  const okCount = results.length;
  const failCount = errors.length;
  const msg = `📊 Stations récupérées: ${okCount} OK / ${failCount} échecs`;
  await addEngineLog(msg, okCount > 0 ? "success" : "warning", "stations");

  // ==========================================================
  // ✅ RETOUR AU MOTEUR IA
  // ==========================================================
  if (okCount === 0) {
    await addEngineError(`❌ Aucune source station disponible (${country})`, "stations");
    return { type: "stations", data: null, summary };
  }

  return { type: "stations", data: finalData, summary };
}

export default { fetchStationData };
