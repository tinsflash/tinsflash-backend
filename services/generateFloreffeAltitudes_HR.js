// ==========================================================
// 🌍 generateFloreffeAltitudes_HR.js — Relief réel Floreffe (haute résolution 50 m)
// ==========================================================
// 🔸 Couverture : totalité de la commune (Franière → Floriffoux → Bois de Floreffe)
// 🔸 Source : Open-Elevation (réel, gratuit)
// 🔸 Sortie : /public/floreffe_altitudes_hr.json
// ==========================================================

import fs from "fs";

const startLat = 50.43;   // sud (Franière)
const endLat   = 50.46;   // nord (Bois de Floreffe)
const startLon = 4.73;    // ouest
const endLon   = 4.78;    // est
const step     = 0.0005;  // ≈ 50 m

const points = [];

async function main() {
  console.log("📡 Génération du relief haute résolution de Floreffe (≈ 50 m pas)...");

  let count = 0;
  for (let lat = startLat; lat <= endLat; lat += step) {
    for (let lon = startLon; lon <= endLon; lon += step) {
      try {
        const res = await fetch(
          `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const alt = json.results?.[0]?.elevation ?? null;

        if (alt !== null) {
          points.push({ lat, lon, alt });
          console.log(`✅ ${lat.toFixed(4)} , ${lon.toFixed(4)} → ${alt.toFixed(1)} m`);
        } else {
          console.warn(`⚠️ Pas de donnée ${lat.toFixed(4)} , ${lon.toFixed(4)}`);
        }

        // tempo pour ne pas saturer l’API (5 req/s max)
        await sleep(180);
        count++;
      } catch (err) {
        console.error(`❌ Erreur ${lat.toFixed(4)}, ${lon.toFixed(4)} → ${err.message}`);
      }
    }
  }

  fs.writeFileSync(
    "./public/floreffe_altitudes_hr.json",
    JSON.stringify(points, null, 2)
  );

  console.log(`\n✅ Relief haute résolution Floreffe généré (${points.length} points)`);
  console.log("📁 Fichier : /public/floreffe_altitudes_hr.json");
}

// tempo utilitaire
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main();
