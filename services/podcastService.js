// services/podcastService.js

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

export default { generatePodcast };
