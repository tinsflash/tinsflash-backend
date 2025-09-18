// services/forecastService.js
// 🌍 Fusion Meteomatics + OpenWeather + GFS + ICON + Trullemans + Wetterzentrale
// Compatible Node.js 18+ (fetch natif)

import { fuseForecasts } from "./fusion.js";

export async function getForecast(lat, lon, country = "BE") {
  try {
    const sources = [];

    // -------------------------
    // 1. Meteomatics
    // -------------------------
    try {
      const user = process.env.METEOMATICS_USER;
      const pass = process.env.METEOMATICS_PASS;
      if (user && pass) {
        const now = new Date().toISOString().split(".")[0] + "Z";
        const future = new Date(Date.now() + 24 * 3600 * 1000)
          .toISOString()
          .split(".")[0] + "Z";

        const url = `https://api.meteomatics.com/${now}--${future}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:kmh,weather_symbol_1h:idx/${lat},${lon}/json`;

        const res = await fetch(url, {
          headers: {
            Authorization:
              "Basic " + Buffer.from(`${user}:${pass}`).toString("base64"),
          },
        });

        if (res.ok) {
          const data = await res.json();
          sources.push({
            source: "meteomatics",
            temperature: data.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value,
            wind: data.data?.[2]?.coordinates?.[0]?.dates?.[0]?.value,
            precipitation: data.data?.[1]?.coordinates?.[0]?.dates?.[0]?.value,
            code: data.data?.[3]?.coordinates?.[0]?.dates?.[0]?.value,
            description: "Données Meteomatics",
          });
        }
      }
    } catch (err) {
      console.warn("Meteomatics KO:", err.message);
    }

    // -------------------------
    // 2. OpenWeather
    // -------------------------
    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (apiKey) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          sources.push({
            source: "openweather",
            temperature: data.main?.temp,
            wind: data.wind?.speed,
            precipitation: data.rain?.["1h"] || 0,
            code: data.weather?.[0]?.id,
            description: data.weather?.[0]?.description,
          });
        }
      }
    } catch (err) {
      console.warn("OpenWeather KO:", err.message);
    }

    // -------------------------
    // 3. GFS NOAA
    // -------------------------
    try {
      const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        sources.push({
          source: "gfs",
          temperature: data.hourly?.temperature_2m?.[0],
          wind: data.hourly?.wind_speed_10m?.[0],
          precipitation: data.hourly?.precipitation?.[0],
          description: "Données GFS",
        });
      }
    } catch (err) {
      console.warn("GFS KO:", err.message);
    }

    // -------------------------
    // 4. ICON DWD
    // -------------------------
    try {
      const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        sources.push({
          source: "icon",
          temperature: data.hourly?.temperature_2m?.[0],
          wind: data.hourly?.wind_speed_10m?.[0],
          precipitation: data.hourly?.precipitation?.[0],
          description: "Données ICON",
        });
      }
    } catch (err) {
      console.warn("ICON KO:", err.message);
    }

    // -------------------------
    // 5. Trullemans (scraping léger pour la BE)
    // -------------------------
    try {
      if (country === "BE") {
        const res = await fetch("https://www.bmcb.be/forecast/");
        if (res.ok) {
          const html = await res.text();
          // 🧩 Simplification: on prend la T° dans la page (regex ou parseur)
          const tempMatch = html.match(/(\d{1,2})°/);
          if (tempMatch) {
            sources.push({
              source: "trullemans",
              temperature: parseInt(tempMatch[1]),
              description: "Prévisions Luc Trullemans",
            });
          }
        }
      }
    } catch (err) {
      console.warn("Trullemans KO:", err.message);
    }

    // -------------------------
    // 6. Fusion finale
    // -------------------------
    const combined = fuseForecasts(sources);

    return { sources, combined };
  } catch (err) {
    throw new Error("Erreur fusion prévisions : " + err.message);
  }
}
