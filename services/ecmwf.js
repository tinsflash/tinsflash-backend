// services/ecmwf.js
// 🌍 ECMWF : Copernicus ERA5 (prioritaire) + fallback Meteomatics

import fetch from "node-fetch";
import { fetchMeteomatics } from "../services/meteomatics.js";

const CDS_API_KEY = process.env.CDS_API_KEY;
const CDS_API_URL = process.env.CDS_API_URL || "https://cds.climate.copernicus.eu/api";

export default async function ecmwf(lat, lon) {
  // === Étape 1 : tentative Copernicus ERA5 ===
  try {
    const body = {
      dataset: "reanalysis-era5-land",
      variable: ["2m_temperature", "total_precipitation", "10m_u_component_of_wind"],
      year: new Date().getUTCFullYear(),
      month: String(new Date().getUTCMonth() + 1).padStart(2, "0"),
      day: String(new Date().getUTCDate()).padStart(2, "0"),
      time: ["00:00", "06:00", "12:00", "18:00"],
      area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25],
      format: "json",
    };

    const res = await fetch(`${CDS_API_URL}/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CDS_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        source: "ECMWF (Copernicus ERA5)",
        temperature: data?.["2m_temperature"] || [],
        precipitation: data?.["total_precipitation"] || [],
        wind: data?.["10m_u_component_of_wind"] || [],
      };
    } else {
      throw new Error(`Copernicus API HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("⚠️ Copernicus ERA5 indisponible, fallback Meteomatics:", err.message);
  }

  // === Étape 2 : fallback Meteomatics ===
  try {
    const params = ["t_2m:C", "precip_1h:mm", "wind_speed_10m:ms"];
    const data = await fetchMeteomatics(params, lat, lon, "ecmwf-ifs");

    if (!data) return { source: "ECMWF (Meteomatics)", error: "Pas de données" };

    return {
      source: "ECMWF (Meteomatics)",
      temperature: data["t_2m:C"] || [],
      precipitation: data["precip_1h:mm"] || [],
      wind: data["wind_speed_10m:ms"] || [],
    };
  } catch (err) {
    return { source: "ECMWF (Meteomatics)", error: err.message };
  }
}
