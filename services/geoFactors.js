import fetch from "node-fetch";

async function applyGeoFactors(forecast, lat, lon) {
  try {
    console.log("⛰ Application facteurs géographiques");

    // Altitude via Open-Elevation
    const elevRes = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    const elevData = await elevRes.json();
    const elevation = elevData.results?.[0]?.elevation || 0;

    if (elevation > 500) {
      forecast.temperature -= Math.round(elevation / 200); // correction montagne
      forecast.description += " (influence montagne)";
    }

    // Proximité mer → simple check longitude/latitude (optionnel: API bathymétrie)
    if (lon > -5 && lon < 10 && lat > 40 && lat < 52) {
      forecast.temperature += 1; // effet tempérant mer
      forecast.description += " (influence maritime)";
    }

    return forecast;
  } catch (err) {
    console.error("❌ Erreur geoFactors:", err.message);
    return forecast;
  }
}

export default { applyGeoFactors };
