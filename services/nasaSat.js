// services/nasaSat.js
import axios from "axios";

/**
 * Récupère données satellites NASA POWER
 * @param {number} lat
 * @param {number} lon
 */
async function nasaSat(lat, lon) {
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOT,WS2M&community=RE&longitude=${lon}&latitude=${lat}&start=20240101&end=20240107&format=JSON`;

    const res = await axios.get(url);
    const data = res.data?.properties?.parameter;

    if (!data) throw new Error("Données NASA indisponibles");

    return {
      source: "NASA POWER",
      temperature: data.T2M,
      precipitation: data.PRECTOT,
      wind: data.WS2M,
    };
  } catch (err) {
    console.error("❌ Erreur NASA POWER:", err.message);
    return null;
  }
}

export default nasaSat;
