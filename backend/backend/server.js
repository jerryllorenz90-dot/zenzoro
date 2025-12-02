// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("MONGO_URI environment variable is NOT set");
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) =>
      console.error("❌ MongoDB connection error:", err.message)
    );
}

// --- API routes ---

// Health check
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    service: "Zenzoro backend",
    time: new Date().toISOString(),
  });
});

// (later we can add /api/user, /api/portfolio, etc.)

// --- Static frontend ---
// Serve files from /public as the frontend
app.use(express.static(path.join(__dirname, "../public")));

// For any other route, send index.html (so the UI always loads)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
