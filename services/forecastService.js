// -------------------------
// 🌍 forecastService.js
// Machine de guerre météo : fusion multi-modèles + facteurs locaux + IA
// -------------------------
import { detectAnomaly } from "../utils/seasonalNorms.js";
import { getTrullemansData } from "./trullemans.js";
import { getWetterzentraleData } from "./wetterzentrale.js";
import { getNasaSatData } from "./nasaSat.js";
import { applyLocalFactors } from "./localFactors.js";
import { getWeatherIcon } from "./codesService.js";

// Moyenne
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

export async function getForecast(lat, lon, country = "BE") {
  try {
    const results = { sources: {}, combined: {}, daily: [] };

    // -------------------------
    // 1. SOURCES OFFICIELLES
    // -------------------------
    try {
      const user = process.env.METEOMATICS_USER;
      const pass = process.env.METEOMATICS_PASS;
      if (!user || !pass) throw new Error("Identifiants Meteomatics manquants !");
      const now = new Date().toISOString().split(".")[0] + "Z";
      const next7d = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split(".")[0] + "Z";

      const url = `https://api.meteomatics.com/${now}--${next7d}:PT3H/t_2m:C,precip_3h:mm,wind_speed_10m:kmh,weather_symbol_3h:idx/${lat},${lon}/json`;
      const res = await fetch(url, {
        headers: { Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64") },
      });
      results.sources.meteomatics = await res.json();
    } catch (err) {
      results.sources.meteomatics = { error: err.message };
    }

    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
      results.sources.openweather = await (await fetch(url)).json();
    } catch (err) {
      results.sources.openweather = { error: err.message };
    }

    try {
      const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      results.sources.gfs = await (await fetch(url)).json();
    } catch (err) {
      results.sources.gfs = { error: err.message };
    }

    try {
      const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      results.sources.icon = await (await fetch(url)).json();
    } catch (err) {
      results.sources.icon = { error: err.message };
    }

    // -------------------------
    // 2. SOURCES PIRATES
    // -------------------------
    results.sources.trullemans = await getTrullemansData(lat, lon).catch(err => ({ error: err.message }));
    results.sources.wetterzentrale = await getWetterzentraleData(lat, lon).catch(err => ({ error: err.message }));
    results.sources.nasa = await getNasaSatData(lat, lon).catch(err => ({ error: err.message }));

    // -------------------------
    // 3. FUSION JOUR PAR JOUR
    // -------------------------
    const now = new Date();
    for (let d = 0; d < 7; d++) {
      const day = new Date();
      day.setDate(now.getDate() + d);
      const dayLabel = day.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      const temps = [];
      const winds = [];
      const rains = [];

      // Meteomatics
      if (results.sources.meteomatics?.data) {
        const t = results.sources.meteomatics.data.find(x => x.parameter === "t_2m:C");
        const w = results.sources.meteomatics.data.find(x => x.parameter === "wind_speed_10m:kmh");
        const p = results.sources.meteomatics.data.find(x => x.parameter === "precip_3h:mm");

        if (t) temps.push(...t.coordinates[0].dates.filter(dt => dt.date.startsWith(day.toISOString().split("T")[0])).map(x => x.value));
        if (w) winds.push(...w.coordinates[0].dates.filter(dt => dt.date.startsWith(day.toISOString().split("T")[0])).map(x => x.value));
        if (p) rains.push(...p.coordinates[0].dates.filter(dt => dt.date.startsWith(day.toISOString().split("T")[0])).map(x => x.value));
      }

      // OpenWeather
      if (results.sources.openweather?.list) {
        results.sources.openweather.list
          .filter(f => f.dt_txt.startsWith(day.toISOString().split("T")[0]))
          .forEach(f => {
            temps.push(f.main.temp);
            winds.push(f.wind.speed);
            rains.push(f.rain?.["3h"] || 0);
          });
      }

      // GFS
      if (results.sources.gfs?.hourly?.temperature_2m) {
        temps.push(results.sources.gfs.hourly.temperature_2m[d * 24] || null);
        winds.push(results.sources.gfs.hourly.wind_speed_10m[d * 24] || null);
        rains.push(results.sources.gfs.hourly.precipitation[d * 24] || 0);
      }

      // ICON
      if (results.sources.icon?.hourly?.temperature_2m) {
        temps.push(results.sources.icon.hourly.temperature_2m[d * 24] || null);
        winds.push(results.sources.icon.hourly.wind_speed_10m[d * 24] || null);
        rains.push(results.sources.icon.hourly.precipitation[d * 24] || 0);
      }

      // Fusion
      let temp = Math.round(avg(temps) || 0);
      let wind = Math.round(avg(winds) || 0);
      let rain = Math.round(avg(rains) * 10) / 10 || 0;

      // Facteurs locaux
      ({ temp, wind, rain } = applyLocalFactors(lat, lon, { temp, wind, rain }));

      // Fiabilité
      const variance = temps.length ? Math.max(...temps) - Math.min(...temps) : 0;
      let reliability = 98 - variance;
      if (reliability < 60) reliability = 60;
      if (reliability > 99) reliability = 99;

      // Anomalies
      const anomaly = detectAnomaly(temp, country);

      results.daily.push({
        date: day.toISOString().split("T")[0],
        jour: dayLabel,
        temperature_min: Math.min(...temps) || temp - 2,
        temperature_max: Math.max(...temps) || temp + 2,
        vent: wind,
        precipitation: rain,
        description: `Conditions attendues : ${temp}°C en moyenne`,
        fiabilité: reliability,
        anomalie: anomaly?.message || "Normale",
        icone: getWeatherIcon(temp > 25 ? 1 : temp < 0 ? 2 : 3),
        bulletin: `
          Prévisions pour ${dayLabel} :
          Températures de ${Math.min(...temps) || temp - 2}°C à ${Math.max(...temps) || temp + 2}°C,
          vent moyen ${wind} km/h,
          précipitations ${rain} mm.
          ${anomaly?.message || "Pas d’anomalie majeure."}
          Fiabilité estimée : ${reliability}%.
        `,
      });
    }

    // -------------------------
    // 4. Résumé combiné (aujourd'hui)
    // -------------------------
    results.combined = results.daily[0];

    return results;
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}
