const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON
app.use(express.json());

// Sert tout le dossier "public"
app.use(express.static(path.join(__dirname, "public")));

// Routes API (si tu en ajoutes, elles passent avant le fallback index.html)
app.use("/api", require("./routes/forecast"));
app.use("/api", require("./routes/alerts"));
app.use("/api", require("./routes/podcast"));
app.use("/api", require("./routes/ads"));
app.use("/api", require("./routes/subscribe"));
app.use("/api", require("./routes/admin"));
app.use("/api", require("./routes/openai"));
app.use("/api", require("./routes/forecastPlus"));
app.use("/api", require("./routes/hiddenSources"));

// Route fallback : si aucune autre route trouvée → envoie index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
