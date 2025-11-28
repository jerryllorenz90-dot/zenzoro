import express from "express";
import axios from "axios";

const router = express.Router();

const SUPPORTED = ["bitcoin", "ethereum", "solana", "binancecoin", "dogecoin"];

router.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;

  if (!SUPPORTED.includes(symbol)) {
    return res.status(400).json({
      error: "Unsupported symbol",
      supported: SUPPORTED
    });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`;
    const response = await axios.get(url);

    res.json({
      symbol,
      price: response.data[symbol].usd
    });

  } catch (err) {
    res.status(500).json({ error: "Unable to fetch price", details: err.message });
  }
});

export default router;
