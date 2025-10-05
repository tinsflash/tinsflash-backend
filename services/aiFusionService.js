// PATH: services/aiFusionService.js
import axios from "axios";
import dotenv from "dotenv";
import { addEngineLog, addEngineError } from "./engineState.js";

dotenv.config();

/**
 * 🔬 Fusion IA des modèles météo
 * Combine les résultats GFS, ECMWF, ICON, Meteomatics, Copernicus, NASA, OpenWeather, etc.
 * Utilise plusieurs IA pour validation croisée (GraphCast, Pangu, Gemini, GPT-5)
 */
export async function fuseModels(modelsData = {}, zone = "Europe") {
  try {
    await addEngineLog(`🤖 Démarrage fusion IA multi-modèles pour ${zone}`);

    // === Préparation du dataset brut ===
    const mergedData = Object.entries(modelsData).map(([model, data]) => ({
      model,
      data,
    }));

    if (mergedData.length === 0) {
      throw new Error("Aucune donnée modèle disponible pour la fusion.");
    }

    // === Étape 1 : Fusion via GraphCast (prévisions physiques IA) ===
    let graphcastResult = null;
    try {
      await addEngineLog("📡 Fusion primaire via GraphCast...");
      const res = await axios.post(process.env.GRAPHCAST_API, {
        inputs: mergedData,
        zone,
      });
      graphcastResult = res.data;
      await addEngineLog("✅ Fusion GraphCast OK.");
    } catch (err) {
      await addEngineError(`GraphCast indisponible: ${err.message}`);
    }

    // === Étape 2 : Fusion via Pangu-Weather ===
    let panguResult = null;
    try {
      await addEngineLog("🪶 Vérification via Pangu-Weather...");
      const res = await axios.post(process.env.PANGU_API, {
        inputs: mergedData,
        zone,
      });
      panguResult = res.data;
      await addEngineLog("✅ Pangu-Weather OK.");
    } catch (err) {
      await addEngineError(`Pangu indisponible: ${err.message}`);
    }

    // === Étape 3 : Validation sémantique via Gemini (Google) ===
    let geminiInsight = null;
    try {
      await addEngineLog("🌤️ Validation via Gemini...");
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Fusionne et valide les prévisions issues de GraphCast et Pangu pour la zone ${zone}.
                         Résume température moyenne, vent moyen, humidité moyenne et fiabilité (%) sous format JSON. 
                         Données GraphCast: ${JSON.stringify(graphcastResult)} 
                         Données Pangu: ${JSON.stringify(panguResult)}`,
                },
              ],
            },
          ],
        }
      );
      geminiInsight = JSON.parse(res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      await addEngineLog("✅ Validation Gemini OK.");
    } catch (err) {
      await addEngineError(`Gemini: ${err.message}`);
    }

    // === Étape 4 : Consolidation finale via GPT-5 ===
    let finalFusion = null;
    try {
      await addEngineLog("🧠 Consolidation finale GPT-5...");
      const prompt = `
        Tu es l'IA principale du moteur météorologique TINSFLASH.
        Fusionne toutes les prévisions disponibles (GraphCast, Pangu, Gemini) pour la zone ${zone}.
        Donne un résultat synthétique fiable, au format JSON:
        {
          "temperature_min": ...,
          "temperature_max": ...,
          "vent_moyen": ...,
          "humidité": ...,
          "pression": ...,
          "fiabilité": ...,
          "résumé": "phrase humaine concise"
        }.
      `;
      const gptRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-5-turbo",
          messages: [
            { role: "system", content: "Tu es l'IA moteur météo Tinsflash." },
            {
              role: "user",
              content: `${prompt}
              GraphCast=${JSON.stringify(graphcastResult)}
              Pangu=${JSON.stringify(panguResult)}
              Gemini=${JSON.stringify(geminiInsight)}`,
            },
          ],
          temperature: 0.2,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
      );
      finalFusion = JSON.parse(gptRes.data.choices[0].message.content);
      await addEngineLog("✅ Fusion finale GPT-5 OK.");
    } catch (err) {
      await addEngineError(`GPT-5 fusion: ${err.message}`);
      throw new Error("Erreur GPT-5 dans la fusion finale.");
    }

    // === Sortie finale ===
    const result = {
      zone,
      graphcast: graphcastResult || {},
      pangu: panguResult || {},
      gemini: geminiInsight || {},
      final: finalFusion || {},
      timestamp: new Date(),
    };

    await addEngineLog("🚀 Fusion IA complète terminée.");
    return result;
  } catch (err) {
    await addEngineError(`Fusion IA globale: ${err.message}`);
    throw err;
  }
}

export default { fuseModels };
