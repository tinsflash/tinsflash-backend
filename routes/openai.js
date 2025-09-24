// routes/openai.js (corrigé → Cohere + ESM)
import express from "express";
import coherePkg from "cohere-ai";

const { CohereClient } = coherePkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const router = express.Router();

/**
 * Génère un bulletin météo clair et concis pour une localisation donnée
 */
router.get("/podcast/:location", async (req, res) => {
  try {
    const location = req.params.location;

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "user",
          content: `Fais un bulletin météo clair et concis pour ${location}.`,
        },
      ],
    });

    let bulletin = "";
    if (response.text) {
      bulletin = response.text;
    } else if (response.message?.content?.[0]?.text) {
      bulletin = response.message.content[0].text;
    } else {
      bulletin = "⚠️ Bulletin météo non disponible.";
    }

    res.json({ location, bulletin });
  } catch (err) {
    console.error("❌ Erreur génération podcast:", err.message);
    res.status(500).json({ error: "Erreur génération podcast météo" });
  }
});

export default router;
