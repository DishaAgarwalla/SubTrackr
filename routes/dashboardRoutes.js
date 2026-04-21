const express = require("express");
const router = express.Router();
const { getSummary, getSpendingHistory, getInsights } = require("../controllers/dashboardController");
const { authenticate, requirePremium } = require("../middleware/auth");

router.use(authenticate);

router.get("/summary", getSummary);                          // GET /api/dashboard/summary
router.get("/spending-history", getSpendingHistory);         // GET /api/dashboard/spending-history
router.get("/insights", requirePremium, getInsights);        // GET /api/dashboard/insights (Premium)

module.exports = router;
