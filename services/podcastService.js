import fetch from "node-fetch";

export async function generatePodcast(type) {
  let prompt = "";

  switch (type) {
    case "free-morning": prompt = "Prévision météo nationale simple pour ce matin."; break;
    case "free-evening": prompt = "Prévision météo nationale simple pour ce soir."; break;
    case "premium-morning": prompt = "Prévision météo détaillée (Premium) pour ce matin."; break;
    case "premium-evening": prompt = "Prévision météo détaillée (Premium) pour ce soir."; break;
    case "pro-morning": prompt = "Prévision météo adaptée Pro pour ce matin."; break;
    case "pro-evening": prompt = "Prévision météo adaptée Pro pour ce soir."; break;
    case "proplus-morning": prompt = "Prévision météo Pro+ ultra détaillée pour ce matin."; break;
    case "proplus-evening": prompt = "Prévision météo Pro+ ultra détaillée pour ce soir."; break;
    default: prompt = "Prévision météo générique."; break;
  }

  try {
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await reply.json();
    const forecastText = data.choices?.[0]?.message?.content || "Erreur IA";

    return {
      type,
      forecast: forecastText,
      audioUrl: `/audio/${type}-${Date.now()}.mp3` // TTS à brancher plus tard
    };
  } catch (err) {
    throw new Error("Erreur génération podcast : " + err.message);
  }
}
