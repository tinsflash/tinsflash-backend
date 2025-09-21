// services/ecmwf.js
import { fetchMeteomatics } from "../services/meteomatics.js";

export default async function ecmwf(lat, lon) {
  const params = ["t_2m:C", "precip_1h:mm", "wind_speed_10m:ms"];
  const data = await fetchMeteomatics(params, lat, lon, "ecmwf-ifs");

  if (!data) return { source: "ECMWF (Meteomatics)", error: "Pas de données" };

  return {
    source: "ECMWF (Meteomatics)",
    temperature: data["t_2m:C"] || [],
    precipitation: data["precip_1h:mm"] || [],
    wind: data["wind_speed_10m:ms"] || []
  };
}
