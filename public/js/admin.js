document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("runBtn");
  const progressBar = document.getElementById("progressBar");
  const status = document.getElementById("status");
  const logs = document.getElementById("logs");

  runBtn.addEventListener("click", () => {
    logs.textContent = "";
    status.textContent = "⏳ Démarrage du supercalculateur...";
    progressBar.style.width = "0%";

    const eventSource = new EventSource("/api/supercalc/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progress") {
        progressBar.style.width = `${data.value}%`;
        status.textContent = data.message;
      }
      if (data.type === "log") {
        logs.textContent += `\n${data.message}`;
        logs.scrollTop = logs.scrollHeight;
      }
      if (data.type === "done") {
        status.textContent = "✅ Prévisions générées avec succès";
        eventSource.close();
      }
      if (data.type === "error") {
        status.textContent = "❌ Erreur lors du run";
        logs.textContent += `\nErreur: ${data.message}`;
        eventSource.close();
      }
    };
  });
});
