// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ====== STATIC FRONTEND ======
app.use(express.static(path.join(__dirname, "../public")));

// ====== CHECK SERVER STATUS ======
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro Backend",
    time: new Date().toISOString(),
  });
});

// ====== COINGECKO API BASE ======
const API_BASE =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false";

// ====== /api/overview (Market Overview) ======
app.get("/api/overview", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `${API_BASE}`;

    const response = await axios.get(url);
    const coins = response.data;

    const coin = coins.find(
      (c) => c.symbol.toLowerCase() === symbol?.toLowerCase()
    );

    if (!coin) return res.status(404).json({ error: "Coin not found" });

    // Return EXACT structure frontend expects
    return res.json({
      success: true,
      data: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        circulating_supply: coin.circulating_supply,
      },
    });
  } catch (err) {
    console.error("Overview Error:", err.message);
    res.status(500).json({ error: "Failed to load market overview" });
  }
});

// ====== /api/history (Historical Data) ======
app.get("/api/history", async (req, res) => {
  try {
    const { symbol, days } = req.query;
    if (!symbol) return res.status(400).json({ error: "Missing symbol" });

    const url = `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`;

    const response = await axios.get(url);

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("History Error:", err.message);
    res.status(500).json({ error: "Failed to load historical data" });
  }
});

// ====== FALLBACK ROUTE (Serve index.html) ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ====== START SERVER ======
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Zenzoro backend running on port ${PORT}`);
});