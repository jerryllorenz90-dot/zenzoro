// --- ZENZORO BACKEND (Production Ready) ---
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Allow frontend to access API
app.use(cors());

// Railway PORT
const PORT = process.env.PORT || 8080;

// --- HEALTH CHECK ---
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running!" });
});

// --- REAL BTC PRICE ---
app.get("/api/price/btc", async (req, res) => {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

    const response = await fetch(url);
    const data = await response.json();

    res.json({ btc: data.bitcoin.usd });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to fetch BTC price" });
  }
});

// --- MULTIPLE CRYPTO PRICES ---
app.get("/api/prices", async (req, res) => {
  try {
    const coins = ["bitcoin", "ethereum", "solana", "binancecoin", "dogecoin"];

    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=" +
      coins.join(",") +
      "&vs_currencies=usd";

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      BTC: data.bitcoin.usd,
      ETH: data.ethereum.usd,
      SOL: data.solana.usd,
      BNB: data.binancecoin.usd,
      DOGE: data.dogecoin.usd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load crypto prices" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Zenzoro backend running on port ${PORT}`);
});
