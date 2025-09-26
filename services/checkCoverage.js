// services/checkCoverage.js
// Vérifie si une zone est couverte par la centrale météo
// Si non couverte → fallback open data (prévisions) ou alertes continentales

const coveredCountries = [
  // 🇪🇺 Union Européenne (27)
  "Allemagne", "Autriche", "Belgique", "Bulgarie", "Chypre", "Croatie",
  "Danemark", "Espagne", "Estonie", "Finlande", "France", "Grèce",
  "Hongrie", "Irlande", "Italie", "Lettonie", "Lituanie", "Luxembourg",
  "Malte", "Pays-Bas", "Pologne", "Portugal", "République tchèque",
  "Roumanie", "Slovaquie", "Slovénie", "Suède",
  // Extensions
  "Royaume-Uni", "Ukraine", "Norvège",
  // 🇺🇸 USA
  "USA", "États-Unis", "United States", "US"
];

// Middleware Express
export default function checkCoverage(req, res, next) {
  const { zone, country } = req.params;
  const queryZone = zone || country;

  if (!queryZone) {
    req.coverage = { covered: false, type: "unknown" };
    return next();
  }

  // Vérifie si la zone est couverte
  const isCovered = coveredCountries.some(
    c => c.toLowerCase() === queryZone.toLowerCase()
  );

  if (isCovered) {
    req.coverage = { covered: true, type: "nuclear" }; // moteur complet
  } else {
    req.coverage = { covered: false, type: "open" }; // open data ou alertes continentales
  }

  return next();
}
