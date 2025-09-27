// services/alertDetector.js
function pick(values) {
  return values.find(v => typeof v === "number" && !Number.isNaN(v));
}

function extractLayers(point = {}) {
  const s = point.sources || {};
  const ow = point.openweather || (typeof point.forecast === "object" ? point.forecast : null);

  const wind = pick([s.gfs?.wind_kmh, s.ecmwf?.wind_kmh, s.icon?.wind_kmh, ow?.wind?.speed_kmh]);
  const gust = pick([s.gfs?.gust_kmh, s.ecmwf?.gust_kmh, ow?.wind?.gust_kmh]);
  const precip24 = pick([s.gfs?.precip_24h_mm, s.ecmwf?.precip_24h_mm, s.icon?.precip_24h_mm, ow?.precipitation]);
  const snow24 = pick([s.gfs?.snow_24h_cm, s.ecmwf?.snow_24h_cm, s.icon?.snow_24h_cm, ow?.snow]);
  const tmax = pick([s.gfs?.tmax_c, s.ecmwf?.tmax_c, s.icon?.tmax_c, ow?.temp?.max]);
  const tmin = pick([s.gfs?.tmin_c, s.ecmwf?.tmin_c, s.icon?.tmin_c, ow?.temp?.min]);
  const cape = pick([s.gfs?.cape_jkg, s.ecmwf?.cape_jkg, s.icon?.cape_jkg]);
  const rh = pick([s.gfs?.rh_pct, s.ecmwf?.rh_pct, s.icon?.rh_pct, ow?.humidity]);

  return { wind, gust, precip24, snow24, tmax, tmin, cape, rh };
}

function consensusScore(layers, sources) {
  const values = [];
  const s = sources || {};
  [s.gfs?.wind_kmh, s.ecmwf?.wind_kmh, s.icon?.wind_kmh].forEach(v => { if (typeof v === "number") values.push(v); });
  if (values.length < 2) return 0.5;
  const avg = values.reduce((a,b)=>a+b,0)/values.length;
  const spread = Math.max(...values) - Math.min(...values);
  return Math.max(0, Math.min(1, 1 - (spread / Math.max(10, avg))));
}

export function detectAlerts(point, ctx = {}) {
  const alerts = [];
  const L = extractLayers(point);
  const consensus = consensusScore(L, point.sources);

  if ((L.wind||0) >= 90 || (L.gust||0) >= 90) {
    alerts.push({ type:"wind", message:`Rafales ${Math.round(Math.max(L.wind||0,L.gust||0))} km/h`, confidence: Math.round(100*(0.6+consensus)), scope: ctx.scope, country: ctx.country });
  }
  if ((L.precip24||0) >= 40) {
    alerts.push({ type:"rain", message:`Pluie ${Math.round(L.precip24)} mm/24h`, confidence: Math.round(100*(0.5+consensus)), scope: ctx.scope, country: ctx.country });
  }
  if ((L.snow24||0) >= 15) {
    alerts.push({ type:"snow", message:`Neige ${Math.round(L.snow24)} cm/24h`, confidence: Math.round(100*(0.5+consensus)), scope: ctx.scope, country: ctx.country });
  }
  if ((L.tmax||0) >= 35) {
    alerts.push({ type:"heat", message:`Canicule Tmax ${Math.round(L.tmax)}°C`, confidence: Math.round(100*(0.6+consensus)), scope: ctx.scope, country: ctx.country });
  }
  if ((L.tmin||0) <= -15) {
    alerts.push({ type:"cold", message:`Froid Tmin ${Math.round(L.tmin)}°C`, confidence: Math.round(100*(0.6+consensus)), scope: ctx.scope, country: ctx.country });
  }

  return alerts.map(a => ({ ...a, createdAt: new Date().toISOString() }));
}
