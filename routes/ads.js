const express = require("express");
const { getAds } = require("../utils/ads");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(getAds());
});

module.exports = router;
