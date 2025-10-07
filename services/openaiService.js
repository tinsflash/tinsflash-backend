// PATH: services/openaiService.js
// Client OpenAI robuste (compatibilité totale avec GPT-4o-mini / GPT-5)

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ modèle par défaut économique
const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

function isStrictModel(modelName) {
  const m = (modelName || "").toLowerCase();
  return m.includes("gpt-5") || m.includes("chatgpt5") || m.includes("chatgpt-5");
}

export async function askOpenAI(systemPrompt = "", userPrompt = "", opts = {}) {
  const messages = [
    { role: "system", content: systemPrompt || "You are a precise meteorology engine." },
    { role: "user", content: userPrompt || "" },
  ];

  const useModel = (opts.model || MODEL).trim();
  const strict = isStrictModel(useModel);
  const params = { model: useModel, messages };

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
    if (/unsupported (parameter|value)|does not support/i.test(msg)) {
      try {
        const fallback = { model: useModel, messages };
        const resp2 = await client.chat.completions.create(fallback);
        return resp2?.choices?.[0]?.message?.content?.trim() || "";
      } catch (err2) {
        throw new Error(`OpenAI error: ${err2?.message || err2}`);
      }
    }
    throw new Error(`OpenAI error: ${msg}`);
  }
}
