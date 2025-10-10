// ==========================================================
// 💬 TINSFLASH – chatService.js
// Everest Protocol v3.9 PRO+++
// ==========================================================
// Chat météo J.E.A.N. – GPT-4o-mini (contexte météo uniquement)
// ==========================================================

import OpenAI from "openai";
import { addEngineLog, addEngineError } from "./engineState.js";
import { injectAIProtocol } from "./aiInitProtocol.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askJean(message, user = "Anonyme") {
  try {
    const systemPrompt = await injectAIProtocol("chat utilisateur");

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Question météo : ${message}. 
        Ne réponds qu’aux questions concernant la météo, les risques, les alertes ou les prévisions générées par TINSFLASH. 
        Ignore tout autre sujet.`,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 400,
    });

    const answer = completion.choices?.[0]?.message?.content || "Aucune réponse IA disponible.";
    await addEngineLog(`💬 J.E.A.N → ${user}: ${answer}`, "info", "chat");

    return { success: true, answer };
  } catch (err) {
    await addEngineError(`Erreur chat IA: ${err.message}`, "chat");
    return { success: false, error: err.message };
  }
}
