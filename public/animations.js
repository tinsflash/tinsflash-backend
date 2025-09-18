// -------------------------
// animations.js
// Ajout d'animations dynamiques aux icônes météo
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".weather-icon");

  icons.forEach(icon => {
    const symbol = icon.textContent.trim();

    switch (symbol) {
      case "☀️": // Soleil qui pulse
        icon.classList.add("sun-anim");
        break;

      case "☁️": // Nuages flottants
      case "⛅":
      case "🌤️":
        icon.classList.add("cloud-anim");
        break;

      case "🌧️": // Pluie
      case "🌦️":
        icon.classList.add("rain-anim");
        break;

      case "❄️": // Neige
        icon.classList.add("snow-anim");
        break;

      case "⛈️": // Orage
      case "🌩️":
        icon.classList.add("storm-anim");
        break;
    }
  });
});
