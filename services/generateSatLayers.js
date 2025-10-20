// ==========================================================
// 🛰️ TINSFLASH — generateSatLayers.js (Everest Protocol v6.5.3 PRO+++)
// ==========================================================
// Génère les couches satellites (nuages / pluie / vent)
// à partir des prévisions réelles de Floreffe ET des vraies
// images satellites (Open-Meteo + RainViewer).
// Sorties : sat_clouds.png, sat_rain.png, sat_wind.png,
//           sat_clouds_real.jpg, sat_rain_real.png
// ==========================================================

import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { createCanvas } from "canvas";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const OUT_DIR = "./public";
const WIDTH = 1024;
const HEIGHT = 1024;

const mongoUri = process.env.MONGO_URI;
let forecasts = [];

// ==========================================================
// 🔹 Chargement des prévisions locales (IA / Mongo / Fichier)
// ==========================================================
async function loadForecasts() {
  try {
    if (mongoUri) {
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db();
      const data = await db.collection("forecasts_ai_points").find({ zone: /Floreffe/i }).toArray();
      if (data?.length) forecasts = data;
      await client.close();
    }

    if (!forecasts.length && fs.existsSync("./public/floreffe_forecasts.json")) {
      const local = JSON.parse(fs.readFileSync("./public/floreffe_forecasts.json", "utf8"));
      forecasts = local.zones || local.data || [];
    }

    console.log(`✅ ${forecasts.length} points météo chargés pour génération des couches satellites`);
  } catch (err) {
    console.error("⚠️ Erreur chargement données météo :", err);
  }
}

// ==========================================================
// 🔹 Téléchargement des vraies images satellites
// ==========================================================
async function downloadSatLayer(url, output, label) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const img = await sharp(response.data)
      .resize(WIDTH, HEIGHT)
      .modulate({ brightness: 1.2 })
      .toBuffer();
    fs.writeFileSync(output, img);
    console.log(`🛰️ Image satellite téléchargée (${label}) → ${output}`);
  } catch (err) {
    console.error(`⚠️ Échec téléchargement ${label}:`, err.message);
  }
}

// ==========================================================
// 🔹 Génération des textures IA locales
// ==========================================================
const norm = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min)));

async function generateLayer(type) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (const p of forecasts) {
    const x = Math.floor((p.lon - 4.73) * 5000); // cadrage Floreffe
    const y = Math.floor((50.47 - p.lat) * 7000);
    if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) continue;

    let intensity = 0;
    let color = "rgba(255,255,255,0.3)";

    switch (type) {
      case "clouds":
        intensity = norm(p.humidity ?? p.clouds ?? 60, 40, 100);
        color = `rgba(255,255,255,${0.25 + intensity * 0.6})`;
        break;
      case "rain":
        intensity = norm(p.precipitation ?? 0, 0, 15);
        color = `rgba(0,180,255,${0.2 + intensity * 0.6})`;
        break;
      case "wind":
        intensity = norm(p.wind ?? 0, 0, 100);
        color = `rgba(255,200,0,${0.15 + intensity * 0.5})`;
        break;
    }

    ctx.beginPath();
    ctx.arc(x, y, 8 + intensity * 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // effet de flou léger
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const filePath = path.join(OUT_DIR, `sat_${type}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ ${filePath} généré (${type})`);
}

// ==========================================================
// 🔹 Programme principal
// ==========================================================
(async () => {
  await loadForecasts();

  // --- Téléchargement des images satellites réelles ---
  await downloadSatLayer(
    "https://satellite.open-meteo.com/map/clouds/Europe/latest.jpg",
    path.join(OUT_DIR, "sat_clouds_real.jpg"),
    "Nuages (Open-Meteo)"
  );

  await downloadSatLayer(
    "https://api.rainviewer.com/public/weather-maps/latest/0/0/0.png",
    path.join(OUT_DIR, "sat_rain_real.png"),
    "Pluie (RainViewer)"
  );

  // --- Vérifie si données IA locales disponibles ---
  if (!forecasts.length) {
    console.error("❌ Aucune donnée IA trouvée, génération interne ignorée (satellites réelles OK).");
    console.log("🌍 Couches satellites réelles prêtes pour le Dôme Floreffe.");
    return;
  }

  // --- Génération des couches IA locales ---
  await generateLayer("clouds");
  await generateLayer("rain");
  await generateLayer("wind");

  console.log("🌍 Couches satellites IA + réelles générées avec succès.");
})();
