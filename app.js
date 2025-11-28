// SELECT ELEMENTS
const statusBox = document.getElementById("server-status");
const priceBox  = document.getElementById("btc-price");

// BASE API URL
const API = "https://zenzoro.online/api";

// HANDLE SERVER STATUS
document.getElementById("check-status").addEventListener("click", async () => {
  statusBox.textContent = "Checking...";
  try {
    const res = await fetch(`${API}/status`);
    const data = await res.json();
    statusBox.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    statusBox.textContent = "Error: " + err.message;
  }
});

// HANDLE BTC PRICE
document.getElementById("get-btc").addEventListener("click", async () => {
  priceBox.textContent = "Loading...";
  try {
    const res = await fetch(`${API}/price/btc`);
    const data = await res.json();
    priceBox.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    priceBox.textContent = "Error: " + err.message;
  }
});
