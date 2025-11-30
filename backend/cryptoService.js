// backend/cryptoService.js
// Handles all calls to CoinGecko

const SYMBOL_MAP = {
  btc: { id: "bitcoin", name: "Bitcoin" },
  eth: { id: "ethereum", name: "Ethereum" },
  sol: { id: "solana", name: "Solana" },
  bnb: { id: "binancecoin", name: "BNB" },
  doge: { id: "dogecoin", name: "Dogecoin" }
};

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Zenzoro-Dashboard"
    }
  });
  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}`);
  }
  return res.json();
}

// Get current prices for selected symbols
async function getPrices(symbols) {
  const validSymbols = symbols.filter((s) => SYMBOL_MAP[s]);
  if (validSymbols.length === 0) {
    throw new Error("No valid symbols requested");
  }

  const ids = validSymbols.map((s) => SYMBOL_MAP[s].id).join(",");

  const url = `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(ids)}` +
    "&vs_currencies=usd" +
    "&include_24hr_change=true" +
    "&include_market_cap=true" +
    "&include_24hr_vol=true" +
    "&precision=2";

  const raw = await fetchJson(url);

  const result = validSymbols.map((symbol) => {
    const { id, name } = SYMBOL_MAP[symbol];
    const item = raw[id];

    return {
      symbol: symbol.toUpperCase(),
      name,
      price: item?.usd ?? null,
      change24h: item?.usd_24h_change ?? null,
      marketCap: item?.usd_market_cap ?? null,
      volume24h: item?.usd_24h_vol ?? null
    };
  });

  return result;
}

// Get price history for a single symbol
async function getHistory(symbol, days) {
  const info = SYMBOL_MAP[symbol];
  if (!info) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  const url = `${COINGECKO_BASE}/coins/${info.id}/market_chart` +
    `?vs_currency=usd&days=${days}&precision=2`;

  const raw = await fetchJson(url);

  // raw.prices: [ [timestamp, price], ... ]
  const history = (raw.prices || []).map(([ts, price]) => ({
    time: ts,
    price
  }));

  return history;
}

module.exports = {
  getPrices,
  getHistory
};
