// Zenzoro frontend logic

const API_BASE = "/api";

const statusBox = document.getElementById("status-box");
const marketGrid = document.getElementById("market-grid");
const coinTabs = document.getElementById("coin-tabs");
const historyTitle = document.getElementById("history-title");
const historySymbolSelect = document.getElementById("history-symbol");
const historyDaysSelect = document.getElementById("history-days");
const historyNote = document.getElementById("history-note");

let historyChart = null;

const DEFAULT_SYMBOLS = ["btc", "eth", "sol", "bnb", "doge"];

// --------------- helpers -----------------

function formatMoney(value) {
  if (value === null || value === undefined) return "–";
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatPrice(value) {
  if (value === null || value === undefined) return "–";
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `$${value.toFixed(4)}`;
}

// --------------- API calls -----------------

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}`);
  }
  return res.json();
}

// Status
async function loadStatus() {
  statusBox.textContent = "Checking backend...";
  try {
    const json = await apiGet("/status");
    statusBox.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    console.error(err);
    statusBox.textContent = `Error: ${err.message}`;
  }
}

// Market prices
async function loadMarket() {
  try {
    const params = `?symbols=${DEFAULT_SYMBOLS.join(",")}`;
    const json = await apiGet(`/prices${params}`);

    if (!json.ok) throw new Error("Backend returned error");

    const data = json.data;
    marketGrid.innerHTML = "";

    data.forEach((coin) => {
      const change = coin.change24h ?? 0;
      const changeClass =
        change > 0 ? "change-positive" : change < 0 ? "change-negative" : "";
      const changePrefix = change > 0 ? "+" : "";

      const card = document.createElement("div");
      card.className = "market-card-item";
      card.innerHTML = `
        <div class="market-symbol">${coin.symbol}</div>
        <div class="market-name">${coin.name}</div>
        <div class="market-price">${formatPrice(coin.price)}</div>
        <div class="market-sub">
          <span class="${changeClass}">
            ${changePrefix}${change.toFixed(2)}% (24h)
          </span>
        </div>
        <div class="market-sub">
          Mkt Cap: ${formatMoney(coin.marketCap)}<br/>
          Vol 24h: ${formatMoney(coin.volume24h)}
        </div>
      `;
      marketGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    marketGrid.innerHTML =
      '<p style="color:#f97373;font-size:13px;">Failed to load market data.</p>';
  }
}

// History chart
async function loadHistory() {
  const symbol = historySymbolSelect.value;
  const days = historyDaysSelect.value;

  historyTitle.textContent =
    `${symbol.toUpperCase()} – ${days === "1" ? "24h" : days + " Day"} History`;
  historyNote.textContent = "Loading chart...";

  try {
    const json = await apiGet(`/history/${symbol}?days=${days}`);
    if (!json.ok) throw new Error("Backend returned error");

    const points = json.history || [];
    if (!points.length) {
      historyNote.textContent = "No history data available.";
      if (historyChart) historyChart.destroy();
      return;
    }

    const labels = points.map((p) => {
      const d = new Date(p.time);
      if (days === "1") {
        return d.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
    });

    const prices = points.map((p) => p.price);

    const ctx = document.getElementById("history-chart").getContext("2d");
    if (historyChart) historyChart.destroy();

    historyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${symbol.toUpperCase()} price (USD)`,
            data: prices,
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 0,
            borderColor: "#a855ff",
            fill: true,
            backgroundColor: "rgba(168, 85, 255, 0.15)"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => formatPrice(ctx.parsed.y)
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#9ca3af",
              maxTicksLimit: 6
            },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: "#9ca3af",
              callback: (val) => `$${val}`
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)"
            }
          }
        }
      }
    });

    historyNote.textContent = `Data from CoinGecko – ${points.length} points loaded.`;
  } catch (err) {
    console.error(err);
    historyNote.textContent = "Failed to load chart data.";
  }
}

// Build top tabs
function initTabs() {
  coinTabs.innerHTML = "";
  DEFAULT_SYMBOLS.forEach((symbol, index) => {
    const tab = document.createElement("button");
    tab.className = "coin-tab" + (index === 0 ? " active" : "");
    tab.dataset.symbol = symbol;
    tab.textContent = symbol.toUpperCase();
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".coin-tab")
        .forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      historySymbolSelect.value = symbol;
      loadHistory();
    });
    coinTabs.appendChild(tab);
  });
}

// --------------- events -----------------

document
  .getElementById("check-status")
  .addEventListener("click", () => loadStatus());

document
  .getElementById("refresh-all")
  .addEventListener("click", () => {
    loadStatus();
    loadMarket();
    loadHistory();
  });

historySymbolSelect.addEventListener("change", loadHistory);
historyDaysSelect.addEventListener("change", loadHistory);

// --------------- init -----------------

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadStatus();
  loadMarket();
  loadHistory();

  // auto-refresh market every 60s
  setInterval(loadMarket, 60000);
});
