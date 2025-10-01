// PATH: services/nasaSat.js
// 🌍 NASA POWER (daily point) — enrichi pour cohérence avec SuperForecast

import fetch from "node-fetch";

/**
 * NASA POWER (daily point)
 * Variables principales retenues :
 * - T2M (température 2m moyenne)
 * - T2M_MAX / T2M_MIN (si dispo selon API)
 * - WS10M (vent 10m)
 * - PRECTOTCORR (précipitations corrigées)
 * - ALLSKY_SFC_SW_DWN (rayonnement solaire global)
 */
export default async function nasaSat({ lat, lon }) {
  try {
    const today = new Date();
    const ymd = (d) =>
      d.getFullYear().toString().padStart(4, "0") +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");

    // ⚠️ NASA POWER → séries journalières (souvent consolidées J-1)
    const end = ymd(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7); // 🔁 horizon 7 jours (si dispo)
    const start = ymd(startDate);

    const params = [
      "T2M",
      "T2M_MAX",
      "T2M_MIN",
      "WS10M",
      "PRECTOTCORR",
      "ALLSKY_SFC_SW_DWN",
    ].join(",");

    const url =
      `https://power.larc.nasa.gov/api/temporal/daily/point?` +
      `parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}` +
      `&start=${start}&end=${end}&format=JSON`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`NASA POWER error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();

    const raw = data?.properties?.parameter || {};
    const dates = Object.keys(raw?.T2M || {});

    // 🔎 Formatage enrichi cohérent
    const result = dates.map((date) => ({
      date,
      temperature: raw.T2M?.[date] ?? null,
      temperature_max: raw.T2M_MAX?.[date] ?? null,
      temperature_min: raw.T2M_MIN?.[date] ?? null,
      precipitation: raw.PRECTOTCORR?.[date] ?? null,
      wind: raw.WS10M?.[date] ?? null,
      radiation: raw.ALLSKY_SFC_SW_DWN?.[date] ?? null,
    }));

    return {
      source: "NASA POWER",
      lat,
      lon,
      period: { start, end },
      forecasts: result,
    };
  } catch (e) {
    return { source: "NASA POWER", error: e.message };
  }
}
