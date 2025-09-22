// services/chatService.js
import fetch from "node-fetch";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

/**
 * Fonction pour appeler GPT-5 (OpenAI)
 */
async function callOpenAI(messages) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5", // ✅ Ton moteur atomique météo
      messages,
      temperature: 0.3,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Fonction pour appeler Gemini (Google)
 */
async function callGemini(messages) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }]}]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Pas de réponse Gemini.";
}

/**
 * Fonction pour appeler HuggingFace (Mistral-7B)
 */
async function callHuggingFace(messages) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
    method: "POST",
    headers: { "Authorization": `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: prompt })
  });

  if (!response.ok) {
    throw new Error(`HuggingFace error: ${response.status}`);
  }
  const data = await response.json();
  return data[0]?.generated_text || "❌ Pas de réponse HuggingFace.";
}

/**
 * Fonction principale → cascade IA
 */
export async function chatWithJean(messages) {
  try {
    if (OPENAI_API_KEY) {
      return await callOpenAI(messages);
    } else if (GEMINI_API_KEY) {
      return await callGemini(messages);
    } else if (HF_API_KEY) {
      return await callHuggingFace(messages);
    } else {
      return "❌ Aucune clé API disponible. Configurez OPENAI_API_KEY, GEMINI_API_KEY ou HF_API_KEY.";
    }
  } catch (err) {
    console.error("Erreur chatWithJean:", err.message);

    // Fallback si une IA échoue
    if (GEMINI_API_KEY) {
      try { return await callGemini(messages); } catch {}
    }
    if (HF_API_KEY) {
      try { return await callHuggingFace(messages); } catch {}
    }

    return "❌ Toutes les IA sont indisponibles.";
  }
}
