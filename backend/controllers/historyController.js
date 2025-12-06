const historyService = require("../services/historyService");

exports.getHistory = async (req, res) => {
  try {
    const data = await historyService.fetchHistory(req.query.coin, req.query.days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};