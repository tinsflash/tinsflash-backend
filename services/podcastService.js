// services/podcastService.js

// Génération fictive d’un podcast météo (placeholder)
async function generatePodcast(text) {
  try {
    return {
      text,
      audioUrl: "https://example.com/podcast.mp3",
      createdAt: new Date()
    };
  } catch (err) {
    console.error("❌ PodcastService error:", err.message);
    return null;
  }
}

// ✅ Export par défaut
export default { generatePodcast };
