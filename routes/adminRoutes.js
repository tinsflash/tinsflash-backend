// routes/adminRoutes.js
import express from "express";
import Log from "../models/Log.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * Récupérer les logs (les plus récents en premier)
 */
router.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs.map(l => `[${l.createdAt.toISOString()}] ${l.message}`));
  } catch (err) {
    console.error("❌ Erreur /api/admin/logs:", err.message);
    res.status(500).json({ error: "Erreur récupération logs" });
  }
});

/**
 * Récupérer les stats utilisateurs
 * - Catégories : Free, Premium, Pro, Pro+
 * - Zones : couvertes vs non couvertes
 */
router.get("/users", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: { type: "$type", zone: "$zone" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          zone: "$_id.zone",
          count: 1
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error("❌ Erreur /api/admin/users:", err.message);
    res.status(500).json({ error: "Erreur récupération stats utilisateurs" });
  }
});

export default router;
