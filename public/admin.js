// public/admin.js

// --- Fonction utilitaire pour afficher les logs ---
function addLog(message) {
  const logsContainer = document.getElementById("logsContainer");
  if (!logsContainer) return;
  const entry = document.createElement("div");
  entry.textContent = message;
  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight; // auto-scroll
}

// --- Lancer un Run SuperForecast ---
const runBtn = document.getElementById("runSuperForecast");
if (runBtn) {
  runBtn.addEventListener("click", async () => {
    addLog("🚀 Lancement SuperForecast en cours...");
    try {
      const res = await fetch("/api/supercalc/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 50.85, lon: 4.35 }), // par défaut Bruxelles
      });

      const data = await res.json().catch(() => null);

      if (!data) {
        addLog("❌ Erreur: réponse invalide du serveur (SuperForecast)");
        return;
      }

      if (data.error) {
        addLog("❌ SuperForecast erreur: " + data.error);
      } else {
        addLog("✅ Run lancé: " + JSON.stringify(data, null, 2));
      }
    } catch (err) {
      addLog("❌ Erreur lancement SuperForecast: " + err.message);
    }
  });
}

// --- Chat avec J.E.A.N. ---
const chatForm = document.getElementById("chatForm");
if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    addLog("💬 Envoi à J.E.A.N.: " + message);
    input.value = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      // Tenter JSON
      const data = await res.json().catch(async () => {
        const txt = await res.text();
        throw new Error("Réponse non-JSON reçue: " + txt.slice(0, 120));
      });

      if (data.error) {
        addLog("❌ Erreur chat: " + data.error);
      } else {
        addLog("🤖 Réponse J.E.A.N.: " + (data.reply || JSON.stringify(data)));
      }
    } catch (err) {
      addLog("❌ Erreur chat: " + err.message);
    }
  });
}
