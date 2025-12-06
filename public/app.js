const API = "/api";

async function checkStatus() {
  const res = await fetch(`${API}/status`);
  const data = await res.json();
  document.getElementById("statusOutput").textContent = JSON.stringify(data, null, 2);
}

async function loadOverview(symbol) {
  const res = await fetch(`${API}/overview?symbol=${symbol}`);
  const data = await res.json();
  document.getElementById("overviewOutput").textContent = JSON.stringify(data, null, 2);
}

async function loadHistory() {
  const symbol = document.getElementById("historySymbol").value;
  const range = document.getElementById("historyRange").value;

  const res = await fetch(`${API}/history?symbol=${symbol}&days=${range}`);
  const data = await res.json();

  document.getElementById("historyOutput").textContent = JSON.stringify(
    data,
    null,
    2
  );
}

// THEME SWITCHER
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});