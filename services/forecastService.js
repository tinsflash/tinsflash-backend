// -------------------------
// 🌍 TINSFLASH Forecast Service
// Combine OpenWeather + GFS + ICON + HiddenSources
// -------------------------
import fetch from "node-fetch";
import axios from "axios";
import cheerio from "cheerio";

export async function getForecast(lat, lon) {
  const results = {
    location: { lat, lon },
    sources: {},
    combined: {}
  };

  // -------------------------
  // 1. OpenWeather (de base)
  // -------------------------
  try {
    const owUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_KEY}`;
    const owRes = await fetch(owUrl);
    results.sources.openweather = await owRes.json();
  } catch (err) {
    results.sources.openweather = { error: err.message };
  }

  // -------------------------
  // 2. NOAA GFS (grille brute simplifiée)
  // -------------------------
  try {
    const gfsUrl = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f000&var_TMP=on&subregion=&leftlon=${lon-1}&rightlon=${lon+1}&toplat=${lat+1}&bottomlat=${lat-1}&dir=%2Fgfs.20250916%2F00%2Fatmos`;
    const gfsRes = await fetch(gfsUrl);
    results.sources.gfs = gfsRes.ok ? "✅ Données GFS disponibles" : "❌ Erreur GFS";
  } catch (err) {
    results.sources.gfs = { error: err.message };
  }

  // -------------------------
  // 3. ICON (DWD Allemagne, JSON simplifié)
  // -------------------------
  try {
    const iconUrl = `https://opendata.dwd.de/weather/icon/grib/${lat},${lon}`;
    const iconRes = await fetch(iconUrl);
    results.sources.icon = iconRes.ok ? "✅ Données ICON disponibles" : "❌ Erreur ICON";
  } catch (err) {
    results.sources.icon = { error: err.message };
  }

  // -------------------------
  // 4. Meteomatics Free (via clé gratuite)
  // -------------------------
  try {
    const mmUrl = `https://api.meteomatics.com/now/t_2m:C/${lat},${lon}/json`;
    const mmRes = await fetch(mmUrl, {
      headers: { Authorization: `Basic ${process.env.METEOMATICS_KEY}` }
    });
    results.sources.meteomatics = await mmRes.json();
  } catch (err) {
    results.sources.meteomatics = { error: err.message };
  }

  // -------------------------
  // 5. Wetterzentrale (scraping)
  // -------------------------
  try {
    const wzUrl = "https://www.wetterzentrale.de/en/";
    const wzRes = await axios.get(wzUrl);
    const $ = cheerio.load(wzRes.data);
    const firstForecast = $("table tr td").first().text();
    results.sources.wetterzentrale = { text: firstForecast || "Scraping ok mais pas trouvé" };
  } catch (err) {
    results.sources.wetterzentrale = { error: err.message };
  }

  // -------------------------
  // 6. Trullemans (BMBC) - scraping caché
  // -------------------------
  try {
    const truUrl = "https://www.bmcb.be/";
    const truRes = await axios.get(truUrl);
    const $ = cheerio.load(truRes.data);
    const truForecast = $("div.fc-content").first().text();
    results.sources.trullemans = { text: truForecast.trim() || "Scraping ok mais pas trouvé" };
  } catch (err) {
    results.sources.trullemans = { error: err.message };
  }

  // -------------------------
  // 7. Fusion / Synthèse IA
  // -------------------------
  try {
    const prompt = `
      Tu es une IA météo scientifique.
      Croise et harmonise les données suivantes pour ${lat},${lon} :
      - OpenWeather: ${JSON.stringify(results.sources.openweather?.list?.[0] || {})}
      - Meteomatics: ${JSON.stringify(results.sources.meteomatics || {})}
      - Trullemans: ${results.sources.trullemans?.text || ""}
      - Wetterzentrale: ${results.sources.wetterzentrale?.text || ""}
      - GFS/ICON: ${results.sources.gfs}, ${results.sources.icon}
      Donne une prévision courte (soirée/nuit + demain + 7 jours) avec indice de fiabilité %.
    `;

    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await reply.json();
    results.combined = data.choices?.[0]?.message?.content || "Erreur IA fusion";
  } catch (err) {
    results.combined = { error: err.message };
  }

  return results;
}
