// hiddensources/comparator.js
import axios from "axios";

// Exemple simple d'appel externe
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

// ⚖️ Fusionne plusieurs prévisions météo
export function mergeForecasts(sources) {
  if (!sources || sources.length === 0) return {};

  let tempMin = 0, tempMax = 0, wind = 0, rain = 0, reliability = 0;

  sources.forEach(src => {
    if (src.temperature_min !== undefined) tempMin += src.temperature_min;
    if (src.temperature_max !== undefined) tempMax += src.temperature_max;
    if (src.wind !== undefined) wind += src.wind;
    if (src.precipitation !== undefined) rain += src.precipitation;
    if (src.reliability !== undefined) reliability += src.reliability;
  });

  const n = sources.length;

  return {
    source: "Merged",
    temperature_min: Math.round(tempMin / n),
    temperature_max: Math.round(tempMax / n),
    wind: Math.round(wind / n),
    precipitation: Math.round(rain / n),
    reliability: Math.round(reliability / n),
    description: "Prévisions consolidées"
  };
}

// ✅ Export par défaut attendu par superForecast.js
export default {
  compareSources,
  mergeForecasts
};
