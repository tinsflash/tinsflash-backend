// services/sourcesFreshness.js
import fetch from "node-fetch";
import { addLog } from "./engineState.js";

export async function checkSourcesFreshness() {
  const results = [];

  try {
    // GFS (NOAA)
    const gfsUrl = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/";
    const gfsRes = await fetch(gfsUrl);
    if (gfsRes.ok) {
      results.push({
        name: "GFS (NOAA)",
        cycleId: extractCycleId(await gfsRes.text()), // fonction parse HTML dir
        status: "ok",
        source: gfsUrl,
      });
    } else results.push({ name: "GFS (NOAA)", status: "ko" });
  } catch (e) {
    results.push({ name: "GFS (NOAA)", status: "ko", error: e.message });
  }

  try {
    // ECMWF (Copernicus API)
    const ecmwfUrl = "https://cds.climate.copernicus.eu/api/v2/resources";
    const ecmwfRes = await fetch(ecmwfUrl);
    results.push({
      name: "ECMWF",
      status: ecmwfRes.ok ? "ok" : "ko",
      source: ecmwfUrl,
    });
  } catch (e) {
    results.push({ name: "ECMWF", status: "ko", error: e.message });
  }

  try {
    // ICON (DWD)
    const iconUrl = "https://opendata.dwd.de/weather/nwp/icon/";
    const iconRes = await fetch(iconUrl);
    results.push({
      name: "ICON (DWD)",
      status: iconRes.ok ? "ok" : "ko",
      source: iconUrl,
    });
  } catch (e) {
    results.push({ name: "ICON (DWD)", status: "ko", error: e.message });
  }

  try {
    // Meteomatics
    const meteomaticsUrl = "https://api.meteomatics.com/latest?model=mix";
    const meteomaticsRes = await fetch(meteomaticsUrl, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.METEOMATICS_USER + ":" + process.env.METEOMATICS_PASS
          ).toString("base64"),
      },
    });
    results.push({
      name: "Meteomatics API",
      status: meteomaticsRes.ok ? "ok" : "ko",
      source: meteomaticsUrl,
    });
  } catch (e) {
    results.push({ name: "Meteomatics API", status: "ko", error: e.message });
  }

  addLog(`Freshness check effectué : ${results.length} sources scannées`, "info");
  return results;
}

// petit parseur pour extraire le dernier cycle GFS dispo
function extractCycleId(html) {
  const match = html.match(/gfs\.(\d{8})\/(\d{2})/);
  if (match) return `${match[2]}z (${match[1]})`;
  return "inconnu";
}
