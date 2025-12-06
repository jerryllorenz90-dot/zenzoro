const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Simple status route
app.get("/", (req, res) => {
  res.send("Zenzoro Backend Running Successfully 🚀");
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro Backend",
    time: new Date().toISOString(),
  });
});

// Import API routes
const priceRoutes = require("./routes/priceRoutes");
const historyRoutes = require("./routes/historyRoutes");
const fetchRoutes = require("./routes/fetchRoutes");

// Register routes
app.use("/api/prices", priceRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/fetch", fetchRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));