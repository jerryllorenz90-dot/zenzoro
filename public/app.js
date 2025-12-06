// public/app.js

const API_BASE = "/api";

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function checkStatus() {
  const box = document.getElementById("statusResult");
  box.textContent = "Checking backend status...";
  try {
    const data = await safeFetch(`${API_BASE}/status`);
    box.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    box.textContent = `Error: ${err.message}`;
  }
}

async function loadOverview(symbol) {
  const box = document.getElementById("overviewResult");
  box.textContent = `Loading overview for ${symbol.toUpperCase()}...`;
  try {
    const data = await safeFetch(
      `${API_BASE}/overview?symbol=${encodeURIComponent(symbol)}`
    );
    box.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    box.textContent = `Error: ${err.message}`;
  }
}

async function loadHistory() {
  const symbolSelect = document.getElementById("historySymbol");
  const daysSelect = document.getElementById("historyDays");
  const box = document.getElementById("historyResult");

  const symbol = symbolSelect.value;
  const days = daysSelect.value;

  box.textContent = `Loading history for ${symbol.toUpperCase()} (${days} days)...`;

  try {
    const data = await safeFetch(
      `${API_BASE}/history?symbol=${encodeURIComponent(
        symbol
      )}&days=${encodeURIComponent(days)}`
    );
    box.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    box.textContent = `Error: ${err.message}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  // Optional: auto-load BTC overview on page load
  loadOverview("btc").catch(() => {});
});