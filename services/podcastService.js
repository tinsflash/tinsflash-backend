import { generatePodcast } from "../utils/podcast.js";

async function fetchPodcast(req, res) {
  try {
    const text = req.query.text || "Prévisions météo du jour";
    const result = await generatePodcast(text);
    res.json(result);
  } catch (err) {
    console.error("❌ Podcast error:", err);
    res.status(500).json({ error: "Podcast generation failed (DEBUG MODE)" });
  }
}

export default { fetchPodcast };
