// ✅ services/modelsFetcher.js
// TINSFLASH – Moteur mondial IA météo – système J.E.A.N.
// Ce module teste et récupère en direct les modèles météo ouverts + IA nouvelle génération.
// Zéro mock, zéro démo : tout 100 % réel.

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MODELS = [
  // 🔹 Modèles numériques traditionnels
  {
    name: "GFS",
    type: "numerical",
    url:
      "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t{HOUR}z.pgrb2.0p25.f000&lev_2_m_above_ground=on&var_TMP=on&var_UGRD=on&var_VGRD=on&subregion=&leftlon=-20&rightlon=40&toplat=70&bottomlat=30&dir=%2Fgfs.{YYYYMMDD}{HOUR}%2F",
    free: true,
  },
  {
    name: "ICON-D2",
    type: "numerical",
    url: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/",
    free: true,
  },

  // 🔹 Modèles climatiques / satellites
  {
    name: "ERA5",
    type: "climate",
    url: process.env.CDS_API_URL,
  },

  // 🔹 Modèles IA nouvelle génération
  {
    name: "GraphCast",
    type: "ai",
    url: process.env.GRAPHCAST_API,
  },
  {
    name: "CorrDiff",
    type: "ai",
    url: process.env.CORRDIFF_API,
  },
  {
    name: "NowcastNet",
    type: "ai",
    url: process.env.NOWCASTNET_API,
  },
  {
    name: "Pangu",
    type: "ai",
    url: process.env.PANGU_API,
  },

  // 🔹 Fallback open data
  {
    name: "Open-Meteo",
    type: "fallback",
    url: "https://api.open-meteo.com/v1/forecast",
  },
];

async function fetchModel(model, lat, lon) {
  try {
    const start = Date.now();
    let response;

    switch (model.name) {
      case "GFS":
        response = await axios.get(
          model.url
            .replace("{YYYYMMDD}", getDateStamp())
            .replace(/{HOUR}/g, getHourStamp()),
          { timeout: 12000 }
        );
        break;

      case "ICON-D2":
        response = await axios.get(model.url, { timeout: 12000 });
        break;

      case "GraphCast":
      case "CorrDiff":
      case "NowcastNet":
      case "Pangu":
        response = await axios.post(
          `${model.url}/run/predict`,
          { lat, lon },
          {
            headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
            timeout: 15000,
          }
        );
        break;

      case "ERA5":
        response = await axios.post(
          model.url,
          {
            variable: ["2m_temperature", "total_precipitation"],
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate(),
            time: ["00:00"],
            format: "netcdf",
          },
          {
            auth: {
              username: process.env.CDS_API_KEY,
              password: process.env.CDS_API_KEY,
            },
            timeout: 20000,
          }
        );
        break;

      default:
        response = await axios.get(
          `${model.url}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`,
          { timeout: 10000 }
        );
    }

    const duration = Date.now() - start;
    return {
      name: model.name,
      ok: true,
      status: response.status,
      time: duration,
    };
  } catch (err) {
    return {
      name: model.name,
      ok: false,
      error:
        err.response?.statusText ||
        err.message ||
        "Erreur inconnue lors du fetch",
    };
  }
}

function getDateStamp() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function getHourStamp() {
  const h = new Date().getUTCHours();
  if (h < 6) return "00";
  if (h < 12) return "06";
  if (h < 18) return "12";
  return "18";
}

export async function testAllModels(lat = 50.5, lon = 4.7) {
  console.log("🚀 Vérification des modèles météo en temps réel…");
  const results = await Promise.all(MODELS.map((m) => fetchModel(m, lat, lon)));

  const okModels = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log(
    "✅ Modèles disponibles :",
    okModels.map((r) => `${r.name} (${r.time} ms)`).join(", ")
  );
  console.warn(
    "⚠️ Modèles en erreur :",
    failed.map((r) => `${r.name} (${r.error})`).join(", ")
  );

  return { okModels, failed };
}

export default { testAllModels, fetchModel };
