import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// 🔒 accès limité via clé secrète
router.use((req, res, next) => {
  const key = req.headers["x-secret-key"];
  if (key !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Accès interdit" });
  }
  next();
});

// GFS brut
router.get("/gfs", async (req, res) => {
  try {
    const { lat = "50.4669", lon = "4.8675" } = req.query;
    const url =
      "https://api.openweathermap.org/data/2.5/forecast?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=" +
      process.env.OPENWEATHER_KEY +
      "&units=metric&lang=fr";
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meteomatics brut
router.get("/meteomatics", async (req, res) => {
  try {
    const username = process.env.METEOMATICS_USERNAME;
    const password = process.env.METEOMATICS_PASSWORD;
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.meteomatics.com/${today}T00:00:00Z--${today}T23:00:00Z:PT1H/t_2m:C,precip_1h:mm,windspeed_10m:ms/50.4669,4.8675/json`;

    const data = await fetch(url, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(username + ":" + password).toString("base64"),
      },
    }).then((r) => r.json());

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar brut
router.get("/radar", async (req, res) => {
  res.json({
    radarUrl: "https://api.buienradar.nl/image/1.0/RadarMapNL",
  });
});

export default router;

