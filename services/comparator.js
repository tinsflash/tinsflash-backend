// services/comparator.js

/**
 * Fusionne les prévisions issues de plusieurs sources météo
 * Pondération : ECMWF/ICON > GFS > OpenWeather > NASA > autres
 * Si une seule source dispo → renvoie telle quelle
 */

function mergeForecasts(sources = []) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("mergeForecasts: aucune source fournie");
  }

  // Pondération par source
  const weights = {
    ECMWF: 5,
    ICON: 5,
    GFS: 4,
    OpenWeather: 3,
    "NASA POWER": 2,
    Trullemans: 2,
    Wetterzentrale: 2,
    default: 1,
  };

  const merged = {
    temperature: 0,
    precipitation: 0,
    wind: 0,
    sourcesUsed: [],
  };

  let totalWeight = 0;

  for (const src of sources) {
    if (!src) continue;

    const w = weights[src.source] || weights.default;

    if (typeof src.temperature === "number") {
      merged.temperature += src.temperature * w;
    } else if (Array.isArray(src.temperature) && src.temperature.length) {
      // Moyenne si tableau
      const avgT = src.temperature.reduce((a, b) => a + b, 0) / src.temperature.length;
      merged.temperature += avgT * w;
    }

    if (typeof src.precipitation === "number") {
      merged.precipitation += src.precipitation * w;
    } else if (Array.isArray(src.precipitation) && src.precipitation.length) {
      const avgP = src.precipitation.reduce((a, b) => a + b, 0) / src.precipitation.length;
      merged.precipitation += avgP * w;
    }

    if (typeof src.wind === "number") {
      merged.wind += src.wind * w;
    } else if (Array.isArray(src.wind) && src.wind.length) {
      const avgW = src.wind.reduce((a, b) => a + b, 0) / src.wind.length;
      merged.wind += avgW * w;
    }

    totalWeight += w;
    merged.sourcesUsed.push(src.source || "unknown");
  }

  if (totalWeight === 0) {
    throw new Error("mergeForecasts: pondération totale = 0");
  }

  // Normalisation finale
  merged.temperature = +(merged.temperature / totalWeight).toFixed(2);
  merged.precipitation = +(merged.precipitation / totalWeight).toFixed(2);
  merged.wind = +(merged.wind / totalWeight).toFixed(2);

  return merged;
}

export default { mergeForecasts };
