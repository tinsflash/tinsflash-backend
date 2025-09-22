// services/chatService.js
import OpenAI from "openai";
import fetch from "node-fetch";

// --- OpenAI (GPT-5, par défaut) ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Google Gemini (fallback gratuit) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // clé gratuite Google AI Studio
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// --- Hugging Face (fallback gratuit alternatif) ---
const HF_API_KEY = process.env.HF_API_KEY; // clé Hugging Face gratuite
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // modèle open-source

/**
 * IA principale (GPT-5)
 */
async function askGPT(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // ou "gpt-5" quand dispo
    messages: [
      { role: "system", content: "Tu es J.E.A.N., chef mécanicien de la Centrale Nucléaire Météo, expert en météo, climatologie et mathématiques." },
      { role: "user", content: prompt },
    ],
    max_tokens: 500,
  });
  return response.choices[0].message.content;
}

/**
 * Fallback Gemini (Google gratuit)
 */
async function askGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini n’a pas répondu.";
}

/**
 * Fallback Hugging Face (Mistral-7B)
 */
async function askHF(prompt) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });
  const data = await res.json();
  return data[0]?.generated_text || "⚠️ HuggingFace n’a pas répondu.";
}

/**
 * Fonction principale avec fallback auto
 */
export async function chatWithJean(message) {
  try {
    // 🔥 Tentative GPT-5
    return await askGPT(message);
  } catch (err) {
    console.error("⚠️ GPT-5 indisponible:", err.message);

    // 🚨 Fallback Gemini
    if (GEMINI_API_KEY) {
      try {
        return await askGemini(message);
      } catch (e) {
        console.error("⚠️ Gemini indisponible:", e.message);
      }
    }

    // 🚨 Fallback Hugging Face
    if (HF_API_KEY) {
      try {
        return await askHF(message);
      } catch (e) {
        console.error("⚠️ HuggingFace indisponible:", e.message);
      }
    }

    // ❌ Rien dispo
    return "❌ JEAN n’est pas disponible pour le moment (aucune IA active).";
  }
}
