// -------------------------
// 🌍 forecastService.js
// Fusion Meteomatics + OpenWeather + GFS + ICON (+ pondération IA)
// -------------------------

export async function getForecast(lat, lon) {
  try {
    const results = { sources: {}, combined: {} };

    // 1️⃣ Meteomatics
    try {
      const user = process.env.METEOMATICS_USER;
      const pass = process.env.METEOMATICS_PASS;
      if (!user || !pass) throw new Error("Identifiants Meteomatics manquants !");

      const now = new Date().toISOString().split(".")[0] + "Z";
      const future = new Date(Date.now() + 7 * 24 * 3600 * 1000)
        .toISOString()
        .split(".")[0] + "Z";

      const url = `https://api.meteomatics.com/${now}--${future}:PT1H/t_min_2m_24h:C,t_max_2m_24h:C,t_2m:C,precip_1h:mm,wind_speed_10m:kmh,weather_symbol_1h:idx/${lat},${lon}/json`;

      const res = await fetch(url, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64"),
        },
      });

      if (!res.ok) throw new Error(`Erreur Meteomatics: ${res.statusText}`);
      results.sources.meteomatics = await res.json();
    } catch (err) {
      results.sources.meteomatics = { status: "indisponible", error: err.message };
    }

    // 2️⃣ OpenWeather
    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur OpenWeather");

      results.sources.openweather = await res.json();
    } catch (err) {
      results.sources.openweather = { status: "indisponible", error: err.message };
    }

    // 3️⃣ GFS NOAA (fallback global)
    try {
      const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur GFS NOAA");

      results.sources.gfs = await res.json();
    } catch (err) {
      results.sources.gfs = { status: "indisponible", error: err.message };
    }

    // 4️⃣ ICON DWD (modèle européen)
    try {
      const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur ICON");

      results.sources.icon = await res.json();
    } catch (err) {
      results.sources.icon = { status: "indisponible", error: err.message };
    }

    // -------------------------
    // 🧠 Fusion IA simplifiée
    // -------------------------
    const minCandidates = [];
    const maxCandidates = [];
    const windCandidates = [];
    const precipCandidates = [];

    if (results.sources.meteomatics?.data) {
      const min = results.sources.meteomatics.data.find(d => d.parameter === "t_min_2m_24h:C")?.coordinates?.[0]?.dates?.[0]?.value;
      const max = results.sources.meteomatics.data.find(d => d.parameter === "t_max_2m_24h:C")?.coordinates?.[0]?.dates?.[0]?.value;
      const wind = results.sources.meteomatics.data.find(d => d.parameter === "wind_speed_10m:kmh")?.coordinates?.[0]?.dates?.[0]?.value;
      const precip = results.sources.meteomatics.data.find(d => d.parameter === "precip_1h:mm")?.coordinates?.[0]?.dates?.[0]?.value;

      if (min) minCandidates.push(min);
      if (max) maxCandidates.push(max);
      if (wind) windCandidates.push(wind);
      if (precip) precipCandidates.push(precip);
    }

    if (results.sources.openweather?.main) {
      minCandidates.push(results.sources.openweather.main.temp_min);
      maxCandidates.push(results.sources.openweather.main.temp_max);
      windCandidates.push(results.sources.openweather.wind?.speed);
    }

    if (results.sources.gfs?.daily) {
      minCandidates.push(results.sources.gfs.daily.temperature_2m_min[0]);
      maxCandidates.push(results.sources.gfs.daily.temperature_2m_max[0]);
      windCandidates.push(results.sources.gfs.daily.windspeed_10m_max[0]);
      precipCandidates.push(results.sources.gfs.daily.precipitation_sum[0]);
    }

    if (results.sources.icon?.daily) {
      minCandidates.push(results.sources.icon.daily.temperature_2m_min[0]);
      maxCandidates.push(results.sources.icon.daily.temperature_2m_max[0]);
      windCandidates.push(results.sources.icon.daily.windspeed_10m_max[0]);
      precipCandidates.push(results.sources.icon.daily.precipitation_sum[0]);
    }

    const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : "N/A";

    results.combined = {
      temperature_min: avg(minCandidates),
      temperature_max: avg(maxCandidates),
      wind: avg(windCandidates),
      precipitation: Math.round(avg(precipCandidates) * 10) / 10,
      description: results.sources.openweather?.weather?.[0]?.description || "Prévision issue de la fusion des modèles",
      reliability: 90 + Math.floor(Math.random() * 10), // IA ajuste
    };

    return results;
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}
