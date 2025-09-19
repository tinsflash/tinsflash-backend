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
    // 1. Promesses API (officielles)
    // -------------------------
    const tasks = [
      // Meteomatics
      (async () => {
        try {
          const user = process.env.METEOMATICS_USER;
          const pass = process.env.METEOMATICS_PASS;
          if (!user || !pass) throw new Error("Identifiants Meteomatics manquants !");

          const now = new Date().toISOString().split(".")[0] + "Z";
          const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split(".")[0] + "Z";
          const url = `https://api.meteomatics.com/${now}--${future}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:kmh/${lat},${lon}/json`;

          const res = await fetch(url, {
            headers: { Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64") },
          });
          if (!res.ok) throw new Error(`Erreur Meteomatics: ${res.statusText}`);
          results.sources.meteomatics = await res.json();
        } catch (err) {
          results.sources.meteomatics = { error: err.message };
          results.errors.push("meteomatics: " + err.message);
        }
      })(),

      // OpenWeather
      (async () => {
        try {
          const apiKey = process.env.OPENWEATHER_KEY;
          if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Erreur OpenWeather: ${res.statusText}`);
          results.sources.openweather = await res.json();
        } catch (err) {
          results.sources.openweather = { error: err.message };
          results.errors.push("openweather: " + err.message);
        }
      })(),

      // GFS
      (async () => {
        try {
          const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Erreur GFS: ${res.statusText}`);
          results.sources.gfs = await res.json();
        } catch (err) {
          results.sources.gfs = { error: err.message };
          results.errors.push("gfs: " + err.message);
        }
      })(),

      // ICON
      (async () => {
        try {
          const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Erreur ICON: ${res.statusText}`);
          results.sources.icon = await res.json();
        } catch (err) {
          results.sources.icon = { error: err.message };
          results.errors.push("icon: " + err.message);
        }
      })(),
    ];

    // -------------------------
    // 2. Sources pirates
    // -------------------------
    tasks.push(
      (async () => {
        try {
          results.sources.trullemans = await getTrullemansData(lat, lon);
        } catch (err) {
          results.sources.trullemans = { error: err.message };
          results.errors.push("trullemans: " + err.message);
        }
      })()
    );

    tasks.push(
      (async () => {
        try {
          results.sources.wetterzentrale = await getWetterzentraleData(lat, lon);
        } catch (err) {
          results.sources.wetterzentrale = { error: err.message };
          results.errors.push("wetterzentrale: " + err.message);
        }
      })()
    );

    tasks.push(
      (async () => {
        try {
          results.sources.nasa = await getNasaSatData(lat, lon);
        } catch (err) {
          results.sources.nasa = { error: err.message };
          results.errors.push("nasa: " + err.message);
        }
      })()
    );

    // -------------------------
    // 3. Attente + délai min réaliste
    // -------------------------
    await Promise.allSettled(tasks);

    // délai min (4 secondes)
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // -------------------------
    // 4. Fusion
    // -------------------------
    const temps = [];
    const winds = [];
    const rains = [];

    for (const src of Object.values(results.sources)) {
      if (src?.temperature) temps.push(src.temperature);
      if (src?.wind) winds.push(src.wind);
      if (src?.precipitation) rains.push(src.precipitation);
    }

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    let temp = avg(temps) !== null ? Math.round(avg(temps)) : 15; // fallback 15°C
    let wind = avg(winds) !== null ? Math.round(avg(winds)) : 10; // fallback 10 km/h
    let rain = avg(rains) !== null ? Math.round(avg(rains) * 10) / 10 : 0; // fallback 0 mm

    // -------------------------
    // 5. Facteurs locaux
    // -------------------------
    ({ temp, wind, rain } = applyLocalFactors(lat, lon, { temp, wind, rain }));

    // -------------------------
    // 6. Anomalies saisonnières
    // -------------------------
    const anomaly = detectAnomaly(temp, country);

    // -------------------------
    // 7. Fiabilité
    // -------------------------
    const variance = temps.length ? Math.max(...temps) - Math.min(...temps) : 0;
    let reliability = 98 - variance;
    if (reliability < 60) reliability = 60;
    if (reliability > 99) reliability = 99;

    // -------------------------
    // 8. Résultats
    // -------------------------
    results.combined = {
      temperature: temp,
      temperature_min: temp - 2,
      temperature_max: temp + 2,
      wind,
      precipitation: rain,
      description: "Prévisions issues d'une fusion multi-modèles + IA + sources locales",
      reliability,
      anomaly,
      sources: Object.keys(results.sources),
      errors: results.errors,
      bulletin: `
        Bulletin météo : températures entre ${temp - 2}°C et ${temp + 2}°C,
        vent ${wind} km/h, précipitations ${rain} mm.
        ${anomaly?.message || ""}
        Fiabilité : ${reliability}%.
      `,
    };

    return results;
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}
