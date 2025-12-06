// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- STATIC FRONTEND ----------
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Root → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---------- SIMPLE HEALTH / STATUS ----------
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro Backend",
    time: new Date().toISOString()
  });
});

// ---------- COIN HELPERS ----------
const COINGECKO_MARKETS = "https://api.coingecko.com/api/v3/coins/markets";
const COINGECKO_HISTORY = "https://api.coingecko.com/api/v3/coins";

// map tickers / ids to CoinGecko ids
const ID_MAP = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  bnb: "binancecoin",
  binancecoin: "binancecoin",
  doge: "dogecoin",
  dogecoin: "dogecoin"
};

function toCoinId(symbolParam) {
  if (!symbolParam) return "bitcoin";
  const key = String(symbolParam).toLowerCase();
  return ID_MAP[key] || "bitcoin";
}

// ---------- MARKET OVERVIEW FOR ONE COIN ----------
app.get("/api/overview", async (req, res) => {
  try {
    const symbol = req.query.symbol || "btc"; // e.g. btc, eth, sol...
    const id = toCoinId(symbol);

    const { data } = await axios.get(COINGECKO_MARKETS, {
      params: {
        vs_currency: "usd",
        ids: id,
        order: "market_cap_desc",
        per_page: 1,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h"
      },
      timeout: 10000
    });

    if (!data || !data.length) {
      return res.status(404).json({ success: false, error: "Coin not found" });
    }

    const coin = data[0];

    // Return clean object; frontend just prints JSON now
    return res.json({
      success: true,
      data: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h
      }
    });
  } catch (err) {
    console.error("Overview Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load market overview" });
  }
});

// ---------- PRICE HISTORY ----------
app.get("/api/history", async (req, res) => {
  try {
    const symbol = req.query.symbol || "btc"; // ticker or id
    const days = req.query.days || "7";

    const id = toCoinId(symbol);

    const url = `${COINGECKO_HISTORY}/${id}/market_chart`;

    const { data } = await axios.get(url, {
      params: {
        vs_currency: "usd",
        days
      },
      timeout: 10000
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error("History Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load history" });
  }
});

// ---------- FALLBACK (SPA) ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Zenzoro backend running on port ${PORT}`);
});