// --- Chargement des alertes locales & mondiales ---
document.addEventListener("DOMContentLoaded", async () => {
  const localBox = document.getElementById("local-alerts");
  const globalBox = document.getElementById("global-alerts");

  if (localBox) {
    try {
      // Exemple : Paris (lat=48.85, lon=2.35)
      const res = await fetch(`/forecast?lat=48.85&lon=2.35`);
      const data = await res.json();

      if (data.alerts.length === 0) {
        localBox.innerHTML = `<p>Aucune alerte locale actuellement ✅</p>`;
      } else {
        localBox.innerHTML = data.alerts.map(alert => `
          <div class="alert ${alert.level.includes("🔴") ? "red" : "orange"}">
            <h3>${alert.type} ${alert.level}</h3>
            <p>${alert.message}</p>
            <small>Indice fiabilité : ${data.reliability}%</small>
          </div>
        `).join("");
      }

    } catch (err) {
      localBox.innerHTML = `<p>Erreur récupération alertes ⚠️</p>`;
    }
  }

  if (globalBox) {
    try {
      // Exemple : Tokyo (test mondial)
      const res = await fetch(`/forecast?lat=35.68&lon=139.69`);
      const data = await res.json();

      const redAlerts = data.alerts.filter(a => a.level.includes("🔴"));
      if (redAlerts.length === 0) {
        globalBox.innerHTML = `<p>Aucune alerte mondiale critique détectée ✅</p>`;
      } else {
        globalBox.innerHTML = redAlerts.map(alert => `
          <div class="alert red">
            <h3>${alert.type} ${alert.level}</h3>
            <p>${alert.message}</p>
            <small>Indice fiabilité : ${data.reliability}%</small>
          </div>
        `).join("");
      }

    } catch (err) {
      globalBox.innerHTML = `<p>Erreur récupération alertes mondiales ⚠️</p>`;
    }
  }
});

