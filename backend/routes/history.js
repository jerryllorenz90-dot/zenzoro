const express = require("express");
const router = express.Router();
const { getHistory } = require("../services/cryptoService");

// Example: /api/history/btc?days=7
router.get("/:coin", async (req, res) => {
  const coin = req.params.coin.toLowerCase();
  const days = req.query.days || 7;

  const map = {
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana",
    bnb: "binancecoin",
    doge: "dogecoin"
  };

  const coinId = map[coin];
  if (!coinId) return res.status(400).json({ error: "Invalid coin" });

  const data = await getHistory(coinId, days);
  if (!data) return res.status(500).json({ error: "Failed to load history" });

  res.json(data);
});

module.exports = router;