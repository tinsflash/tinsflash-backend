// -------------------------
// 🌍 nasaSat.js
// Images satellites NASA / NOAA
// -------------------------
export async function getNasaSatData(lat, lon) {
  try {
    const url = "https://api.satellite.imagery.nasa.gov"; // (exemple, adapter selon endpoint)
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible d’accéder aux données NASA");

    const data = await res.json();
    return {
      source: "NASA",
      temperature: null,
      wind: null,
      precipitation: null,
      notes: "Imagerie satellite brute",
      raw: data
    };
  } catch (err) {
    return { error: err.message };
  }
}
