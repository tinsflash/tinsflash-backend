// routes/admin.js
// Route admin pour affichage comparateur

import express from "express";
import { compareSources } from "../hiddensources/comparator.js";

const router = express.Router();

router.get("/compare", async (req, res) => {
  const { lat, lon } = req.query;

  // Exemple : remplacer par nos prévisions internes (ici forcé à "pluie, vent fort")
  const ourForecast = "pluie, vent fort";

  const results = await compareSources(ourForecast, lat || 50.5, lon || 4.5);
  res.json(results);
});

export default router;

