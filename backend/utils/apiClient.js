const axios = require("axios");

const apiClient = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 10000,
});

module.exports = apiClient;