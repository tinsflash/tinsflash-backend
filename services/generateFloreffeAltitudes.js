// ==========================================================
// 🗺️ generateFloreffeAltitudes.js — Relief réel NGI Belgique
// ==========================================================
import fs from "fs";
import axios from "axios";

const startLat = 50.43, endLat = 50.46;
const startLon = 4.73, endLon = 4.78;
const step = 0.001; // ≈ 100 m
const points = [];

async function main() {
  console.log("📡 Téléchargement des altitudes NGI pour Floreffe...");
  for (let lat = startLat; lat <= endLat; lat += step) {
    for (let lon = startLon; lon <= endLon; lon += step) {
      try {
        const url = `https://api.ngi.be/elevation/v1/lookup?lon=${lon}&lat=${lat}`;
        const res = await axios.get(url, { timeout: 10000 });
        const alt = res.data?.[0]?.elevation ?? null;
        if (alt !== null) points.push({ lat, lon, alt });
      } catch (e) {
        console.warn("⚠️ NGI indisponible", lat, lon);
      }
      await new Promise(r => setTimeout(r, 150)); // éviter le rate-limit
    }
  }
  fs.writeFileSync("./public/floreffe_altitudes.json", JSON.stringify(points, null, 2));
  console.log(`✅ Relief Floreffe généré (${points.length} points)`);
}

main();
