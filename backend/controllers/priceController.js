import fetchCrypto from "../utils/fetchCrypto.js";

export const getPrices = async (req, res) => {
  try {
    const prices = await fetchCrypto();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch prices" });
  }
};