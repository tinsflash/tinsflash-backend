// ==========================================================
// 🎬 TINSFLASH – generateVideoNamur.js (v2.0 PRO+++)
// ==========================================================
// Génère la vidéo automatique IA J.E.A.N. pour la Province de Namur
// avec fond graphique officiel TINSFLASH (public/assets/namur-base.png)
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
    await addEngineLog("🎬 Génération vidéo IA J.E.A.N. – Province de Namur", "info", "video");

    // ======================================================
    // 📊 Données météo + alertes réelles
    // ======================================================
    const forecast = await generateForecast(50.47, 4.87); // Centre géographique de Namur
    const alerts = await runWorldAlerts();

    // ======================================================
    // 🧠 Génération du texte automatique (IA J.E.A.N.)
    // ======================================================
    const script = generateNamurScript(forecast, alerts?.alerts?.Europe || []);

    const dataDir = path.join(process.cwd(), "data");
    const publicDir = path.join(process.cwd(), "public", "videos");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const textFile = path.join(dataDir, "namur_script.txt");
    const outVideo = path.join(publicDir, "forecast-namur.mp4");
    const outImage = path.join(publicDir, "forecast-namur.jpg");
    fs.writeFileSync(textFile, script, "utf8");

    // ======================================================
    // 🎙️ Génération audio + vidéo (TTS + FFmpeg)
    // ======================================================
    const backgroundImage = path.join("public", "assets", "namur-base.png");
    const avatarOverlay = path.join("public", "avatars", "jean-default.png");

    // Création audio via gTTS + vidéo fond Namur + overlay avatar Jean
    execSync(`
      gtts-cli -l fr "${script.replace(/\n/g, " ")}" -o temp_audio.mp3 &&
      ffmpeg -y -i "${backgroundImage}" -i temp_audio.mp3 -loop 1 -t 45 -filter_complex "
        [0:v]scale=1280:720,format=yuv420p[bg];
        [1:a]anull[aud]
      " -map "[bg]" -map 1:a -c:v libx264 -tune stillimage -pix_fmt yuv420p "${outVideo}" &&
      ffmpeg -i "${outVideo}" -i "${avatarOverlay}" -filter_complex "[0][1]overlay=main_w-280:main_h-620" -codec:a copy -y "${outVideo}"
    `);

    // ======================================================
    // 🖼️ Miniature auto (frame à 2 secondes)
    // ======================================================
    execSync(`ffmpeg -i "${outVideo}" -ss 00:00:02 -vframes 1 "${outImage}" -y`);

    await addEngineLog("✅ Vidéo IA J.E.A.N. Province Namur générée avec succès.", "success", "video");
    return { success: true, script, outVideo, outImage };
  } catch (err) {
    await addEngineError("❌ Erreur génération vidéo Namur : " + err.message, "video");
    return { success: false, error: err.message };
  }
}

export default { generateVideoNamur };
