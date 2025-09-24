// routes/admin.js
import express from "express";
import forecastService from "../services/forecastService.js";
import Alert from "../models/Alert.js";

const router = express.Router();

//
// ===============================
// 📌 Prévisions nationales
// ===============================
// Lire la dernière prévision nationale
router.get("/forecasts/latest/:country", async (req, res) => {
  try {
    const forecast = await forecastService.getLatestForecast(req.params.country);
    if (!forecast) {
      return res.status(404).json({ error: "Pas de prévision trouvée" });
    }
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ===============================
// 📌 Alertes météo (centrale nucléaire IA mondiale)
// ===============================
// ➡️ Récupérer toutes les alertes récentes (dernières 50)
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➡️ Créer une nouvelle alerte (IA J.E.A.N. ou admin)
router.post("/alerts", async (req, res) => {
  try {
    const { type, level, certainty, description, location } = req.body;

    if (!type || !level || !certainty) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const alert = new Alert({
      type,
      level,
      certainty,
      description,
      location
    });

    await alert.save();
    console.log(`✅ Nouvelle alerte créée : ${type} ${level} (${certainty}%)`);
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➡️ Supprimer une alerte
router.delete("/alerts/:id", async (req, res) => {
  try {
    const result = await Alert.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Alerte non trouvée" });
    }
    console.log(`🗑️ Alerte supprimée (${req.params.id})`);
    res.json({ message: "Alerte supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➡️ Mettre à jour / corriger une alerte
router.put("/alerts/:id", async (req, res) => {
  try {
    const { type, level, certainty, description, location } = req.body;

    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      { type, level, certainty, description, location },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Alerte non trouvée" });
    }

    console.log(`✏️ Alerte corrigée (${req.params.id})`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
