// services/modelsFetcher.js
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const MODELS = [
  { name: "GFS", type: "numerical", url: "https://nomads.ncep.noaa.gov/...dynamic...", free: true },
  { name: "ICON-D2", type: "numerical", url: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/", free: true },
  { name: "ERA5", type: "climate", url: process.env.CDS_API_URL },
  { name: "GraphCast", type: "ai", url: process.env.GRAPHCAST_API },
  { name: "CorrDiff", type: "ai", url: process.env.CORRDIFF_API },
  { name: "NowcastNet", type: "ai", url: process.env.NOWCASTNET_API },
  { name: "Pangu", type: "ai", url: process.env.PANGU_API },
  { name: "OpenMeteo", type: "fallback", url: "https://api.open-meteo.com/v1/forecast" },
];

async function fetchModel(model, lat, lon) {
  try {
    const start = Date.now();
    let response;

    switch (model.name) {
      case "GFS":
        response = await axios.get(model.url.replace("{YYYYMMDD}", getDateStamp()).replace("{HOUR}", getHourStamp()), { timeout: 10000 });
        break;

      case "ICON-D2":
        response = await axios.get(model.url, { timeout: 10000 });
        break;

      case "GraphCast":
      case "CorrDiff":
      case "NowcastNet":
      case "Pangu":
        response = await axios.post(`${model.url}/run/predict`, { lat, lon }, {
          headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
        });
        break;

      case "ERA5":
        response = await axios.post(model.url, {
          variable: ["2m_temperature", "total_precipitation"],
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          time: ["00:00"],
          format: "netcdf",
        }, {
          auth: {
            username: process.env.CDS_API_KEY,
            password: process.env.CDS_API_KEY,
          },
        });
        break;

      default:
        response = await axios.get(`${model.url}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation`, { timeout: 8000 });
    }

    const duration = Date.now() - start;
    return { name: model.name, ok: true, time: duration, status: response.status };
  } catch (err) {
    return { name: model.name, ok: false, error: err.message || "fetch_failed" };
  }
}

function getDateStamp() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function getHourStamp() {
  const h = new Date().getUTCHours();
  return h < 12 ? "00" : h < 18 ? "12" : "18";
}

export async function testAllModels(lat = 50.5, lon = 4.7) {
  const results = await Promise.all(MODELS.map((m) => fetchModel(m, lat, lon)));
  const okModels = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  console.log("✅ Models OK:", okModels.map((r) => r.name).join(", "));
  console.warn("⚠️ Models Failed:", failed.map((r) => `${r.name} (${r.error})`).join(", "));
  return { okModels, failed };
}

export default { testAllModels, fetchModel };
