// services/hrrr.js
// 🇺🇸 HRRR (High-Resolution Rapid Refresh, NOAA) – 3 km – USA only

import axios from "axios";

export default async function hrrr(lat, lon) {
  try {
    const baseUrl = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod";
    const now = new Date();
    now.setHours(now.getUTCHours() - 1, 0, 0, 0);

    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const hour = String(now.getUTCHours()).padStart(2, "0");

    const gribUrl = `${baseUrl}/hrrr.${yyyymmdd}/conus/hrrr.t${hour}z.wrfsfcf00.grib2`;

    return {
      source: "HRRR (NOAA NOMADS)",
      modelRun: `${yyyymmdd}T${hour}Z`,
      url: gribUrl,
      note: "⚠️ Décodage GRIB2 requis côté serveur (wgrib2 ou équivalent).",
    };
  } catch (err) {
    console.error("❌ HRRR fetch error:", err.message);
    return { source: "HRRR (NOAA NOMADS)", error: err.message };
  }
}
