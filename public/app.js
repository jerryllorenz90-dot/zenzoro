const API = "https://zenzoro.online";

/* Update server status badge */
async function checkServer() {
    try {
        const res = await fetch(`${API}/api/status`);
        const data = await res.json();

        document.getElementById("serverStatus").textContent = "Online";
        document.getElementById("serverStatus").style.background = "#0fa958";

        document.getElementById("serverResult").textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById("serverStatus").textContent = "Offline";
        document.getElementById("serverStatus").style.background = "#a50e0e";
    }
}

/* Load market prices */
async function loadPrices() {
    try {
        const res = await fetch(`${API}/api/prices`);
        const data = await res.json();

        document.getElementById("priceDisplay").textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById("priceDisplay").textContent = "Error loading data.";
    }
}

/* Load price history */
async function loadHistory() {
    const symbol = document.getElementById("historySymbol").value;
    const range = document.getElementById("historyRange").value;

    try {
        const res = await fetch(`${API}/api/history?symbol=${symbol}&range=${range}`);
        const data = await res.json();

        document.getElementById("historyOutput").textContent =
            JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById("historyOutput").textContent = "Error loading history.";
    }
}

/* Select a token */
function selectToken(symbol) {
    document.getElementById("historySymbol").value = symbol;
}