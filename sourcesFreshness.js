// PATH: services/sourcesFreshness.js
// 🩺 Source health & freshness check (Everest v2.8 PRO+++)
// Pings the critical providers BEFORE extraction begins. Logs clear statuses.

import { addEngineLog, addEngineError } from "./engineState.js";
import { headOk, fetchJSON } from "../utils/httpClient.js";
import { MODEL_ENDPOINTS, MODEL_KEYS } from "../config/modelEndpoints.js";

async function check(name, fn) {
  try {
    const ok = await fn();
    if (ok === true) {
      await addEngineLog(`✅ Source ${name} opérationnelle`, "info", "freshness");
      return { name, status: "OK" };
    } else {
      await addEngineError(`⚠️ Source ${name} partielle: ${ok || "unknown"}`, "freshness");
      return { name, status: "PARTIAL", detail: ok };
    }
  } catch (e) {
    await addEngineError(`❌ Source ${name} KO: ${e.message}`, "freshness");
    return { name, status: "DOWN", error: e.message };
  }
}

export async function checkSourcesFreshness() {
  const tests = [
    check("Open‑Meteo", async () => {
      const url = `${MODEL_ENDPOINTS.openMeteo}?latitude=50&longitude=4&hourly=temperature_2m&models=gfs_global`;
      const j = await fetchJSON(url, { timeoutMs: 8000 });
      return !!j?.hourly?.time;
    }),
    check("OpenWeather", async () => {
      if (!MODEL_KEYS.OPENWEATHER_KEY) throw new Error("OPENWEATHER_KEY manquant");
      const url = `${MODEL_ENDPOINTS.openWeather}?lat=50&lon=4&appid=${MODEL_KEYS.OPENWEATHER_KEY}`;
      const j = await fetchJSON(url, { timeoutMs: 8000 });
      return !!j?.cod;
    }),
    check("NASA POWER", async () => {
      const url = `${MODEL_ENDPOINTS.nasaPower}?latitude=50&longitude=4&start=20240101&end=20240102&parameters=T2M&format=JSON&community=RE`;
      const j = await fetchJSON(url, { timeoutMs: 8000 });
      return !!j?.properties;
    }),
    check("Meteomatics", async () => {
      if (!MODEL_KEYS.METEOMATICS_USER || !MODEL_KEYS.METEOMATICS_PASS) return "auth manquante (facultatif)";
      return true;
    }),
    check("GraphCast GW", async () => MODEL_ENDPOINTS.graphcast ? true : "URL manquante (.env)"),
    check("Pangu GW", async () => MODEL_ENDPOINTS.pangu ? true : "URL manquante (.env)"),
    check("CorrDiff GW", async () => MODEL_ENDPOINTS.corrdiff ? true : "URL manquante (.env)"),
    check("NowcastNet GW", async () => MODEL_ENDPOINTS.nowcastnet ? true : "URL manquante (.env)"),
    check("Copernicus CDS", async () => MODEL_ENDPOINTS.cds ? true : "URL manquante (.env)"),
    check("Météo‑France", async () => {
      try {
        const ok = await headOk(MODEL_ENDPOINTS.meteoFrance);
        return ok || "DNS possibly blocked (Render)";
      } catch {
        return "indisponible (DNS)";
      }
    }),
  ];

  const results = await Promise.all(tests);
  const okCount = results.filter(r => r.status === "OK").length;
  await addEngineLog(`🩺 Freshness: ${okCount}/${results.length} sources OK`, "info", "freshness");

  return { results, ok: okCount, total: results.length, checkedAt: new Date().toISOString() };
}

export default { checkSourcesFreshness };
