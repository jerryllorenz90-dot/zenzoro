// server.js - Zenzoro production server (backend + static frontend)

const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

const app = express();

// Railway will set PORT automatically. Locally we use 3000.
const PORT = process.env.PORT || 3000;

// Allow frontend + API on same origin
app.use(cors());
app.use(express.json());

// Serve all static files (index.html, app.js, styles.css)
app.use(express.static(__dirname));

/**
 * GET /api/status
 * Simple health check for monitoring & investors demo.
 */
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    service: "ZENZORO backend active",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/price
 * Returns BTC price.
 * - If COIN_API_URL env is set, it tries to fetch real data.
 * - Otherwise returns a fake demo price so app always works.
 */
app.get("/api/price", async (req, res) => {
  try {
    const apiUrl =
      process.env.COIN_API_URL ||
      ""; // leave empty to use fake data by default

    if (!apiUrl) {
      // demo / offline / no API key
      return res.json({
        symbol: "BTC",
        price: 92750,
        source: "demo-fake-data",
      });
    }

    const r = await fetch(apiUrl);
    const data = await r.json();

    // Try a few common response shapes
    let price = null;

    // Example: Coindesk: { bpi: { USD: { rate_float: ... } } }
    if (data?.bpi?.USD?.rate_float) {
      price = data.bpi.USD.rate_float;
    }

    // Example: Coingecko simple price:
    // { bitcoin: { usd: 12345 } }
    if (!price && data?.bitcoin?.usd) {
      price = data.bitcoin.usd;
    }

    // Generic price field fallback
    if (!price && typeof data.price === "number") {
      price = data.price;
    }

    if (!price) {
      price = 0;
    }

    res.json({
      symbol: "BTC",
      price,
      source: apiUrl,
    });
  } catch (err) {
    console.error("Error in /api/price:", err.message);
    res.status(500).json({ error: "price_fetch_failed" });
  }
});

// For any unknown route, send back index.html (single-page app)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ZENZORO server listening on port ${PORT}`);
});
