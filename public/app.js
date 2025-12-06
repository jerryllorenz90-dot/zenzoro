// public/app.js

// ===== Helpers =====
const statusOutput = document.getElementById('status-output');
const marketCards = document.getElementById('market-cards');
const marketError = document.getElementById('market-error');
const historyError = document.getElementById('history-error');
const yearSpan = document.getElementById('year');

yearSpan.textContent = new Date().getFullYear();

const API_BASE = '/api';

// Auth state
let authMode = 'login'; // 'login' | 'register'
let authToken = localStorage.getItem('zenzoro_token') || null;

// ===== AUTH UI =====
const authOverlay = document.getElementById('auth-overlay');
const openAuthBtn = document.getElementById('open-auth');
const closeAuthBtn = document.getElementById('close-auth');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const userInfo = document.getElementById('user-info');
const userEmailLabel = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

function openAuth(initialMode = 'login') {
  authMode = initialMode;
  authOverlay.classList.remove('hidden');
  authError.textContent = '';
  authEmail.value = '';
  authPassword.value = '';
  updateAuthModeText();
}

function closeAuth() {
  authOverlay.classList.add('hidden');
}

function updateAuthModeText() {
  if (authMode === 'login') {
    authTitle.textContent = 'Sign in';
    authSubmit.textContent = 'Sign in';
    switchToRegister.classList.remove('hidden');
    switchToLogin.classList.add('hidden');
  } else {
    authTitle.textContent = 'Create account';
    authSubmit.textContent = 'Create account';
    switchToRegister.classList.add('hidden');
    switchToLogin.classList.remove('hidden');
  }
}

openAuthBtn.addEventListener('click', () => openAuth('login'));
closeAuthBtn.addEventListener('click', closeAuth);

switchToRegister.addEventListener('click', () => {
  authMode = 'register';
  updateAuthModeText();
});

switchToLogin.addEventListener('click', () => {
  authMode = 'login';
  updateAuthModeText();
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    authError.textContent = 'Please enter email and password.';
    return;
  }

  const endpoint =
    authMode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      authError.textContent = data.error || 'Authentication failed.';
      return;
    }

    authToken = data.token;
    localStorage.setItem('zenzoro_token', authToken);
    setLoggedInUser(data.user.email);
    closeAuth();
  } catch (err) {
    console.error(err);
    authError.textContent = 'Network error. Try again.';
  }
});

logoutBtn.addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('zenzoro_token');
  userInfo.classList.add('hidden');
  openAuthBtn.classList.remove('hidden');
});

function setLoggedInUser(email) {
  userEmailLabel.textContent = email;
  userInfo.classList.remove('hidden');
  openAuthBtn.classList.add('hidden');
}

// validate token on load (if any)
async function bootstrapAuth() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) {
      throw new Error('invalid token');
    }
    const data = await res.json();
    if (data.user && data.user.email) {
      setLoggedInUser(data.user.email);
    }
  } catch {
    authToken = null;
    localStorage.removeItem('zenzoro_token');
  }
}

// ===== STATUS =====
document.getElementById('check-status').addEventListener('click', async () => {
  statusOutput.textContent = 'Checking server status...';
  try {
    const res = await fetch(`${API_BASE}/status`);
    const json = await res.json();
    statusOutput.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    console.error(err);
    statusOutput.textContent = 'Error: could not reach backend.';
  }
});

// ===== MARKET OVERVIEW =====
const symbolTabs = document.getElementById('symbol-tabs');

symbolTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-symbol]');
  if (!btn) return;

  document
    .querySelectorAll('#symbol-tabs .pill')
    .forEach((el) => el.classList.remove('pill-active'));
  btn.classList.add('pill-active');
});

async function loadMarket() {
  marketError.classList.add('hidden');
  marketError.textContent = '';
  marketCards.innerHTML = '<p class="text-muted">Loading market data…</p>';

  try {
    const res = await fetch(`${API_BASE}/market`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to load market data.');
    }

    const coins = Array.isArray(data.coins) ? data.coins : data;

    if (!Array.isArray(coins) || !coins.length) {
      throw new Error('No market data available.');
    }

    marketCards.innerHTML = '';
    coins.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'market-card';

      const changeClass =
        c.change24h > 0 ? 'market-change positive' : 'market-change negative';
      const change =
        typeof c.change24h === 'number' ? c.change24h.toFixed(2) : c.change24h;

      card.innerHTML = `
        <div class="market-left">
          <h3>${c.symbol || ''}</h3>
          <p class="name">${c.name || ''}</p>
          <p class="price">$${Number(c.price).toLocaleString()}</p>
        </div>
        <div class="market-right">
          <div class="${changeClass}">
            ${change}% (24h)
          </div>
          <div>Mkt Cap: $${Number(c.marketCap || 0).toLocaleString()}</div>
          <div>Vol 24h: $${Number(c.volume24h || 0).toLocaleString()}</div>
        </div>
      `;

      marketCards.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    marketCards.innerHTML = '';
    marketError.textContent = err.message || 'Failed to load market data.';
    marketError.classList.remove('hidden');
  }
}

document.getElementById('refresh-market').addEventListener('click', loadMarket);

// ===== HISTORY CHART =====
const historySymbol = document.getElementById('history-symbol');
const historyRange = document.getElementById('history-range');
const historyBtn = document.getElementById('refresh-history');

let chartInstance = null;

async function loadHistory() {
  historyError.classList.add('hidden');
  historyError.textContent = '';

  const symbol = historySymbol.value;
  const range = historyRange.value;

  try {
    const url = `${API_BASE}/history/${encodeURIComponent(symbol)}?range=${encodeURIComponent(
      range
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to load history data.');
    }

    const points = Array.isArray(data.prices) ? data.prices : data;

    if (!Array.isArray(points) || !points.length) {
      throw new Error('No history data available.');
    }

    const labels = points.map((p) =>
      typeof p.time === 'string'
        ? new Date(p.time).toLocaleDateString()
        : new Date(p[0]).toLocaleDateString()
    );
    const prices = points.map((p) =>
      typeof p.price === 'number' ? p.price : p[1]
    );

    const ctx = document.getElementById('history-chart').getContext('2d');

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${symbol} price`,
            data: prices,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.18)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              maxTicksLimit: 6
            },
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              color: '#9ca3af',
              callback: (value) => '$' + value.toLocaleString()
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.2)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  } catch (err) {
    console.error(err);
    historyError.textContent = err.message || 'Failed to load chart data.';
    historyError.classList.remove('hidden');
  }
}

historyBtn.addEventListener('click', loadHistory);

// ===== INITIAL LOAD =====
(async function init() {
  await bootstrapAuth();
  loadMarket();
  loadHistory();
  // optional: auto-check status once
  try {
    const res = await fetch(`${API_BASE}/status`);
    const json = await res.json();
    statusOutput.textContent = JSON.stringify(json, null, 2);
  } catch {
    // ignore
  }
})();