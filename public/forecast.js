async function searchAddress() {
  const address = document.getElementById("addressInput").value.trim();
  if (!address) return alert("Veuillez entrer une adresse ou une ville.");

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const geoData = await geoRes.json();

    if (geoData.length === 0) {
      alert("Adresse introuvable.");
      return;
    }

    const { lat, lon, display_name } = geoData[0];
    const country = (geoData[0].display_name.split(",").pop() || "Belgium").trim();

    document.getElementById("addressInput").value = display_name;

    loadForecast(lat, lon, country);
  } catch (err) {
    console.error("Erreur géocodage:", err);
    alert("Erreur lors de la recherche d’adresse.");
  }
}
