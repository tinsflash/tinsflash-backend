// services/radarService.js
import fetch from "node-fetch";

// Radar mondial (Windy + Buienalarm style)
export async function radarHandler(zone = "global") {
  try {
    // Exemple API radar : tu peux brancher Windy ou RainViewer
    const url = `https://tilecache.rainviewer.com/v2/radar/${zone}/256/0/0/0/0/0.png`;
    const radarUrl = url; // 🔗 retour direct

    return { success: true, zone, radarUrl };
  } catch (err) {
    console.error("❌ radarHandler:", err.message);
    return { success: false, error: err.message };
  }
}
