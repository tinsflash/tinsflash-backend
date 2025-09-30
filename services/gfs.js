// services/gfs.js
// 🌍 GFS NOAA direct – Global Forecast System 0.25°
// Source : NOMADS (NOAA)
// Exemple URL : https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.YYYYMMDD/00/atmos/gfs.t00z.pgrb2.0p25.f000

import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

function buildGfsUrl(cycle = "00", forecastHour = "000") {
  const now = new Date();
  const YYYY = now.getUTCFullYear();
  const MM = String(now.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(now.getUTCDate()).padStart(2, "0");
  const date = `${YYYY}${MM}${DD}`;

  return `https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.${date}/${cycle}/atmos/gfs.t${cycle}z.pgrb2.0p25.f${forecastHour}`;
}

async function fetchGfsData(cycle = "00", forecastHour = "000") {
  const url = buildGfsUrl(cycle, forecastHour);
  const tmpFile = `/tmp/gfs_${cycle}_${forecastHour}.grb2`;

  try {
    // 1️⃣ Télécharger le GRIB2
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
      timeout: 60000,
    });
    fs.writeFileSync(tmpFile, response.data);

    // 2️⃣ Convertir en JSON avec wgrib2
    const { stdout } = await execAsync(
      `wgrib2 ${tmpFile} -json -`
    );

    return JSON.parse(stdout);
  } catch (err) {
    console.error("❌ Erreur GFS NOAA:", err.message);
    return null;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

function extractVariables(json) {
  const vars = {
    temperature: [],
    precipitation: [],
    wind: [],
    humidity: [],
  };

  if (!json) return vars;

  for (const field of json) {
    const desc = field.header?.parameterName || "";
    if (desc.includes("TMP")) vars.temperature.push(field.data);
    if (desc.includes("APCP")) vars.precipitation.push(field.data);
    if (desc.includes("UGRD") || desc.includes("VGRD")) vars.wind.push(field.data);
    if (desc.includes("RH")) vars.humidity.push(field.data);
  }

  return vars;
}

export default async function gfs(lat, lon) {
  const json = await fetchGfsData("00", "000"); // Run 00z, échéance immédiate
  if (!json) return { source: "GFS NOAA", error: "Pas de données" };

  const vars = extractVariables(json);

  return {
    source: "GFS NOAA 0.25°",
    ...vars,
  };
}
