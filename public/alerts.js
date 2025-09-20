async function loadAlerts() {
  const el = document.getElementById("alerts-container");
  el.innerText = "⏳ Chargement...";
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    el.innerHTML = data.map(a => 
      `⚠️ ${a.level.toUpperCase()} - ${a.message} (Fiabilité: ${a.reliability}%)`
    ).join("<br>");
  } catch {
    el.innerText = "❌ Erreur chargement alertes";
  }
}

async function testPush(type) {
  try {
    const res = await fetch("/api/alerts/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, location: "Floreffe" })
    });
    const data = await res.json();
    alert(`${data.message} (${data.time})`);
  } catch (err) {
    alert("❌ Erreur envoi alerte: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", loadAlerts);
