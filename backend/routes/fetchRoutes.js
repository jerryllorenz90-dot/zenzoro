const express = require("express");
const router = express.Router();
const { getData } = require("../controllers/fetchController");

router.get("/", getData);

module.exports = router;