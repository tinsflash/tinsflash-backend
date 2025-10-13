// ==========================================================
// 🎬 TINSFLASH – generateVideoNamur.js
// ==========================================================
// Génère la vidéo automatique IA J.E.A.N. pour la Province de Namur
// ==========================================================

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { addEngineLog, addEngineError } from "./engineState.js";
import { generateNamurScript } from "./scriptNamur.js";
import { generateForecast } from "./forecastService.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

export async function generateVideoNamur() {
  try {
    await addEngineLog("🎬 Génération vidéo IA J.E.A.N. – Province Namur", "info", "video");

    const forecast = await generateForecast(50.47, 4.87);
    const alerts = await runWorldAlerts();

    const script = generateNamurScript(forecast, alerts?.alerts?.Europe || []);

    const dataDir = path.join(process.cwd(), "data");
    const publicDir = path.join(process.cwd(), "public", "videos");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const textFile = path.join(dataDir, "namur_script.txt");
    const outVideo = path.join(publicDir, "forecast-namur.mp4");
    const outImage = path.join(publicDir, "forecast-namur.jpg");

    fs.writeFileSync(textFile, script, "utf8");

    // Utilise Google TTS + FFmpeg (nécessite gtts et ffmpeg installés)
    execSync(`
      gtts-cli -l fr "${script.replace(/\n/g, " ")}" -o temp_audio.mp3 &&
      ffmpeg -loop 1 -i public/avatars/jean-default.png -i temp_audio.mp3 -c:v libx264 -tune stillimage -pix_fmt yuv420p -t 45 -vf "scale=1280:720,format=yuv420p" "${outVideo}" -y
    `);

    // Miniature
    execSync(`ffmpeg -i "${outVideo}" -ss 00:00:02 -vframes 1 "${outImage}" -y`);

    await addEngineLog("✅ Vidéo IA J.E.A.N. Province Namur générée avec succès.", "success", "video");
    return { success: true, script, outVideo, outImage };
  } catch (err) {
    await addEngineError("❌ Erreur génération vidéo Namur : " + err.message, "video");
    return { success: false, error: err.message };
  }
}

export default { generateVideoNamur };
