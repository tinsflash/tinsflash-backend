// routes/user.js
import express from "express";
import User from "../models/User.js";
import { addLog } from "../services/logsService.js";

const router = express.Router();

/**
 * 📌 GET /api/users
 * → Récupère tous les utilisateurs
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    addLog("❌ Erreur récupération utilisateurs: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 POST /api/users
 * → Ajoute un nouvel utilisateur
 */
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    addLog(`👤 Nouvel utilisateur ajouté: ${user.email || "inconnu"}`);
    res.status(201).json(user);
  } catch (err) {
    addLog("❌ Erreur ajout utilisateur: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 DELETE /api/users/:id
 * → Supprime un utilisateur
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Utilisateur introuvable" });

    addLog(`🗑️ Utilisateur supprimé: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    addLog("❌ Erreur suppression utilisateur: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
