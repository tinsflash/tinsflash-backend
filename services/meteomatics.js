// services/meteomatics.js
// 🌍 Meteomatics API – Multi-modèles européens (ECMWF, ICON, GFS, etc.)

import axios from "axios";

export default async function meteomatics(lat, lon) {
  try {
    const username = process.env.METEOMATICS_USER || "demo";
    const password = process.env.METEOMATICS_PASS || "demo";
    const url = `https://${username}:${password}@api.meteomatics.com/now/t_2m:C,precip_1h:mm,wind_speed_10m:ms,msl_pressure:hPa,rel_hum_2m:p/${lat},${lon}/json`;

    const { data } = await axios.get(url);

    const result = data?.data?.reduce((acc, cur) => {
      acc[cur.parameter] = cur.coordinates[0]?.dates[0]?.value;
      return acc;
    }, {});

    return {
      source: "Meteomatics (multi-modèles)",
      temperature: result["t_2m:C"] ?? null,
      precipitation: result["precip_1h:mm"] ?? null,
      windspeed: result["wind_speed_10m:ms"] ?? null,
      pressure: result["msl_pressure:hPa"] ?? null,
      humidity: result["rel_hum_2m:p"] ?? null,
      reliability: 95,
    };
  } catch (err) {
    console.error("❌ Meteomatics error:", err.message);
    return { source: "Meteomatics", error: err.message, reliability: 0 };
  }
}
