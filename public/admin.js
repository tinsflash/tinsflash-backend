// public/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const runButton = document.getElementById("runButton");
  const logsBox = document.getElementById("logsBox");

  if (runButton) {
    runButton.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/admin/superforecast/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: 50.85, lon: 4.35 }) // exemple Bruxelles
        });

        const data = await response.json();

        if (data.success) {
          logsBox.textContent = `✅ ${data.message}`;
        } else {
          logsBox.textContent = `❌ Erreur: ${data.error || "Run échoué"}`;
        }
      } catch (err) {
        logsBox.textContent = `⚠️ Impossible de contacter le serveur : ${err.message}`;
      }
    });
  }
});
