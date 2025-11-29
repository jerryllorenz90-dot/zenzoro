const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Health check
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running!" });
});

// BTC Price route
app.get("/api/price/btc", async (req, res) => {
  res.json({ btc: "78000" });
});
// Root
app.get("/", (req, res) => {
  res.send("Zenzoro Backend Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
