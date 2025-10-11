// services/models.js
// 🔗 Registre central des modèles utilisés dans le moteur TINSFLASH

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import arome from "./arome.js";
import graphcast from "./graphcast.js";
import meteomatics from "./meteomatics.js";
import corrDiff from "./corrDiff.js";
import nasaSat from "./nasaSat.js";
import nowcastnet from "./nowcastnet.js";
import euroMeteoService from "./euroMeteoService.js";
import hrrr from "./hrrr.js";

export const MODELS = {
  GFS: { id: "gfs", name: "GFS (NOAA)", fn: gfs },
  ECMWF: { id: "ecmwf", name: "ECMWF (Europe)", fn: ecmwf },
  ICON: { id: "icon", name: "ICON (DWD)", fn: icon },
  AROME: { id: "arome", name: "AROME (Météo-France)", fn: arome },
  HRRR: { id: "hrrr", name: "HRRR (NOAA Rapid Refresh)", fn: hrrr },
  GRAPHCAST: { id: "graphcast", name: "GraphCast (DeepMind)", fn: graphcast },
  METEOMATICS: { id: "meteomatics", name: "Meteomatics (mix ECMWF/ICON)", fn: meteomatics },
  CORRDIFF: { id: "corrDiff", name: "CorrDiff (NVIDIA AI)", fn: corrDiff },
  NASA_SAT: { id: "nasaSat", name: "NASA POWER Satellite", fn: nasaSat },
  NOWCASTNET: { id: "nowcastnet", name: "NowcastNet (Tencent AI)", fn: nowcastnet },
  EUROMETEO: { id: "euroMeteoService", name: "EuroMeteo (agrégateur)", fn: euroMeteoService },
};

export default MODELS;
