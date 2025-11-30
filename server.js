// server.js - ZENZORO production backend
const path = require("path");
const express = require("express");
const cors = require("cors");
const { getPrices, getHistory } = require("./backend/cryptoService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Health check
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro backend",
    time: new Date().toISOString()
  });
});

// Current prices for multiple coins
// GET /api/prices?symbols=btc,eth,sol,bnb,doge
app.get("/api/prices", async (req, res) => {
  try {
    const symbolsParam = req.query.symbols || "btc,eth,sol,bnb,doge";
    const symbols = symbolsParam.split(",").map((s) => s.trim().toLowerCase());
    const data = await getPrices(symbols);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("Error in /api/prices:", err);
    res.status(500).json({ ok: false, error: "Failed to load prices" });
  }
});

// Historical price data (for chart)
// GET /api/history/btc?days=7
app.get("/api/history/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toLowerCase();
    const days = parseInt(req.query.days || "7", 10);
    const history = await getHistory(symbol, days);
    res.json({ ok: true, symbol, history });
  } catch (err) {
    console.error("Error in /api/history:", err);
    res.status(500).json({ ok: false, error: "Failed to load history" });
  }
});

// Fallback: always return index.html for unknown routes (SPA-style)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Railway / local port
const PORT =
  process.env.PORT ||
  process.env.RAILWAY_PORT ||
  process.env.NODE_PORT ||
  8080;

app.listen(PORT, () => {
  console.log(`ZENZORO backend running on port ${PORT}`);
});
