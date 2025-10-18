// ==========================================================
// 🌩️ visionAlerts.js — Analyse IA des captures VisionIA (TINSFLASH PRO+++)
// ==========================================================
// 🔸 Objectif : détecter automatiquement des phénomènes météorologiques
//     à partir des images satellites VisionIA (IR, Natural, Airmass, etc.)
// 🔸 Résultats : insertion dans MongoDB (collection `alerts_vision`)
// 🔸 Déclenchement : via bouton dans admin-pp.html (route /api/runVisionAlerts)
// ==========================================================

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { MongoClient } from "mongodb";
import { addEngineLog, addEngineError } from "./engineState.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const visionFolder = path.resolve("./public/vision");

// ==========================================================
// 🧠 Fonction principale — Analyse IA des captures VisionIA
// ==========================================================
export async function runVisionAlerts() {
  const mongo = new MongoClient(process.env.MONGO_URI);
  await mongo.connect();
  const db = mongo.db("tinsflash");

  try {
    await addEngineLog("🛰️ [VisionIA] Lancement de l’analyse IA des captures PNG", "info", "visionIA");

    // Liste des fichiers PNG récents
    const files = fs.readdirSync(visionFolder).filter(f => f.endsWith(".png"));
    if (!files.length) {
      await addEngineLog("⚠️ [VisionIA] Aucun fichier PNG trouvé dans /public/vision", "warn", "visionIA");
      await mongo.close();
      return { success: false, message: "Aucune capture trouvée" };
    }

    // On limite l’analyse aux 10 plus récentes
    const latestFiles = files
      .map(f => ({ name: f, time: fs.statSync(path.join(visionFolder, f)).mtime }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
      .map(f => f.name);

    const alerts = [];

    for (const file of latestFiles) {
      const imgPath = path.join(visionFolder, file);
      const prompt = `
Tu es J.E.A.N., l’IA météo VisionIA du moteur TINSFLASH PRO+++.
Analyse cette image satellite (fichier ${file}) et indique si tu détectes un phénomène météorologique important :
- orage, tempête, rafales, cyclone, neige, verglas, pluie intense, brouillard, brume, front chaud/froid, etc.
Réponds STRICTEMENT en JSON pur, format :
[
  {
    "type": "orage",
    "intensité": "forte",
    "zone": "Europe Ouest",
    "confiance": 0.88,
    "description": "Cellule orageuse active visible au centre-ouest"
  }
]
S’il n’y a rien à signaler, retourne simplement [].
      `;

      try {
        const res = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            { role: "system", content: "Tu es une IA météo experte en analyse satellitaire VisionIA." },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: `file://${imgPath}` }
              ]
            }
          ],
          temperature: 0.5
        });

        let parsed = [];
        try {
          parsed = JSON.parse(res.choices?.[0]?.message?.content || "[]");
        } catch (e) {
          await addEngineError(`[VisionIA] Erreur JSON (${file}): ${e.message}`, "visionIA");
        }

        for (const a of parsed) {
          alerts.push({
            source: "VisionIA",
            image: file,
            type: a.type,
            intensite: a.intensité,
            zone: a.zone || "non précisée",
            confiance: a.confiance ?? 0.8,
            description: a.description || "",
            statut: "à valider",
            created_at: new Date()
          });
        }
      } catch (err) {
        await addEngineError(`[VisionIA] Erreur analyse image ${file} : ${err.message}`, "visionIA");
      }
    }

    // 💾 Enregistrement dans Mongo
    if (alerts.length) {
      await db.collection("alerts_vision").deleteMany({});
      await db.collection("alerts_vision").insertMany(alerts);
      await addEngineLog(`✅ [VisionIA] ${alerts.length} alertes détectées et stockées`, "success", "visionIA");
    } else {
      await addEngineLog("ℹ️ [VisionIA] Aucune alerte détectée sur les dernières images", "info", "visionIA");
    }

    await mongo.close();
    return { success: true, count: alerts.length };
  } catch (err) {
    await addEngineError(`💥 Erreur globale VisionIA : ${err.message}`, "visionIA");
    return { success: false, error: err.message };
  }
}
