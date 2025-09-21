import axios from "axios";

export default async function wetterzentrale(location, options = {}) {
  const { lat, lon } = location;

  try {
    const response = await axios.get("https://api.open-meteo.com/v1/gfs", {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,precipitation,wind_speed_10m",
        forecast_days: 1,
        timezone: "auto"
      }
    });

    const data = response.data;

    return {
      temperature: data.hourly.temperature_2m[0],
      precipitation: data.hourly.precipitation[0],
      wind: data.hourly.wind_speed_10m[0],
      source: "Wetterzentrale (via GFS API réelle)"
    };
  } catch (error) {
    console.error("Erreur Wetterzentrale:", error.message);
    throw new Error("Impossible de récupérer les données Wetterzentrale");
  }
}
