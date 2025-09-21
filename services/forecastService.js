// services/forecastService.js

async function getLocalForecast(lat, lon) {
  try {
    return {
      description: "Prévisions locales en cours",
      temperature: 22,
      temperature_min: 18,
      temperature_max: 25,
      wind: 12,
      precipitation: 0,
      reliability: 85,
      anomaly: null
    };
  } catch (err) {
    console.error("❌ LocalForecast error:", err.message);
    return null;
  }
}

async function getNationalForecast(country) {
  try {
    return {
      description: `Prévisions nationales pour ${country}`,
      temperature: 20,
      temperature_min: 15,
      temperature_max: 24,
      wind: 15,
      precipitation: 2,
      reliability: 78,
      anomaly: null
    };
  } catch (err) {
    console.error("❌ NationalForecast error:", err.message);
    return null;
  }
}

async function get7DayForecast(lat, lon) {
  try {
    const days = Array.from({ length: 7 }, (_, i) => ({
      jour: `Jour ${i + 1}`,
      description: "Variable",
      temperature_min: 15 + i,
      temperature_max: 20 + i,
      vent: 10 + i,
      precipitation: 2 * i,
      fiabilité: 70 + i,
      anomalie: i % 2 === 0 ? "Aucune" : "Légère instabilité"
    }));
    return { days };
  } catch (err) {
    console.error("❌ 7DayForecast error:", err.message);
    return { days: [] };
  }
}

export default { getLocalForecast, getNationalForecast, get7DayForecast };
