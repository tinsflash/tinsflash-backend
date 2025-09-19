// -------------------------
// 🌍 forecastService.js
// Machine de guerre météo : fusion multi-modèles + facteurs locaux + IA
// -------------------------
import { detectAnomaly } from "../utils/seasonalNorms.js";
import { getTrullemansData } from "./trullemans.js";
import { getWetterzentraleData } from "./wetterzentrale.js";
import { getNasaSatData } from "./nasaSat.js";
import { applyLocalFactors } from "./localFactors.js";

export async function getForecast(lat, lon, country = "BE") {
  try {
    const results = { sources: {}, combined: {}, errors: [] };

    // -------------------------
    // 1. Meteomatics (officiel)
    // -------------------------
    try {
      const user = process.env.METEOMATICS_USER;
      const pass = process.env.METEOMATICS_PASS;
      if (!user || !pass) throw new Error("Identifiants Meteomatics manquants !");

      const now = new Date().toISOString().split(".")[0] + "Z";
      const future =
        new Date(Date.now() + 24 * 3600 * 1000).toISOString().split(".")[0] + "Z";

      const url = `https://api.meteomatics.com/${now}--${future}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:kmh/${lat},${lon}/json`;

      const res = await fetch(url, {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${user}:${pass}`).toString("base64"),
        },
      });

      if (!res.ok) throw new Error(`Erreur Meteomatics: ${res.statusText}`);
      results.sources.meteomatics = await res.json();
    } catch (err) {
      results.errors.push("⚠️ meteomatics: " + err.message);
      results.sources.meteomatics = { error: err.message };
    }

    // -------------------------
    // 2. OpenWeather
    // -------------------------
    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
      const res = await fetch(url);
      results.sources.openweather = await res.json();
    } catch (err) {
      results.errors.push("⚠️ openweather: " + err.message);
      results.sources.openweather = { error: err.message };
    }

    // -------------------------
    // 3. Open-Meteo GFS
    // -------------------------
    try {
      const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      results.sources.gfs = await (await fetch(url)).json();
    } catch (err) {
      results.errors.push("⚠️ gfs: " + err.message);
      results.sources.gfs = { error: err.message };
    }

    // -------------------------
    // 4. Open-Meteo ICON
    // -------------------------
    try {
      const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      results.sources.icon = await (await fetch(url)).json();
    } catch (err) {
      results.errors.push("⚠️ icon: " + err.message);
      results.sources.icon = { error: err.message };
    }

    // -------------------------
    // 5. Sources "pirates"
    // -------------------------
    results.sources.trullemans = await getTrullemansData(lat, lon).catch((err) => {
      results.errors.push("⚠️ trullemans: " + err.message);
      return { error: err.message };
    });

    results.sources.wetterzentrale = await getWetterzentraleData(lat, lon).catch((err) => {
      results.errors.push("⚠️ wetterzentrale: " + err.message);
      return { error: err.message };
    });

    results.sources.nasa = await getNasaSatData(lat, lon).catch((err) => {
      results.errors.push("⚠️ nasa: " + err.message);
      return { error: err.message };
    });

    // -------------------------
    // 6. Fusion multi-modèles
    // -------------------------
    const temps = [];
    const winds = [];
    const rains = [];

    for (const src of Object.values(results.sources)) {
      if (src?.temperature) temps.push(src.temperature);
      if (src?.wind) winds.push(src.wind);
      if (src?.precipitation) rains.push(src.precipitation);
    }

    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    let temp = Math.round(avg(temps));
    let wind = Math.round(avg(winds));
    let rain = Math.round(avg(rains) * 10) / 10;

    // -------------------------
    // 7. Facteurs locaux
    // -------------------------
    ({ temp, wind, rain } = applyLocalFactors(lat, lon, { temp, wind, rain }));

    // -------------------------
    // 8. Anomalies saisonnières
    // -------------------------
    const anomaly = detectAnomaly(temp, country);

    // -------------------------
    // 9. Fiabilité
    // -------------------------
    const variance = temps.length ? Math.max(...temps) - Math.min(...temps) : 0;
    let reliability = 98 - variance;
    if (reliability < 60) reliability = 60;
    if (reliability > 99) reliability = 99;

    // -------------------------
    // 10. Résultat final
    // -------------------------
    results.combined = {
      temperature: temp,
      temperature_min: temp - 2,
      temperature_max: temp + 2,
      wind,
      precipitation: rain,
      description: "Prévisions fusionnées multi-modèles + IA + facteurs locaux",
      reliability,
      anomaly,
      sources: Object.keys(results.sources),
      bulletin: `
Prévisions : ${temp - 2}°C → ${temp + 2}°C,
Vent : ${wind} km/h,
Pluie : ${rain} mm.
${anomaly?.message || ""}
Fiabilité : ${reliability}%.
      `,
    };

    return results;
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}
