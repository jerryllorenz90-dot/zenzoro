import PriceHistory from "../models/PriceHistory.js";

export const getHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to load price history" });
  }
};