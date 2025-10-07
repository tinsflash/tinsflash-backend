// services/localFactors.js
import fetch from "node-fetch";
import { addEngineLog } from "./engineState.js";

export async function applyLocalFactors(forecast, lat, lon, country) {
  try {
    const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    const elevation = (await res.json())?.results?.[0]?.elevation ?? 0;
    if (elevation > 400) { forecast.temperature -= 2; forecast.humidity += 5; }
    if (["France","Belgium","Germany"].includes(country)) { forecast.temperature += 0.5; forecast.humidity -= 2; }
    forecast.localAdjust = { elevation };
    await addEngineLog("🌡️ LocalFactors appliqués");
    return forecast;
  } catch (err) {
    await addEngineLog("Erreur LocalFactors: " + err.message);
    return forecast;
  }
  export default { applyLocalFactors };
}
