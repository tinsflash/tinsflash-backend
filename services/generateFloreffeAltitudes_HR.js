// ==========================================================
// 🌍 TINSFLASH – generateFloreffeAltitudes_HR.js (Render-ready)
// ==========================================================
// 🔸 Couverture : commune complète (Franière → Floriffoux → Bois de Floreffe)
// 🔸 Résolution : ≈ 50 m
// 🔸 Source : Open-Elevation (API publique, gratuite)
// 🔸 Sortie : /public/floreffe_altitudes_hr.json + /public/floreffe_altitudes_log.txt
// ==========================================================

import fs from "fs";
import fetch from "node-fetch";

const startLat = 50.43;   // sud (Franière)
const endLat   = 50.46;   // nord (Bois de Floreffe)
const startLon = 4.73;    // ouest
const endLon   = 4.78;    // est
const step     = 0.0005;  // ≈ 50 m

const TEMP_PATH  = "./public/floreffe_altitudes_hr_temp.json";
const FINAL_PATH = "./public/floreffe_altitudes_hr.json";
const LOG_PATH   = "./public/floreffe_altitudes_log.txt";

let points = [];

// === Utilitaires ===
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function logLine(line) {
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

// === Chargement existant ===
function loadExisting() {
  if (fs.existsSync(TEMP_PATH)) {
    try {
      points = JSON.parse(fs.readFileSync(TEMP_PATH, "utf8"));
      logLine(`🔁 Reprise depuis ${TEMP_PATH} (${points.length} points existants)`);
    } catch (err) {
      logLine(`⚠️ Erreur lecture fichier temporaire : ${err.message}`);
    }
  }
}

// === Sauvegarde progressive ===
function saveProgress() {
  fs.writeFileSync(TEMP_PATH, JSON.stringify(points, null, 2));
  logLine(`💾 Sauvegarde intermédiaire : ${points.length} points`);
}

// === MAIN ===
async function main() {
  fs.writeFileSync(LOG_PATH, "📡 Génération relief HR Floreffe – début du processus\n");
  logLine("-------------------------------------------------------------");
  logLine(`Zone : lat ${startLat}-${endLat} | lon ${startLon}-${endLon}`);
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
          logLine(`✅ ${lat.toFixed(5)}, ${lon.toFixed(5)} → ${alt.toFixed(1)} m`);
        } else {
          logLine(`⚠️ Aucune donnée ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }

        if (points.length % 100 === 0) saveProgress();
        await sleep(1200); // tempo 1,2s pour éviter 429
      } catch (err) {
        logLine(`❌ Erreur ${lat.toFixed(5)}, ${lon.toFixed(5)} → ${err.message}`);
        if (err.message.includes("429")) {
          logLine("⏳ Pause longue (API saturée)...");
          await sleep(15000);
        }
      }
    }
  }

  // Sauvegarde finale
  fs.writeFileSync(FINAL_PATH, JSON.stringify(points, null, 2));
  fs.rmSync(TEMP_PATH, { force: true });
  logLine(`\n✅ Relief HR complet généré (${points.length} points)`);
  logLine(`📁 Fichier final : ${FINAL_PATH}`);
  logLine(`🌐 Accessible via : /floreffe_altitudes_hr.json et /floreffe_altitudes_log.txt`);
  logLine("-------------------------------------------------------------\n");
}

main();
