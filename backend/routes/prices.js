import express from "express";
import { getPrices } from "../controllers/priceController.js";

const router = express.Router();

router.get("/", getPrices);

export default router;