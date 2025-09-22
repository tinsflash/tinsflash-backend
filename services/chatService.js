// services/chatService.js
import OpenAI from "openai";
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🤖 Chat avec J.E.A.N.
 * GPT-5 → fallback Gemini → fallback HuggingFace
 */
export async function chatWithJean(message) {
  // Normalisation → accepte string ou tableau (messages)
  const userMessage =
    typeof message === "string"
      ? [{ role: "user", content: message }]
      : message;

  // --- GPT-5 (OpenAI) ---
  try {
    addLog("⚡ Tentative réponse avec GPT-5...");
    const gpt = await openai.chat.completions.create({
      model: "gpt-5", // ⚡ moteur météo nucléaire
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo mondiale. " +
            "Expert en météorologie, climatologie et mathématiques. " +
            "Explique toujours de manière claire, fiable et précise les prévisions et alertes.",
        },
        ...userMessage,
      ],
    });

    const reply = gpt.choices?.[0]?.message?.content;
    if (reply) {
      addLog("✅ Réponse obtenue via GPT-5");
      return { engine: "GPT-5", text: reply };
    }
  } catch (err) {
    addLog("⚠️ GPT-5 indisponible: " + err.message);
  }

  // --- Gemini (Google AI Studio) ---
  try {
    addLog("⚡ Tentative réponse avec Gemini...");
    const gemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }]}],
        }),
      }
    );

    const geminiData = await gemini.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      addLog("✅ Réponse obtenue via Gemini");
      return { engine: "Gemini", text: reply };
    }
  } catch (err) {
    addLog("⚠️ Gemini indisponible: " + err.message);
  }

  // --- HuggingFace ---
  try {
    addLog("⚡ Tentative réponse avec HuggingFace...");
    const hf = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: message }),
    });

    const hfData = await hf.json();
    const reply = hfData?.[0]?.generated_text;

    if (reply) {
      addLog("✅ Réponse obtenue via HuggingFace");
      return { engine: "HuggingFace", text: reply };
    }
  } catch (err) {
    addLog("⚠️ HuggingFace indisponible: " + err.message);
  }

  // --- Fallback ultime ---
  addLog("❌ Toutes les IA sont indisponibles");
  return {
    engine: "Fallback",
    text: "❌ Aucune IA disponible actuellement. Vérifiez vos clés API.",
  };
}

export default { chatWithJean };
