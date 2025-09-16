const axios = require("axios");

async function getForecast(lat, lon) {
  try {
    // OpenWeather (clé dans .env → process.env.SATELLITE_API)
    const ow = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.SATELLITE_API}&units=metric&lang=fr`
    );

    // GFS (gratuit NOAA → JSON brut)
    // (ici, un exemple simplifié – dans la vraie version tu parse GRIB/NetCDF)
    const gfs = {}; // TODO: parser GFS data
    const icon = {}; // TODO: parser ICON DWD

    // Fusion simplifiée → moyenne + pondération
    const forecast = ow.data.list.map((f) => ({
      ts: f.dt,
      temp: f.main.temp,
      wind: f.wind.speed,
      rain: f.rain ? f.rain["3h"] : 0,
      clouds: f.clouds.all,
      source: "fusion",
      reliability: 0.85, // pondération IA
    }));

    return forecast;
  } catch (err) {
    console.error("Forecast error:", err);
    return [];
  }
}

module.exports = { getForecast };

