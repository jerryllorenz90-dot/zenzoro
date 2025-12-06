const fetchService = require("../services/fetchService");

exports.getData = async (req, res) => {
  try {
    const data = await fetchService.fetchData(req.query.endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};