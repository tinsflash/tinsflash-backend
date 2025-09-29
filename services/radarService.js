// services/radarService.js
// 🌍 Radar météo – Index (Windy par défaut, RainViewer en fallback)

import axios from "axios";

export async function getGlobalRadar() {
  try {
    // ✅ Windy iframe prêt à intégrer
    const windyIframe = `
      <iframe
        width="100%"
        height="500"
        src="https://embed.windy.com/embed2.html?lat=50.5&lon=4.5&zoom=4&level=surface&overlay=radar&menu=&message=true&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=50.5&detailLon=4.5&metricWind=default&metricTemp=default&radarRange=-1"
        frameborder="0"
      ></iframe>
    `;

    return { type: "windy", html: windyIframe };
  } catch (err) {
    console.error("⚠️ Windy indisponible, fallback RainViewer:", err.message);

    // ✅ RainViewer fallback
    const rainViewerIframe = `
      <iframe
        width="100%"
        height="500"
        src="https://www.rainviewer.com/map.html?loc=50.5,4.5,5&oFa=1&oC=1&oU=1&oCS=1&oF=1&oAP=1&c=3&o=83&lm=1&layer=radar"
        frameborder="0"
      ></iframe>
    `;

    return { type: "rainviewer", html: rainViewerIframe };
  }
}

// Alias pour compatibilité
export async function radarHandler() {
  return getGlobalRadar();
}
