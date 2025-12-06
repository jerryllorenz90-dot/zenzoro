// Base URL for API (same origin as frontend when deployed on Railway)
const API_BASE = window.location.origin;

// DOM elements
const statusChip = document.getElementById('statusChip');
const statusLabel = document.getElementById('statusLabel');
const statusOutput = document.getElementById('statusOutput');
const btnCheckStatus = document.getElementById('btnCheckStatus');

const pricesGrid = document.getElementById('pricesGrid');
const pricesError = document.getElementById('pricesError');
const btnRefreshPrices = document.getElementById('btnRefreshPrices');
const symbolPills = document.getElementById('symbolPills');

const historyForm = document.getElementById('historyForm');
const historySymbol = document.getElementById('historySymbol');
const historyRange = document.getElementById('historyRange');
const historyOutput = document.getElementById('historyOutput');
const historyError = document.getElementById('historyError');

// ---------- Helpers ----------
function setStatusOnline(isOnline) {
  if (!statusChip) return;
  statusChip.querySelector('.dot').className = 'dot ' + (isOnline ? 'dot-online' : 'dot-offline');
  statusChip.style.background = isOnline
    ? 'rgba(9, 227, 138, 0.08)'
    : 'rgba(245, 193, 74, 0.12)';
  statusChip.style.borderColor = isOnline
    ? 'rgba(9, 227, 138, 0.55)'
    : 'rgba(245, 193, 74, 0.55)';
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ---------- Server Status ----------
async function fetchStatus() {
  statusLabel.textContent = 'Checking…';
  setStatusOnline(false);
  statusOutput.textContent = '// requesting /api/status …';

  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    statusOutput.textContent = prettyJson(data);
    if (data && data.status === 'ok') {
      statusLabel.textContent = 'Online';
      setStatusOnline(true);
    } else {
      statusLabel.textContent = 'Degraded';
    }
  } catch (err) {
    statusLabel.textContent = 'Offline';
    statusOutput.textContent = `// Failed to reach backend\n${err.message}`;
  }
}

// ---------- Market Prices ----------
function getActiveSymbol() {
  const active = symbolPills.querySelector('.pill.active');
  return active ? active.dataset.symbol : 'BTC';
}

function setActiveSymbol(symbol) {
  symbolPills.querySelectorAll('.pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.symbol === symbol);
  });
}

async function fetchPrices(symbolOverride) {
  const symbol = symbolOverride || getActiveSymbol();
  setActiveSymbol(symbol);

  pricesError.hidden = true;
  pricesError.textContent = '';
  pricesGrid.innerHTML = '<div class="muted small">Loading prices…</div>';

  try {
    const res = await fetch(`${API_BASE}/api/prices?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data && data.error ? data.error : 'Failed to load prices');
    }

    const list = Array.isArray(data) ? data : data.prices;

    if (!list || !list.length) {
      pricesGrid.innerHTML = '<div class="muted small">No price data available.</div>';
      return;
    }

    pricesGrid.innerHTML = list
      .map((coin) => {
        const change = Number(coin.change24h || 0);
        const price = Number(coin.priceUsd || coin.price || 0);
        const mc = Number(coin.marketCap || 0);
        const vol = Number(coin.volume24h || 0);

        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changePrefix = change >= 0 ? '+' : '';

        const fmt = (n) =>
          n >= 1_000_000_000
            ? `$${(n / 1_000_000_000).toFixed(2)}B`
            : n >= 1_000_000
            ? `$${(n / 1_000_000).toFixed(2)}M`
            : `$${n.toFixed(2)}`;

        return `
          <article class="price-card">
            <div>
              <div class="price-card-header">
                <span class="price-symbol">${coin.symbol || symbol}</span>
                <span class="price-name">${coin.name || ''}</span>
              </div>
              <div class="price-value">$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div class="price-change ${changeClass}">
                ${changePrefix}${change.toFixed(2)}% (24h)
              </div>
              <div class="price-meta">Mkt Cap: ${fmt(mc)}</div>
              <div class="price-meta">Vol 24h: ${fmt(vol)}</div>
            </div>
          </article>
        `;
      })
      .join('');
  } catch (err) {
    pricesGrid.innerHTML = '';
    pricesError.textContent = err.message || 'Unable to load prices.';
    pricesError.hidden = false;
  }
}

// ---------- History ----------
async function fetchHistory(symbol, range) {
  historyError.hidden = true;
  historyError.textContent = '';
  historyOutput.textContent = '// loading history…';

  try {
    const res = await fetch(
      `${API_BASE}/api/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(
        range,
      )}`,
    );
    const data = await res.json();

    if (!res.ok) {
      // CoinGecko sometimes returns "string did not match the expected pattern."
      const msg = data && data.error ? data.error : 'Failed to load history.';
      throw new Error(msg);
    }

    historyOutput.textContent = prettyJson(data);
  } catch (err) {
    historyOutput.textContent = '';
    historyError.textContent = err.message || 'Unable to load history.';
    historyError.hidden = false;
  }
}

// ---------- Event wiring ----------
btnCheckStatus.addEventListener('click', fetchStatus);
btnRefreshPrices.addEventListener('click', () => fetchPrices());

symbolPills.addEventListener('click', (e) => {
  if (e.target.matches('.pill')) {
    const symbol = e.target.dataset.symbol;
    fetchPrices(symbol);
  }
});

historyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchHistory(historySymbol.value, historyRange.value);
});

// ---------- Initial load ----------
fetchStatus();
fetchPrices();
fetchHistory('BTC', '7d');