// services/alertsService.js
import express from "express";
import Alert from "../models/Alert.js";

const router = express.Router();

// ================================
// 🚨 Gestion des alertes météo
// ================================

// Toutes les alertes
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Erreur alertsService:", err.message);
    res.status(500).json({ error: "Erreur lors du chargement des alertes" });
  }
});

// Nouvelle alerte
router.post("/", async (req, res) => {
  try {
    const newAlert = new Alert(req.body);
    await newAlert.save();
    res.json(newAlert);
  } catch (err) {
    console.error("❌ Erreur création alerte:", err.message);
    res.status(500).json({ error: "Erreur lors de la création de l'alerte" });
  }
});

// Supprimer une alerte
router.delete("/:id", async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur suppression alerte:", err.message);
    res.status(500).json({ error: "Erreur lors de la suppression de l'alerte" });
  }
});

export default router;
