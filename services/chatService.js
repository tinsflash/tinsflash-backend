import fetch from "node-fetch";

export async function chatWithJean(message) {
  const msg = message || "Analyse météo globale";

  try {
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es J.E.A.N, IA météo scientifique." },
          { role: "user", content: msg }
        ]
      })
    });

    const data = await reply.json();
    const answer = data.choices?.[0]?.message?.content || "Erreur IA";

    return { reply: answer };
  } catch (err) {
    throw new Error("Erreur chat IA : " + err.message);
  }
}

