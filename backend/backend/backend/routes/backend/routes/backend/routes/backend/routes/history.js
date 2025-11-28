import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { days = 7 } = req.query;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);

    res.json({
      symbol,
      days,
      history: response.data.prices
    });

  } catch (err) {
    res.status(500).json({ error: "Unable to fetch history", details: err.message });
  }
});

export default router;
