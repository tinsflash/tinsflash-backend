import fetch from "node-fetch";

async function detectSeasonalAnomaly(lat, lon, forecast) {
  try {
    console.log("🌍 Vérification anomalies saisonnières (Copernicus ERA5)");

    const start = new Date();
    start.setDate(start.getDate() - 30);
    const end = new Date();

    const url = `https://cds.climate.copernicus.eu/api/v2/era5?lat=${lat}&lon=${lon}&start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}&variable=temperature_2m`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.CDSAPI_UID + ":" + process.env.CDSAPI_KEY).toString("base64")}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Copernicus ERA5 API error: ${res.statusText}`);
    }

    const data = await res.json();

    const temps = data.values || [];
    if (!temps.length) return null;

    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const diff = forecast.temperature - avg;

    if (Math.abs(diff) > 5) {
      return {
        type: "temperature",
        message: `🌡️ Anomalie détectée: ${diff > 0 ? "plus chaud" : "plus froid"} que la normale (${diff.toFixed(1)}°C)`,
        severity: Math.abs(diff) > 8 ? "high" : "moderate",
      };
    }

    return null;
  } catch (err) {
    console.error("❌ Erreur anomalies saisonnières:", err.message);
    return null;
  }
}

export default { detectSeasonalAnomaly };
