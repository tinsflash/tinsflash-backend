// -------------------------
// 🌍 radarService.js
// Radar pluie, neige, vent, satellite
// -------------------------
export async function getRadarLayers() {
  try {
    const apiKey = process.env.OPENWEATHER_KEY;
    if (!apiKey) throw new Error("Clé OPENWEATHER_KEY manquante");

    return {
      precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      snow: `https://tile.openweathermap.org/map/snow_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      satellite: `https://tiles.eumetsat.int/wms-v1/satellite/infrared/{z}/{x}/{y}.png`,
    };
  } catch (err) {
    throw new Error("Erreur radar : " + err.message);
  }
}
