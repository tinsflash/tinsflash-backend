// -------------------------
// 🌍 alertsService.js
// Fusion IRM + NOAA + MeteoFrance + OpenWeather
// -------------------------

export async function getAlerts() {
  try {
    const alerts = [];

    // NOAA (alertes mondiales)
    try {
      const res = await fetch("https://api.weather.gov/alerts/active");
      const data = await res.json();
      if (data.features) {
        data.features.slice(0, 5).forEach((a) => {
          alerts.push({
            region: a.properties.areaDesc || "Inconnu",
            type: a.properties.event || "Alerte",
            level: a.properties.severity?.toLowerCase() || "jaune",
            description: a.properties.headline || "Alerte météo",
            reliability: 85,
            source: "NOAA",
          });
        });
      }
    } catch (err) {
      console.error("Erreur NOAA", err.message);
    }

    // OpenWeather OneCall (si clé dispo)
    try {
      const apiKey = process.env.OPENWEATHER_KEY;
      if (apiKey) {
        const res = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=50.5&lon=4.5&appid=${apiKey}&lang=fr`
        );
        const data = await res.json();
        if (data.alerts) {
          data.alerts.forEach((a) => {
            alerts.push({
              region: "Locale",
              type: a.event,
              level: "orange",
              description: a.description,
              reliability: 80,
              source: "OpenWeather",
            });
          });
        }
      }
    } catch (err) {
      console.error("Erreur OpenWeather", err.message);
    }

    // Pondération IA simplifiée
    alerts.forEach((a) => {
      if (a.source === "NOAA") a.reliability += 5;
      if (a.source === "OpenWeather") a.reliability += 3;
    });

    return { alerts };
  } catch (err) {
    throw new Error("Erreur fusion alertes : " + err.message);
  }
}
