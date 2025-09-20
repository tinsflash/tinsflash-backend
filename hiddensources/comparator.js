// hiddensources/comparator.js
import axios from "axios";

export async function compareSources(lat, lon) {
  try {
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    return [
      {
        source: "Open-Meteo",
        temperature_min: res.data.daily.temperature_2m_min[0],
        temperature_max: res.data.daily.temperature_2m_max[0],
        summary: `T° min: ${res.data.daily.temperature_2m_min[0]}°C, max: ${res.data.daily.temperature_2m_max[0]}°C`
      }
    ];
  } catch (err) {
    return [{ source: "Open-Meteo", error: err.message }];
  }
}
