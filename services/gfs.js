// services/gfs.js
import { fetchMeteomatics } from "../utils/meteomatics.js";

export default async function gfs(lat, lon) {
  const params = ["t_2m:C", "precip_1h:mm", "wind_speed_10m:ms"];
  const data = await fetchMeteomatics(params, lat, lon, "gfs");

  if (!data) return { source: "GFS (Meteomatics)", error: "Pas de données" };

  return {
    source: "GFS (Meteomatics)",
    temperature: data["t_2m:C"] || [],
    precipitation: data["precip_1h:mm"] || [],
    wind: data["wind_speed_10m:ms"] || []
  };
}
