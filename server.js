// Enable ES module-style imports in Node
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// ---- DATABASE CONNECTION ----
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
    }
}
connectDB();

// ---- API ROUTES ----

// Health check
app.get("/api/status", (req, res) => {
    res.json({
        status: "ok",
        service: "Zenzoro backend",
        time: new Date().toISOString()
    });
});

// Example prices route (placeholder)
app.get("/api/price/:symbol", (req, res) => {
    res.json({ symbol: req.params.symbol, price: 0 });
});

// ---- START SERVER ----
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
