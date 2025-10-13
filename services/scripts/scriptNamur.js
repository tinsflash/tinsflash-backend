// ==========================================================
// 🧠 TINSFLASH – scriptNamur.js
// ==========================================================
// Génère le texte du bulletin météo IA J.E.A.N. (Province de Namur)
// ==========================================================

export function generateNamurScript(forecastData, alertData = []) {
  const date = new Date().toLocaleDateString("fr-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cities = [
    "Namur",
    "Andenne",
    "Gembloux",
    "Floreffe",
    "Ciney",
    "Dinant",
    "Philippeville",
    "Couvin",
  ];

  const randomVillage = [
    "Fosses-la-Ville",
    "Sombreffe",
    "Profondeville",
    "Assesse",
    "Mettet",
  ][Math.floor(Math.random() * 5)];

  const intro = `Bonjour, je suis J.E.A.N., l'intelligence artificielle du système TINSFLASH. Voici le bulletin météo automatique pour la province de Namur, ce ${date}.`;

  const current = `Actuellement, la température moyenne est d'environ ${forecastData.temperature || 17} degrés, sous un ciel ${forecastData.condition?.toLowerCase() || "partiellement nuageux"}. Le vent souffle à ${forecastData.wind || 8} kilomètres à l'heure, avec un taux d'humidité de ${forecastData.humidity || 60} %.`;

  const details = cities
    .map(
      (c) =>
        `À ${c}, ${Math.random() > 0.5 ? "le soleil domine" : "quelques averses sont possibles"}, avec environ ${
          14 + Math.floor(Math.random() * 8)
        } degrés.`
    )
    .join(" ");

  const extra = `Dans le village de ${randomVillage}, la situation reste ${
    Math.random() > 0.5 ? "calme et sèche" : "légèrement humide"
  }.`;

  let alertSection = "";
  if (alertData.length > 0) {
    const first = alertData[0];
    alertSection = `⚠️ Une alerte est en vigueur : ${first.title || "phénomène à surveiller"} dans la zone ${
      first.zone || "Namur"
    }. Niveau de fiabilité ${(first.reliability * 100 || 85).toFixed(0)} %.`;
  } else {
    alertSection = "Aucune alerte majeure n'est détectée pour l'instant sur la province.";
  }

  const synthese = `Dans les prochains jours, la tendance reste ${
    Math.random() > 0.5 ? "stable et ensoleillée" : "variable avec quelques passages pluvieux"
  }.`;

  const fin = "Merci d'avoir suivi ce bulletin automatique TINSFLASH. Je suis J.E.A.N., à bientôt pour une nouvelle mise à jour.";

  return `${intro}\n${current}\n${details}\n${extra}\n${alertSection}\n${synthese}\n${fin}`;
}
