const express = require("express");
const { generatePodcast } = require("../utils/openai");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { location } = req.query;
    const audio = await generatePodcast(location);
    res.json({ audio });
  } catch (error) {
    res.status(500).json({ error: "Erreur podcast" });
  }
});

module.exports = router;
