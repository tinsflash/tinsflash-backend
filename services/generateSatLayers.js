// ==========================================================
// 🛰️ TINSFLASH — generateSatLayers.js
// ==========================================================
// Génère les couches satellites (nuages / pluie / vent)
// à partir des prévisions réelles Floreffe
// ==========================================================

import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const OUT_DIR = "./public";
const WIDTH = 1024;
const HEIGHT = 1024;

// Connexion Mongo si disponible
const mongoUri = process.env.MONGO_URI;
let forecasts = [];

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

// Utilitaire de normalisation
const norm = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min)));

// === Génération texture ===
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

  // effet léger de flou
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const filePath = path.join(OUT_DIR, `sat_${type}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ ${filePath} généré (${type})`);
}

// === MAIN ===
(async () => {
  await loadForecasts();
  if (!forecasts.length) {
    console.error("❌ Aucune donnée météo trouvée, abandon.");
    return;
  }
  await generateLayer("clouds");
  await generateLayer("rain");
  await generateLayer("wind");
  console.log("🌍 Couches satellites générées avec succès.");
})();
