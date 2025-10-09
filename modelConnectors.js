// PATH: services/modelConnectors.js
// 🌍 TINSFLASH – Connectors for physical & AI weather models (Everest v2.8 PRO+++)
// Single import for all model families. 100% real HTTP calls, graceful fallback.

import { fetchJSON, buildQuery } from "../utils/httpClient.js";
import { MODEL_ENDPOINTS, MODEL_KEYS } from "../config/modelEndpoints.js";
import { addEngineLog, addEngineError } from "./engineState.js";

// 🔧 Helpers
function ok(data, meta = {}) {
  return { ok: true, data, ...meta };
}
function fail(source, error, meta = {}) {
  return { ok: false, error: error?.message || String(error), source, ...meta };
}

const hourlyParams = "temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m";

// ===============================
// 📦 PHYSICAL MODELS (via Open‑Meteo gateways where possible)
// ===============================
export async function fetchGFS(lat, lon) {
  const url = `${MODEL_ENDPOINTS.openMeteo}?` + buildQuery({
    latitude: lat, longitude: lon,
    hourly: hourlyParams,
    models: "gfs_global",
    timeformat: "unixtime"
  });
  try {
    const data = await fetchJSON(url);
    await addEngineLog(`✅ GFS OK via Open‑Meteo (${lat},${lon})`, "info", "models");
    return ok(data, { source: "GFS" });
  } catch (e) {
    await addEngineError(`❌ GFS failed: ${e.message}`, "models");
    return fail("GFS", e);
  }
}

export async function fetchICON(lat, lon) {
  const url = `${MODEL_ENDPOINTS.openMeteo}?` + buildQuery({
    latitude: lat, longitude: lon,
    hourly: hourlyParams,
    models: "icon_global",
    timeformat: "unixtime"
  });
  try {
    const data = await fetchJSON(url);
    await addEngineLog(`✅ ICON OK via Open‑Meteo (${lat},${lon})`, "info", "models");
    return ok(data, { source: "ICON" });
  } catch (e) {
    await addEngineError(`❌ ICON failed: ${e.message}`, "models");
    return fail("ICON", e);
  }
}

export async function fetchECMWF(lat, lon) {
  const url = `${MODEL_ENDPOINTS.openMeteo}?` + buildQuery({
    latitude: lat, longitude: lon,
    hourly: hourlyParams,
    models: "ecmwf_ifs04",
    timeformat: "unixtime"
  });
  try {
    const data = await fetchJSON(url);
    await addEngineLog(`✅ ECMWF IFS04 OK via Open‑Meteo (${lat},${lon})`, "info", "models");
    return ok(data, { source: "ECMWF-IFS04" });
  } catch (e) {
    await addEngineError(`❌ ECMWF failed: ${e.message}`, "models");
    return fail("ECMWF", e);
  }
}

export async function fetchHRRR(lat, lon) {
  const url = `${MODEL_ENDPOINTS.openMeteo}?` + buildQuery({
    latitude: lat, longitude: lon,
    hourly: hourlyParams,
    models: "hrrr",
    timeformat: "unixtime"
  });
  try {
    const data = await fetchJSON(url);
    await addEngineLog(`✅ HRRR OK via Open‑Meteo (${lat},${lon})`, "info", "models");
    return ok(data, { source: "HRRR" });
  } catch (e) {
    await addEngineError(`❌ HRRR failed: ${e.message}`, "models");
    return fail("HRRR", e);
  }
}

export async function fetchOpenWeather(lat, lon) {
  const url = `${MODEL_ENDPOINTS.openWeather}?` + buildQuery({
    lat, lon, units: "metric", appid: MODEL_KEYS.OPENWEATHER_KEY
  });
  try {
    const data = await fetchJSON(url);
    await addEngineLog(`✅ OpenWeather OK (${lat},${lon})`, "info", "models");
    return ok(data, { source: "OpenWeather" });
  } catch (e) {
    await addEngineError(`❌ OpenWeather failed: ${e.message}`, "models");
    return fail("OpenWeather", e);
  }
}

export async function fetchNASAPower(lat, lon, startISO = null, endISO = null) {
  const now = new Date();
  const end = endISO || now.toISOString().slice(0,10).replace(/-/g,"");
  const start = startISO || new Date(now.getTime()-24*3600*1000).toISOString().slice(0,10).replace(/-/g,"");
  const url = `${MODEL_ENDPOINTS.nasaPower}?` + buildQuery({
    latitude: lat, longitude: lon,
    start, end,
    community: "RE",
    parameters: "T2M,WS10M,PRECTOTCORR",
    format: "JSON"
  });
  try {
    const data = await fetchJSON(url, { timeoutMs: 20000 });
    await addEngineLog(`✅ NASA POWER OK (${lat},${lon})`, "info", "models");
    return ok(data, { source: "NASA_POWER" });
  } catch (e) {
    await addEngineError(`❌ NASA POWER failed: ${e.message}`, "models");
    return fail("NASA_POWER", e);
  }
}

export async function fetchMeteomatics(lat, lon, hoursAhead = 24) {
  const end = new Date();
  const start = new Date(end.getTime());
  const ISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  const path = `${ISO(start)}/${ISO(new Date(end.getTime() + hoursAhead*3600*1000))}:PT1H/` +
    `t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;
  const url = `${MODEL_ENDPOINTS.meteomatics}/${path}`;
  const auth = Buffer.from(`${MODEL_KEYS.METEOMATICS_USER}:${MODEL_KEYS.METEOMATICS_PASS}`).toString("base64");
  try {
    const data = await fetchJSON(url, { headers: { Authorization: `Basic ${auth}` }, timeoutMs: 20000 });
    await addEngineLog(`✅ Meteomatics OK (${lat},${lon})`, "info", "models");
    return ok(data, { source: "Meteomatics" });
  } catch (e) {
    await addEngineError(`❌ Meteomatics failed: ${e.message}`, "models");
    return fail("Meteomatics", e);
  }
}

// ===============================
// 🤖 AI / FOUNDATION WEATHER MODELS (external gateways)
// ===============================
async function callGateway(base, lat, lon, tag) {
  if (!base) {
    return fail(tag, new Error("Gateway URL not configured (.env)"));
  }
  const url = base.includes("?") ? `${base}&lat=${lat}&lon=${lon}` : `${base}?lat=${lat}&lon=${lon}`;
  try {
    const data = await fetchJSON(url, { timeoutMs: 25000 });
    await addEngineLog(`✅ ${tag} OK via gateway (${lat},${lon})`, "info", "models");
    return ok(data, { source: tag });
  } catch (e) {
    await addEngineError(`❌ ${tag} gateway failed: ${e.message}`, "models");
    return fail(tag, e);
  }
}

export const fetchGraphCast = (lat, lon) => callGateway(MODEL_ENDPOINTS.graphcast, lat, lon, "GraphCast");
export const fetchPangu    = (lat, lon) => callGateway(MODEL_ENDPOINTS.pangu, lat, lon, "Pangu");
export const fetchCorrDiff = (lat, lon) => callGateway(MODEL_ENDPOINTS.corrdiff, lat, lon, "CorrDiff");
export const fetchNowcastNet = (lat, lon) => callGateway(MODEL_ENDPOINTS.nowcastnet, lat, lon, "NowcastNet");

// ===============================
// 🧩 Unified multi‑source fetch
// ===============================
export async function fetchAllModels(lat, lon) {
  const tasks = [
    fetchGFS(lat, lon),
    fetchICON(lat, lon),
    fetchECMWF(lat, lon),
    fetchHRRR(lat, lon),
    fetchOpenWeather(lat, lon),
    fetchNASAPower(lat, lon),
    fetchMeteomatics(lat, lon, 24),
    fetchGraphCast(lat, lon),
    fetchPangu(lat, lon),
    fetchCorrDiff(lat, lon),
    fetchNowcastNet(lat, lon),
  ];

  const settled = await Promise.allSettled(tasks);
  const results = [];
  for (const r of settled) {
    if (r.status === "fulfilled") results.push(r.value);
    else results.push({ ok: false, error: r.reason?.message || String(r.reason) });
  }

  const okCount = results.filter(r => r.ok).length;
  await addEngineLog(`📊 fetchAllModels: ${okCount}/${results.length} sources OK`, "info", "models");

  return results;
}
