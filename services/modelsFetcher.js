// services/modelsFetcher.js
import axios from "axios";
import dotenv from "dotenv";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
dotenv.config();

const MODELS = [
  { key: "GFS", name: "GFS NOAA", url: "https://nomads.ncep.noaa.gov/", free: true },
  { key: "ICON", name: "ICON DWD", url: "https://opendata.dwd.de/weather/nwp/icon-d2/", free: true },
  { key: "ECMWF", name: "ECMWF ERA5", url: process.env.CDS_API_URL },
  { key: "Meteomatics", name: "Meteomatics", url: "https://api.meteomatics.com" },
  { key: "Copernicus", name: "Copernicus Climate", url: process.env.CDS_API_URL },
  { key: "NASA", name: "NASA POWER", url: "https://power.larc.nasa.gov/api" },
  { key: "OpenWeather", name: "OpenWeatherMap", url: "https://api.openweathermap.org/data/2.5/weather" },
];

async function fetchModel(model, lat = 50.5, lon = 4.7) {
  const t0 = Date.now();
  try {
    let res;
    if (model.key === "OpenWeather") {
      res = await axios.get(`${model.url}?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}&units=metric`);
    } else if (model.key === "NASA") {
      res = await axios.get(`${model.url}/temporal/daily/point?parameters=T2M&latitude=${lat}&longitude=${lon}&format=JSON`);
    } else {
      res = await axios.get(model.url);
    }

    await updateEngineState(`checkup.models.${model.key}`, "ok");
    await addEngineLog(`✅ ${model.name} récupéré en ${Date.now() - t0}ms`);
    return { model: model.key, ok: true, status: res.status };
  } catch (err) {
    await updateEngineState(`checkup.models.${model.key}`, "error");
    await addEngineError(`❌ ${model.name} : ${err.message}`);
    return { model: model.key, ok: false, error: err.message };
  }
}

export async function runAllModels(lat = 50.5, lon = 4.7) {
  await addEngineLog("🌍 Lancement récupération des modèles météo (multi-sources)...");
  const results = await Promise.all(MODELS.map((m) => fetchModel(m, lat, lon)));
  return results;
}

export default { runAllModels };
