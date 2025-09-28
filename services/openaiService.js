// PATH: services/openaiService.js
// Client OpenAI robuste (compatibilité modèles qui n’acceptent pas temperature/max_tokens)

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tu peux définir OPENAI_MODEL=chatgpt-5 (ou autre) dans Render.
// Par défaut on reste sur gpt-4o.
const MODEL = (process.env.OPENAI_MODEL || "gpt-4o").trim();

/** Certains modèles (p.ex. “chatgpt-5”) n’acceptent pas temperature ≠ 1, ni max_tokens. */
function isStrictModel(modelName) {
  const m = (modelName || "").toLowerCase();
  // Heuristique volontairement large
  return m.includes("gpt-5") || m.includes("chatgpt5") || m.includes("chatgpt-5");
}

/**
 * Appel IA unique pour tout le backend.
 * - N’envoie pas les paramètres non supportés
 * - Retente automatiquement sans paramètres si l’API renvoie “Unsupported …”
 */
export async function askOpenAI(systemPrompt = "", userPrompt = "", opts = {}) {
  const messages = [
    { role: "system", content: systemPrompt || "You are a precise meteorology engine." },
    { role: "user", content: userPrompt || "" },
  ];

  const strict = isStrictModel(MODEL);

  // Paramètres “compatibles” par défaut
  const params = { model: MODEL, messages };

  // On n’ajoute ces réglages QUE si le modèle le supporte clairement
  if (!strict) {
    if (typeof opts.temperature === "number") params.temperature = opts.temperature;
    if (typeof opts.top_p === "number") params.top_p = opts.top_p;
    if (typeof opts.max_tokens === "number") params.max_tokens = opts.max_tokens;
  }

  try {
    const resp = await client.chat.completions.create(params);
    return resp?.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    const msg = `${err?.message || err}`;
    // Si le modèle refuse un paramètre → on retente sans aucun réglage “optionnel”
    if (/unsupported (parameter|value)|does not support/i.test(msg)) {
      try {
        const fallback = { model: MODEL, messages };
        const resp2 = await client.chat.completions.create(fallback);
        return resp2?.choices?.[0]?.message?.content?.trim() || "";
      } catch (err2) {
        throw new Error(`OpenAI error: ${err2?.message || err2}`);
      }
    }
    throw new Error(`OpenAI error: ${msg}`);
  }
}
