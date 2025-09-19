// -------------------------
// 🌍 radarService.js
// Radar pluie/neige/vent/satellite
// -------------------------
export async function getRadarLayers() {
  const apiKey = process.env.OPENWEATHER_KEY;
  return {
    baseMap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    snow: `https://tile.openweathermap.org/map/snow_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    radarTiles: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
    radarTimestamps: "https://api.rainviewer.com/public/maps.json",
    satellite: "https://tiles.eumetsat.int/wms-v1/satellite/infrared/{z}/{x}/{y}.png"
  };
}
