const api = require("../utils/apiClient");

// Fetch price + extra stats for one coin (default bitcoin)
exports.fetchPrice = async (coin = "bitcoin") => {
  const response = await api.get(
    `/simple/price?ids=${coin}&vs_currencies=usd` +
      `&include_24hr_change=true` +
      `&include_market_cap=true` +
      `&include_24hr_vol=true`
  );

  return response.data;
};