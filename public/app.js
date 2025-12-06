// Coins we support
const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" }
];

let historyChart = null;

function formatUSD(value) {
  if (value == null || isNaN(value)) return "-";
  if (value >= 1_000_000_000) return "$" + (value / 1_000_000_000).toFixed(2) + "B";
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(2) + "K";
  return "$" + value.toFixed(2);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

/* STATUS */

async function loadStatus() {
  const box = document.getElementById("status-box");
  box.textContent = "Checking backend status...";
  try {
    const json = await fetchJSON("/api/status");
    box.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    console.error(err);
    box.textContent = "Error loading status: " + err.message;
  }
}

/* MARKET OVERVIEW */

function renderCoinTabs(activeId) {
  const tabsEl = document.getElementById("coin-tabs");
  tabsEl.innerHTML = "";

  COINS.forEach((coin) => {
    const btn = document.createElement("button");
    btn.className = "coin-tab" + (coin.id === activeId ? " active" : "");
    btn.textContent = coin.symbol;
    btn.dataset.coinId = coin.id;
    tabsEl.appendChild(btn);
  });
}

function renderMarketCard(coin, coinData) {
  const wrapper = document.createElement("div");
  wrapper.className = "market-card";

  const price = coinData?.usd;
  const change = coinData?.usd_24h_change;
  const cap = coinData?.usd_market_cap;
  const vol = coinData?.usd_24h_vol;

  const changeClass =
    typeof change === "number"
      ? change >= 0
        ? "positive"
        : "negative"
      : "";

  const changeText =
    typeof change === "number" ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% (24h)` : "-";

  wrapper.innerHTML = `
    <div class="market-header">
      <div>
        <div class="market-symbol">${coin.symbol}</div>
        <div class="market-name">${coin.name}</div>
      </div>
    </div>
    <div class="market-price">${price != null ? formatUSD(price) : "-"}</div>
    <div class="market-change ${changeClass}">${changeText}</div>
    <div class="market-meta">
      Mkt Cap: ${cap != null ? formatUSD(cap) : "-"}<br/>
      Vol (24h): ${vol != null ? formatUSD(vol) : "-"}
    </div>
  `;

  return wrapper;
}

async function loadMarketOverview() {
  const container = document.getElementById("market-cards");
  container.innerHTML = "";

  for (const coin of COINS) {
    const cardShell = document.createElement("div");
    cardShell.className = "market-card";
    cardShell.innerHTML = `
      <div class="market-header">
        <div>
          <div class="market-symbol">${coin.symbol}</div>
          <div class="market-name">${coin.name}</div>
        </div>
      </div>
      <div class="market-price">Loading...</div>
    `;
    container.appendChild(cardShell);

    try {
      const data = await fetchJSON(`/api/prices?coin=${encodeURIComponent(coin.id)}`);
      const details = data[coin.id];
      const fullCard = renderMarketCard(coin, details);
      container.replaceChild(fullCard, cardShell);
    } catch (err) {
      console.error(err);
      cardShell.querySelector(".market-price").textContent = "Error loading";
    }
  }
}

/* HISTORY CHART */

function buildChartConfig(labels, data) {
  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Price (USD)",
          data,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(123, 92, 255, 0.25)",
          borderColor: "rgba(189, 157, 255, 1)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#9b93c7",
            maxTicksLimit: 7
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: "#9b93c7",
            callback: (v) => "$" + v.toLocaleString()
          },
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => formatUSD(ctx.parsed.y)
          }
        }
      }
    }
  };
}

async function loadHistoryChart() {
  const coinId = document.getElementById("history-coin").value;
  const days = document.getElementById("history-range").value;
  const errorEl = document.getElementById("history-error");
  errorEl.textContent = "";

  try {
    const json = await fetchJSON(
      `/api/history?coin=${encodeURIComponent(coinId)}&days=${encodeURIComponent(days)}`
    );

    const prices = json.prices || [];
    if (!prices.length) {
      throw new Error("No history data available");
    }

    const labels = prices.map(([ts]) => {
      const d = new Date(ts);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const values = prices.map(([, price]) => price);

    const ctx = document.getElementById("history-chart").getContext("2d");

    if (historyChart) historyChart.destroy();
    historyChart = new Chart(ctx, buildChartConfig(labels, values));
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Failed to load chart data.";
  }
}

/* INIT */

function initEvents() {
  document
    .getElementById("refresh-status")
    .addEventListener("click", loadStatus);

  document
    .getElementById("refresh-prices")
    .addEventListener("click", loadMarketOverview);

  document
    .getElementById("history-coin")
    .addEventListener("change", loadHistoryChart);

  document
    .getElementById("history-range")
    .addEventListener("change", loadHistoryChart);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCoinTabs("bitcoin");
  initEvents();
  loadStatus();
  loadMarketOverview();
  loadHistoryChart();
});