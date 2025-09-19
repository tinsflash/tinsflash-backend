// -------------------------
// 🌍 forecastVision.js
// Comparateur externe des prévisions météo
// -------------------------

import fs from "fs";

const MANUAL_FILE = "./data/manual_forecasts.json";

// Chargement des prévisions manuelles (FB, WhatsApp, etc.)
function loadManualForecasts() {
  try {
    if (fs.existsSync(MANUAL_FILE)) {
      return JSON.parse(fs.readFileSync(MANUAL_FILE, "utf-8"));
    }
    return [];
  } catch (err) {
    return [];
  }
}

// Ajout manuel depuis admin-pp
export function addManualForecast(source, forecast) {
  const data = loadManualForecasts();
  data.push({
    source,
    forecast,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(MANUAL_FILE, JSON.stringify(data, null, 2));
  return { status: "ok", message: "Prévision ajoutée", count: data.length };
}

// Comparateur TINSFLASH vs autres
export async function getForecastVision(tinsflashForecast, location = "Namur") {
  const manual = loadManualForecasts();

  return {
    location,
    date: new Date().toISOString().split("T")[0],
    tinsflash: tinsflashForecast,
    comparisons: [
      { source: "IRM (officiel)", forecast: "24°C, partiellement nuageux" },
      { source: "Modèle ALARO", forecast: "25°C, instable avec averses" },
      { source: "MétéoBelgique", forecast: "23°C, risque d’averses" },
      { source: "Trullemans", forecast: "26°C, soleil avec voile Sahara" },
      ...manual.map(m => ({
        source: `${m.source} (manuel ${m.timestamp})`,
        forecast: m.forecast
      }))
    ]
  };
}

// Réinitialisation (après update automatique 7h10/12h10/19h10)
export function resetManualForecasts() {
  fs.writeFileSync(MANUAL_FILE, JSON.stringify([], null, 2));
  return { status: "ok", message: "Prévisions manuelles réinitialisées" };
}
