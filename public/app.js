const { useState, useEffect, useRef } = React;

// Coins we show in the UI
const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
];

// ---------- Helpers ----------
function formatNumber(n) {
  if (n == null || isNaN(n)) return "–";
  if (Math.abs(n) >= 1_000_000_000_000) {
    return "$" + (n / 1_000_000_000_000).toFixed(2) + "T";
  }
  if (Math.abs(n) >= 1_000_000_000) {
    return "$" + (n / 1_000_000_000).toFixed(2) + "B";
  }
  if (Math.abs(n) >= 1_000_000) {
    return "$" + (n / 1_000_000).toFixed(2) + "M";
  }
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPrice(n) {
  if (n == null || isNaN(n)) return "–";
  if (n > 1000) return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n > 1) return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return "$" + n.toFixed(4);
}

function formatPercent(p) {
  if (p == null || isNaN(p)) return "–";
  const sign = p >= 0 ? "+" : "";
  return sign + p.toFixed(2) + "%";
}

function formatTimeIso(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

// ---------- Components ----------

function App() {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const [market, setMarket] = useState([]);
  const [marketRaw, setMarketRaw] = useState(null);
  const [marketError, setMarketError] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [historyRaw, setHistoryRaw] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // ---- Fetch backend status ----
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/status");
        const json = await res.json();
        setStatus(json);
        setStatusError(null);
      } catch (err) {
        console.error("Status error", err);
        setStatusError("Failed to reach backend.");
      }
    }
    loadStatus();
  }, []);

  // ---- Fetch market data ----
  async function loadMarket() {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const res = await fetch("/api/market");
      const json = await res.json();
      setMarketRaw(json);

      let coinsArray = [];
      if (Array.isArray(json)) coinsArray = json;
      else if (Array.isArray(json.coins)) coinsArray = json.coins;
      else if (Array.isArray(json.data)) coinsArray = json.data;

      const normalized = coinsArray.map((c) => {
        // Try common field names with fallbacks
        return {
          id: c.id || c.coinId || c.symbol?.toLowerCase() || "",
          symbol: (c.symbol || c.ticker || "").toUpperCase(),
          name: c.name || c.fullName || c.symbol || "Unknown",
          price:
            c.current_price ??
            c.price ??
            c.last ??
            c.value ??
            null,
          change24h:
            c.price_change_percentage_24h ??
            c.change24h ??
            c.change ??
            null,
          marketCap: c.market_cap ?? c.marketCap ?? null,
          volume24h: c.total_volume ?? c.volume24h ?? c.volume ?? null,
        };
      });

      setMarket(normalized);
    } catch (err) {
      console.error("Market error", err);
      setMarketError("Failed to load market data.");
      setMarket([]);
      setMarketRaw(null);
    } finally {
      setMarketLoading(false);
    }
  }

  // ---- Fetch history data ----
  async function loadHistory(coin) {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`/api/history/${coin.id}`);
      const json = await res.json();
      setHistoryRaw(json);

      let rawPoints = [];
      if (Array.isArray(json)) rawPoints = json;
      else if (Array.isArray(json.prices)) rawPoints = json.prices;
      else if (Array.isArray(json.data)) rawPoints = json.data;

      // Accept [timestamp, price] or { time, price }
      const points = rawPoints
        .map((p) => {
          if (Array.isArray(p) && p.length >= 2) {
            return { t: p[0], y: p[1] };
          }
          if (typeof p === "object" && p !== null) {
            return { t: p.t || p.time || p.timestamp, y: p.y || p.price };
          }
          return null;
        })
        .filter(Boolean);

      setHistoryPoints(points);
    } catch (err) {
      console.error("History error", err);
      setHistoryError("Failed to load history data.");
      setHistoryPoints([]);
      setHistoryRaw(null);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadMarket();
    loadHistory(selectedCoin);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload history when coin changes
  useEffect(() => {
    loadHistory(selectedCoin);
  }, [selectedCoin]);

  // ---- Setup / update Chart.js ----
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!historyPoints || historyPoints.length === 0) {
      return;
    }

    const labels = historyPoints.map((p) =>
      new Date(p.t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    );
    const data = historyPoints.map((p) => p.y);

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${selectedCoin.symbol} price`,
            data,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            borderColor: "rgba(204, 153, 255, 1)",
            backgroundColor: "rgba(204, 153, 255, 0.15)",
            fill: true,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: {
              color: "#b9b0ff",
              maxTicksLimit: 6,
            },
            grid: {
              color: "rgba(120, 102, 214, 0.2)",
            },
          },
          y: {
            ticks: {
              color: "#b9b0ff",
              callback: (value) => "$" + value.toLocaleString(),
            },
            grid: {
              color: "rgba(120, 102, 214, 0.15)",
            },
          },
        },
      },
    });
  }, [historyPoints, selectedCoin]);

  // ---- Render ----
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-circle">
            <span className="app-logo-letter">Z</span>
          </div>
          <div className="app-title-block">
            <h1>Zenzoro Crypto Monitor</h1>
            <p>Live market overview & 7-day history for top coins.</p>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-pill">
            <span className="status-dot" />
            <span>
              Backend:&nbsp;
              {statusError
                ? "offline"
                : status?.status === "ok"
                ? "online"
                : "checking..."}
            </span>
          </div>
          {status?.time && (
            <span className="status-meta">
              Updated: {formatTimeIso(status.time)}
            </span>
          )}
        </div>
        {statusError && <div className="error-text">{statusError}</div>}
      </header>

      <main className="grid">
        {/* Market overview */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Market Overview</h2>
              <div className="card-subtitle">
                BTC, ETH, SOL, BNB, DOGE — live snapshot
              </div>
            </div>
            <button
              onClick={loadMarket}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(195,175,255,0.7)",
                background:
                  "linear-gradient(135deg, #6f5fff, #ff8ad4 140%)",
                color: "#fff",
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {marketLoading && (
            <div className="loading-text">Loading latest prices…</div>
          )}
          {marketError && <div className="error-text">{marketError}</div>}

          <div className="market-grid">
            {market.map((coin) => (
              <article key={coin.id || coin.symbol} className="market-card">
                <div className="market-symbol">{coin.symbol}</div>
                <div className="market-name">{coin.name}</div>
                <div className="market-price">
                  {formatPrice(coin.price)}
                </div>
                <div className="market-row">
                  <span
                    className={
                      coin.change24h >= 0 ? "badge-up" : "badge-down"
                    }
                  >
                    {formatPercent(coin.change24h)} (24h)
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    Mkt cap: {formatNumber(coin.marketCap)}
                  </span>
                </div>
                <div className="market-row">
                  Vol 24h: {formatNumber(coin.volume24h)}
                </div>
              </article>
            ))}

            {!marketLoading && market.length === 0 && (
              <div className="loading-text">
                No normalized market data yet — check the debug JSON below to
                confirm the backend response.
              </div>
            )}
          </div>

          {marketRaw && (
            <div className="debug-box">
              <div style={{ marginBottom: 4, color: "#a99fff" }}>
                Market API raw response
              </div>
              <pre>{JSON.stringify(marketRaw, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* History chart */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">7-Day History</h2>
              <div className="card-subtitle">
                Close prices for the selected coin
              </div>
            </div>
          </div>

          <div className="coin-tabs">
            {COINS.map((c) => (
              <button
                key={c.id}
                className={
                  "coin-tab" +
                  (c.id === selectedCoin.id ? " active" : "")
                }
                onClick={() => setSelectedCoin(c)}
              >
                {c.symbol}
              </button>
            ))}
          </div>

          <div className="chart-wrapper">
            <div className="chart-legend">
              <span>
                {selectedCoin.name} ({selectedCoin.symbol})
              </span>
              <span style={{ fontSize: 11, color: "#b0a7ff" }}>
                Range: last 7 days
              </span>
            </div>

            <canvas
              ref={chartRef}
              style={{ width: "100%", height: 220, marginTop: 8 }}
            />
          </div>

          {historyLoading && (
            <div className="loading-text">Loading chart data…</div>
          )}
          {historyError && (
            <div className="error-text">{historyError}</div>
          )}
          {!historyLoading && historyPoints.length === 0 && !historyError && (
            <div className="loading-text">
              No history points — check the raw JSON below to make sure the
              backend is returning a `prices` array or similar.
            </div>
          )}

          <div className="helper-text">
            Tip: if you change your backend response shape later, the chart
            will still try to adapt.
          </div>

          {historyRaw && (
            <div className="debug-box">
              <div style={{ marginBottom: 4, color: "#a99fff" }}>
                History API raw response
              </div>
              <pre>{JSON.stringify(historyRaw, null, 2)}</pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);