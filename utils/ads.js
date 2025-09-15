function getAds() {
  return {
    open: process.env.ADS_APP_OPEN,
    banner_home: process.env.ADS_BANNER_HOME,
    banner_detail: process.env.ADS_BANNER_DETAIL,
    banner_map: process.env.ADS_BANNER_MAP,
    rewarded_bonus: process.env.ADS_REWARDED_BONUS,
  };
}

module.exports = { getAds };
