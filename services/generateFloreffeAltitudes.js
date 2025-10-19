// ==========================================================
// 🌍 generateFloreffeAltitudes.js — Relief réel Floreffe (Open-Elevation)
// ==========================================================
// 🔸 Génère un maillage altimétrique réaliste de la commune de Floreffe
// 🔸 Source : https://api.open-elevation.com (gratuite, sans clé)
// 🔸 Sortie : /public/floreffe_altitudes.json
// ==========================================================

import fs from "fs";

// Zone géographique Floreffe (Belgique)
const startLat = 50.43;
const endLat = 50.46;
const startLon = 4.73;
const endLon = 4.78;
const step = 0.001; // ≈ 100 m

const points = [];

async function main() {
  console.log("📡 Téléchargement des altitudes Open-Elevation pour Floreffe...");

  for (let lat = startLat; lat <= endLat; lat += step) {
    for (let lon = startLon; lon <= endLon; lon += step) {
      try {
        // --- Appel à Open-Elevation
        const res = await fetch(
          `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const alt = json.results?.[0]?.elevation ?? null;

        if (alt !== null) {
          console.log(`✅ Altitude ${lat.toFixed(4)} ${lon.toFixed(4)} = ${alt.toFixed(1)} m`);
          points.push({ lat, lon, alt });
        } else {
          console.warn(`⚠️ Pas de donnée pour ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }

        // Pause pour ne pas saturer le service (5 requêtes/s max)
        await sleep(200);

      } catch (e) {
        console.error(`❌ Erreur Open-Elevation ${lat.toFixed(4)}, ${lon.toFixed(4)} → ${e.message}`);
      }
    }
  }

  // --- Sauvegarde du fichier
  fs.writeFileSync(
    "./public/floreffe_altitudes.json",
    JSON.stringify(points, null, 2)
  );

  console.log(`\n✅ Relief Floreffe généré (${points.length} points)`);  
  console.log("📁 Fichier : /public/floreffe_altitudes.json");
}

// Petite temporisation entre les requêtes
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main();
