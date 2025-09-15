const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// Import des routes
const forecastRoute = require("./routes/forecast");

// Test API (page d’accueil backend)
app.get("/", (req, res) => {
  res.send("✅ Bienvenue sur le backend TINSFLASH !");
});

// Routes météo
app.use("/forecast", forecastRoute);

// Préparé pour d’autres modules
// app.use("/billing", billingRoute);
// app.use("/alerts", alertsRoute);
// app.use("/ai", aiRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH lancé sur le port ${PORT}`);
});
