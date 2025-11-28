const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/status", statusRoute);
app.use("/api/prices", pricesRoute);
app.use("/api/history", historyRoute);

// RAILWAY PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Zenzoro backend running on port ${PORT}`);
});
