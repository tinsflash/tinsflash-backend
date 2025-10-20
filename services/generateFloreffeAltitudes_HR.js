// ==========================================================
// 🌍 generateFloreffeAltitudes_HR.js — Relief réel Floreffe (haute résolution ~50 m)
// ==========================================================
// 🔸 Couverture : totalité de la commune (Franière → Floriffoux → Bois de Floreffe)
// 🔸 Source : Open-Elevation (réel, gratuit)
// 🔸 Sortie finale : /public/floreffe_altitudes_hr.json
// 🔸 Fonctionne en reprise automatique depuis floreffe_altitudes_hr_temp.json
// ==========================================================

import fs from "fs";
import fetch from "node-fetch";

const startLat = 50.43;   // sud (Franière)
const endLat   = 50.46;   // nord (Bois de Floreffe)
const startLon = 4.73;    // ouest
const endLon   = 4.78;    // est
const step     = 0.0005;  // ≈ 50 m

const TEMP_PATH = "./public/floreffe_altitudes_hr_temp.json";
const FINAL_PATH = "./public/floreffe_altitudes_hr.json";

let points = [];

// === UTILITAIRE ===
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// === CHARGEMENT DES POINTS EXISTANTS ===
function loadExisting() {
  if (fs.existsSync(TEMP_PATH)) {
    try {
      points = JSON.parse(fs.readFileSync(TEMP_PATH, "utf8"));
      console.log(`🔁 Reprise depuis ${TEMP_PATH} (${points.length} points existants)`);
    } catch (err) {
      console.warn("⚠️ Erreur lecture fichier temporaire :", err.message);
    }
  }
}

// === SAUVEGARDE TEMPORAIRE PROGRESSIVE ===
function saveProgress() {
  fs.writeFileSync(TEMP_PATH, JSON.stringify(points, null, 2));
}

// === MAIN ===
async function main() {
  console.log("📡 Reprise ou démarrage du relief HR de Floreffe...");
  loadExisting();

  let lastLat = points.length ? points[points.length - 1].lat : startLat;
  let lastLon = points.length ? points[points.length - 1].lon : startLon;

  for (let lat = lastLat; lat <= endLat; lat += step) {
    for (let lon = (lat === lastLat ? lastLon : startLon); lon <= endLon; lon += step) {
      const exists = points.some(p => Math.abs(p.lat - lat) < 1e-6 && Math.abs(p.lon - lon) < 1e-6);
      if (exists) continue;

      try {
        const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const alt = json.results?.[0]?.elevation ?? null;

        if (alt !== null) {
          points.push({ lat, lon, alt });
          console.log(`✅ ${lat.toFixed(4)} , ${lon.toFixed(4)} → ${alt.toFixed(1)} m`);
        } else {
          console.warn(`⚠️ Aucune donnée ${lat.toFixed(4)} , ${lon.toFixed(4)}`);
        }

        if (points.length % 100 === 0) saveProgress();
        await sleep(200); // temporisation pour éviter HTTP 429
      } catch (err) {
        console.error(`❌ Erreur ${lat.toFixed(4)}, ${lon.toFixed(4)} → ${err.message}`);
        if (err.message.includes("429")) await sleep(15000); // pause longue si surcharge API
      }
    }
  }

  // Sauvegarde finale
  fs.writeFileSync(FINAL_PATH, JSON.stringify(points, null, 2));
  fs.rmSync(TEMP_PATH, { force: true });
  console.log(`\n✅ Relief HR complet généré (${points.length} points)`);
  console.log(`📁 Fichier final : ${FINAL_PATH}`);
}

main();
