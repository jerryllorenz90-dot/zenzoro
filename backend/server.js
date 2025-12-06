// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- STATIC FRONTEND ----------
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---------- STATUS ENDPOINT ----------
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro Backend",
    time: new Date().toISOString(),
  });
});

// ---------- COINGECKO HELPERS ----------
const COINGECKO_API = "https://api.coingecko.com/api/v3";

const SYMBOL_MAP = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  bnb: "binancecoin",
  doge: "dogecoin",
};

function normalizeSymbol(symbolParam) {
  const s = (symbolParam || "btc").toLowerCase();
  return SYMBOL_MAP[s] || "bitcoin";
}

// Get overview for one coin
async function fetchOverview(symbolParam) {
  const id = normalizeSymbol(symbolParam);
  const url = `${COINGECKO_API}/coins/markets`;

  const { data } = await axios.get(url, {
    params: {
      vs_currency: "usd",
      ids: id,
    },
  });

  if (!data || !data.length) {
    throw new Error("No data returned from CoinGecko");
  }

  const coin = data[0];

  return {
    symbol: (symbolParam || "btc").toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
  };
}

// Get history data for chart
async function fetchHistory(symbolParam, rangeParam) {
  const id = normalizeSymbol(symbolParam);

  let days = 7;
  if (rangeParam === "30d") days = 30;
  if (rangeParam === "90d") days = 90;

  const url = `${COINGECKO_API}/coins/${id}/market_chart`;

  const { data } = await axios.get(url, {
    params: {
      vs_currency: "usd",
      days,
    },
  });

  if (!data || !data.prices) {
    throw new Error("No price history returned from CoinGecko");
  }

  return data.prices.map(([timestamp, price]) => ({
    time: timestamp,
    price,
  }));
}

// ---------- API ROUTES ----------

// Market overview for a coin (used by your frontend)
app.get("/api/overview", async (req, res) => {
  try {
    const summary = await fetchOverview(req.query.symbol);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("Error /api/overview:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to load market data." });
  }
});

// History data for chart
app.get("/api/history", async (req, res) => {
  try {
    const points = await fetchHistory(req.query.symbol, req.query.range);
    res.json({ success: true, data: points });
  } catch (err) {
    console.error("Error /api/history:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to load chart data." });
  }
});

// ---------- DATABASE (OPTIONAL) ----------
const mongoUri = process.env.MONGO_URI;

if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
} else {
  console.log("⚠️ MONGO_URI not set - running without database");
}

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});