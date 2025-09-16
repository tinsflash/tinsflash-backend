// -------------------------
// 🌍 forecastService.js
// Fusion des modèles Meteomatics + OpenWeather + fallback
// -------------------------
import fetch from "node-fetch";

export async function getForecast(lat, lon) {
  try {
    const results = { sources: {}, combined: {} };

    // -------------------------
    // 1. Meteomatics
    // -------------------------
    try {
      const meteoUser = process.env.METEOMATICS_USER;
      const meteoPass = process.env.METEOMATICS_PASS;

      if (!meteoUser || !meteoPass) throw new Error("Meteomatics credentials manquants");

      const now = new Date().toISOString().split(":")[0] + ":00:00Z";
      const url = `https://api.meteomatics.com/${now}--${now}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;

      const res = await fetch(url, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${meteoUser}:${meteoPass}`).toString("base64")
        }
      });

      if (!res.ok) throw new Error("Erreur Meteomatics");

      const data = await res.json();
      results.sources.meteomatics = data;
    } catch (err) {
      results.sources.meteomatics = { status: "indisponible", error: err.message };
    }

    // -------------------------
    // 2. OpenWeather
    // -------------------------
    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Erreur OpenWeather");

      const data = await res.json();
      results.sources.openweather = data;
    } catch (err) {
      results.sources.openweather = { status: "indisponible", error: err.message };
    }

    // -------------------------
    // 3. Fusion & IA simplifiée
    // -------------------------
    results.combined = {
      temperature:
        results.sources.meteomatics?.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value ||
        results.sources.openweather?.main?.temp ||
        "N/A",
      description:
        results.sources.openweather?.weather?.[0]?.description ||
        "Prévision indisponible",
      wind:
        results.sources.meteomatics?.data?.[2]?.coordinates?.[0]?.dates?.[0]?.value ||
        results.sources.openweather?.wind?.speed ||
        "N/A",
      precipitation:
        results.sources.meteomatics?.data?.[1]?.coordinates?.[0]?.dates?.[0]?.value || "0",
      reliability: 95, // À ajuster selon pondération IA
      sources: Object.keys(results.sources)
    };

    return results;
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}

