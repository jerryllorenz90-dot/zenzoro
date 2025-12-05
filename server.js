import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------
// DATABASE CONNECTION
// -----------------------------
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in environment variables");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000
    })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    });

// -----------------------------
// SIMPLE STATUS CHECK ROUTE
// -----------------------------
app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        service: "Zenzoro Backend",
        time: new Date().toISOString()
    });
});

// -----------------------------
// DEFAULT ROOT MESSAGE
// -----------------------------
app.get("/", (req, res) => {
    res.send("🚀 Zenzoro Backend is Running Successfully");
});

// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
);