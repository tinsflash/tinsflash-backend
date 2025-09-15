const express = require("express");
const router = express.Router();

// Exemple d’alerte (tu pourras améliorer avec IA + API)
router.get("/", (req, res) => {
  const alerts = [
    { region: "Belgique", level: "🟠 Orange", message: "Risque de vent fort" },
    { region: "Tokyo", level: "🔴 Rouge", message: "Inondations graves" }
  ];

  res.json(alerts);
});

module.exports = router;
