// ==========================================================
// 🌍 generateFloreffeAltitudes_HR.js — Relief réel Floreffe (haute résolution 50 m)
// ==========================================================
// 🔸 Couverture : totalité de la commune (Franière → Floriffoux → Bois de Floreffe)
// 🔸 Source : Open-Elevation (réel, gratuit)
// 🔸 Sortie : /public/floreffe_altitudes_hr.json
// 🔸 Sécurisé contre erreurs 429 + sauvegardes partielles
// ==========================================================

import fs from "fs";
import fetch from "node-fetch";

const startLat = 50.43;   // sud (Franière)
const endLat   = 50.46;   // nord (Bois de Floreffe)
const startLon = 4.73;    // ouest
const endLon   = 4.78;    // est
const step     = 0.0005;  // ≈ 50 m
const OUT = "./public/floreffe_altitudes_hr.json";
const TEMP = "./public/floreffe_altitudes_hr_temp.json";

let points = [];
if (fs.existsSync(TEMP)) {
  try {
    points = JSON.parse(fs.readFileSync(TEMP, "utf8"));
    console.log(`🧩 Reprise sur base temporaire (${points.length} points déjà générés)`);
  } catch {}
}

// petite pause utilitaire
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// fetch altitude avec relance automatique si HTTP 429
async function fetchAltitude(lat, lon, retry = 0) {
  try {
    const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    if (!res.ok) {
      if (res.status === 429 && retry < 5) {
        const wait = 1500 + Math.random() * 1000;
        console.warn(`⏳ HTTP 429 → pause ${wait.toFixed(0)} ms (tentative ${retry+1})`);
        await sleep(wait);
        return fetchAltitude(lat, lon, retry + 1);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.results?.[0]?.elevation ?? null;
  } catch (err) {
    console.warn(`⚠️ ${lat.toFixed(4)}, ${lon.toFixed(4)} → ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("📡 Génération du relief HR (50 m pas) – Floreffe…");

  let count = 0;
  for (let lat = startLat; lat <= endLat; lat += step) {
    for (let lon = startLon; lon <= endLon; lon += step) {
      const exists = points.find(p => Math.abs(p.lat - lat) < 1e-6 && Math.abs(p.lon - lon) < 1e-6);
      if (exists) continue; // déjà calculé
      const alt = await fetchAltitude(lat, lon);
      if (alt !== null) {
        points.push({ lat, lon, alt });
        console.log(`✅ ${lat.toFixed(4)} , ${lon.toFixed(4)} → ${alt.toFixed(1)} m`);
      }
      count++;

      // sauvegarde toutes les 50 requêtes
      if (count % 50 === 0) {
        fs.writeFileSync(TEMP, JSON.stringify(points, null, 2));
        console.log(`💾 Sauvegarde partielle (${points.length} points)…`);
      }

      // tempo de base pour éviter surcharge API
      await sleep(300);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(points, null, 2));
  fs.rmSync(TEMP, { force: true });

  console.log(`\n✅ Relief HR Floreffe généré avec succès (${points.length} points)`);
  console.log(`📁 Fichier final : ${OUT}`);
}

main();
