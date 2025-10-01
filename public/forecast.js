async function getForecasts() {
  try {
    let lat = 50.5, lon = 4.5, country = "Belgium"; // Valeurs par défaut
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          loadForecast(lat, lon, country);
        },
        () => loadForecast(lat, lon, country) // fallback si refus
      );
    } else {
      loadForecast(lat, lon, country);
    }
  } catch (err) {
    console.error("Erreur géolocalisation:", err);
  }
}

async function loadForecast(lat, lon, country) {
  try {
    // === Prévisions locales ===
    const localRes = await fetch("/api/superforecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, country })
    });
    const localData = await localRes.json();

    renderForecast("localForecast", localData, "Prévisions locales");

    // Génération texte clair
    const localText = await generateText(localData.forecast || "Pas de données");
    addText("localForecast", localText);

    // === Prévisions nationales ===
    const natRes = await fetch(`/api/forecast/${country}`);
    const natData = await natRes.json();

    renderForecast("nationalForecast", natData, "Prévisions nationales");

    const natText = await generateText(natData.forecasts || "Pas de données");
    addText("nationalForecast", natText);

  } catch (err) {
    console.error("Erreur loadForecast:", err);
  }
}

function renderForecast(containerId, data, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!data || data.error) {
    container.innerHTML = `<div>❌ Erreur: ${data.error || "Pas de données"}</div>`;
    return;
  }

  // Exemple simple d'affichage
  const sampleDays = Array.isArray(data.forecast) ? data.forecast : [data.forecast];
  sampleDays.slice(0, 7).forEach((day, i) => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div><strong>Jour ${i+1}</strong></div>
      <img src="https://openweathermap.org/img/wn/10d.png" alt="icon">
      <div>${day.temperature || "--"}°C</div>
      <div>${day.precipitation || "0"} mm</div>
    `;
    container.appendChild(card);
  });
}

async function generateText(rawData) {
  try {
    const res = await fetch("/api/textgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: JSON.stringify(rawData) })
    });
    const data = await res.json();
    return data.reply || "Pas de résumé disponible.";
  } catch (err) {
    console.error("Erreur generateText:", err);
    return "Erreur génération texte.";
  }
}

function addText(containerId, text) {
  const container = document.getElementById(containerId);
  const div = document.createElement("div");
  div.style.marginTop = "10px";
  div.innerHTML = `<em>${text}</em>`;
  container.appendChild(div);
}

// Lancer au chargement
document.addEventListener("DOMContentLoaded", getForecasts);
