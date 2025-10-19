// ==========================================================
// 🌍 exportPublicForecasts.js — Export public Floreffe vers /public/
// ==========================================================
// 🔸 Lit les données de floreffe_phase2 (IA J.E.A.N.)
// 🔸 Fusionne avec les métadonnées de forecasts si dispo
// 🔸 Écrit les fichiers :
//     - /public/floreffe_forecasts.json
//     - /public/floreffe_alerts.json (si dispo)
// ==========================================================

import fs from "fs";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function exportPublicForecasts(commune = "Floreffe") {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    console.log(`📡 Connexion MongoDB...`);
    await client.connect();
    const db = client.db("tinsflash");

    console.log(`📚 Lecture des données IA pour ${commune}...`);
    const phase2 = await db.collection("floreffe_phase2").find({}).toArray();
    const alerts = await db.collection("alerts_detecteds").find({ zone: /Floreffe/i }).toArray();

    if (!phase2.length) {
      console.warn(`⚠️ Aucune donnée trouvée pour ${commune} (phase2)`);
      return;
    }

    const simplified = phase2.map((p) => ({
      zone: p.zone || "Zone inconnue",
      lat: p.lat,
      lon: p.lon,
      temperature: p.temperature ?? null,
      pluie: p.pluie ?? null,
      vent: p.vent ?? null,
      humidite: p.humidite ?? null,
      altitude: p.altitude ?? null,
      fiabilite: p.fiabilite ?? null,
      date: p.date || new Date().toISOString(),
    }));

    const publicDir = path.resolve(__dirname, "../public");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

    const forecastPath = `${publicDir}/floreffe_forecasts.json`;
    const alertsPath = `${publicDir}/floreffe_alerts.json`;

    fs.writeFileSync(forecastPath, JSON.stringify(simplified, null, 2));
    console.log(`✅ Export public créé : ${forecastPath} (${simplified.length} entrées)`);

    fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
    console.log(`✅ Export alertes créé : ${alertsPath} (${alerts.length} alertes)`);

    console.log(`🎯 Export complet pour ${commune} terminé avec succès.`);
  } catch (err) {
    console.error(`❌ Erreur export public : ${err.message}`);
  } finally {
    await client.close();
  }
}

// Pour lancer manuellement :
// node -e "import('./services/exportPublicForecasts.js').then(m => m.default('Floreffe'))"
