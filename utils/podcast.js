// utils/podcast.js
// Debug version – ne génère pas d'audio réel
// Permet de débloquer Render sans casser podcastService

export async function generatePodcast(text = "Bulletin météo Tinsflash") {
  console.log("⚠️ [DEBUG] generatePodcast appelé avec texte :", text);

  return {
    timestamp: new Date().toISOString(),
    title: "Podcast Météo Tinsflash (DEBUG)",
    text,
    audioUrl: null, // pas de vrai fichier audio pour le moment
    debug: true
  };
}
