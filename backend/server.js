// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./db');
const cryptoRoutes = require('./routes/cryptoRoutes'); // keep your existing crypto APIs
const authRoutes = require('./routes/authRoutes');     // NEW

const app = express();
const PORT = process.env.PORT || 8080;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== API ROUTES =====
app.use('/api', cryptoRoutes);      // status, market, history etc.
app.use('/api/auth', authRoutes);   // register, login, me

// ===== STATIC FRONTEND =====
app.use(express.static(path.join(__dirname, '../public')));

// For any unknown route, serve index.html (so / also works)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ===== START SERVER =====
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Zenzoro backend running on port ${PORT}`);
});