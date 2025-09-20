// hiddensources/meteomatics.js
import axios from "axios";

/**
 * 🔗 Source Meteomatics (via proxy Open-Meteo gratuit)
 */
export async function getMeteomatics(lat, lon) {
  try {
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`
    );

    return {
      temperature: res.data.hourly.temperature_2m[0],
      precipitation: res.data.hourly.precipitation[0],
      wind: res.data.hourly.wind_speed_10m[0],
      source: "Meteomatics (via Open-Meteo proxy)"
    };
  } catch (err) {
    return { source: "Meteomatics", error: err.message };
  }
}
