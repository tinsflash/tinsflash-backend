// PATH: routes/alerts.js
// 🌋 Alerte automatique + gestion complète des alertes TINSFLASH
// Fusion de ta version Express avec la logique nucléaire complète

import express from "express";
import Alert from "../models/Alert.js";
import { getFusionWeather } from "../utils/fusion.js";
import { detectAlerts } from "../services/alertDetector.js";
import { classifyAlerts } from "../services/alertsEngine.js";
import { askOpenAI } from "../services/openaiService.js";
import { addEngineLog, addEngineError } from "../services/engineState.js";

const router = express.Router();

/**
 * 🌦️ GET /api/alerts
 * Alerte automatique en temps réel selon lat/lon
 * Compatible avec ton ancienne version simple
 */
router.get("/", async (req, res) => {
  try {
    const { lat, lon, region = "Zone locale", country = "?" } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ error: "Latitude et longitude obligatoires" });

    const data = await getFusionWeather(lat, lon);

    // 🔎 Détection automatique via moteur
    const detected = detectAlerts(
      { forecast: data },
      { scope: "local", country }
    );

    // Ajout règles simples héritées de ta version
    if (data.temperature > 35) {
      detected.push({
        type: "heat",
        message: "Canicule sévère détectée",
        confidence: data.reliability || 85,
        region,
        country,
      });
    }
    if (data.temperature < -10) {
      detected.push({
        type: "cold",
        message: "Vague de froid extrême",
        confidence: data.reliability || 80,
        region,
        country,
      });
    }

    // Classement selon fiabilité
    const enriched = detected.map((a) => classifyAlerts(a));

    // Sauvegarde MongoDB
    const saved = await Promise.all(
      enriched.map(async (a) => {
        const alert = new Alert({
          title: a.type,
          description: a.message,
          country,
          severity:
            a.confidence >= 90
              ? "extreme"
              : a.confidence >= 70
              ? "high"
              : "medium",
          certainty: a.confidence,
          source: "TINSFLASH Nuclear Core",
          status: "✅ Premier détecteur",
        });
        await alert.save();
        return alert;
      })
    );

    await addEngineLog(
      `🚨 ${saved.length} alertes générées à ${lat},${lon} (${region})`
    );

    res.json({
      success: true,
      alerts: saved,
    });
  } catch (error) {
    console.error("❌ Erreur /api/alerts:", error.message);
    await addEngineError("Erreur /api/alerts: " + error.message);
    res.status(500).json({ error: "Impossible de générer les alertes" });
  }
});

/**
 * 🧠 POST /api/alerts/analyze/:id
 * Analyse IA complémentaire (relief, climat, intensité)
 */
router.post("/analyze/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alerte introuvable" });

    const prompt = `
      Tu es J.E.A.N., l'IA météorologique nucléaire TINSFLASH.
      Analyse cette alerte: ${alert.title} (${alert.description})
      - Pays: ${alert.country}
      - Fiabilité: ${alert.certainty}%
      - Gravité: ${alert.severity}
      Fournis un résumé expert avec risque, intensité, causes et conséquences possibles.
    `;
    const analysis = await askOpenAI(prompt);

    alert.analysisAI = analysis;
    await alert.save();

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🧩 POST /api/alerts/:id/:action
 * Valide, rejette ou met en attente une alerte
 */
router.post("/:id/:action", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alerte introuvable" });

    const action = req.params.action;
    const valid = ["published", "toValidate", "under-surveillance"];
    if (!valid.includes(action))
      return res.status(400).json({ error: "Action invalide" });

    alert.workflow = action;
    alert.validatedBy = "admin";
    alert.validatedAt = new Date();
    await alert.save();

    await addEngineLog(`🧩 Alerte ${alert._id} changée en ${action}`);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🌐 GET /api/alerts/export/:id
 * Exporte l’alerte au format JSON pour envoi NASA / autorités
 */
router.get("/export/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alerte introuvable" });

    const payload = {
      title: alert.title,
      description: alert.description,
      country: alert.country,
      certainty: alert.certainty,
      severity: alert.severity,
      issuedAt: alert.issuedAt,
      status: alert.status,
      source: alert.source,
      contact: {
        name: "TINSFLASH Nuclear Core",
        email: "skysnapia@gmail.com",
        phone: "+32 473 26 44 77",
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alert_${alert._id}.json"`
    );
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
