const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config();

const connectDB = require("./db");

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database
connectDB();

// Routes
app.use("/api/crypto", require("./routes/cryptoRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// ----------------------------
// Serve Frontend Build
// ----------------------------
app.use(express.static(path.join(__dirname, "../public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Server ready on port ${PORT}`)
);