// PATH: services/nasaSat.js
import fetch from "node-fetch";

/**
 * NASA POWER (daily point) — paramètres essentiels :
 * T2M (temp 2m), WS10M (vent 10m), PRECTOTCORR (précip), ALLSKY_SFC_SW_DWN (rayonnement).
 */
export default async function nasaSat({ lat, lon }) {
  try {
    const today = new Date();
    const ymd = (d) =>
      d.getFullYear().toString().padStart(4, "0") +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");

    // On prend J-1 à J (certaines séries sont D-1 consolidées)
    const end = ymd(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    const start = ymd(startDate);

    const params = [
      "T2M",
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

    return {
      source: "NASA POWER",
      period: { start, end },
      parameters: Object.keys(data?.properties?.parameter || {}),
      raw: data?.properties?.parameter || {},
    };
  } catch (e) {
    return { source: "NASA POWER", error: e.message };
  }
}
