const express = require("express");
const router = express.Router();
const {
  getAll, getOne, create, update, remove, logUsage, getCategories,
} = require("../controllers/subscriptionController");
const { authenticate } = require("../middleware/auth");
const { validateSubscription } = require("../middleware/validate");

// All routes require authentication
router.use(authenticate);

router.get("/categories", getCategories);       // GET  /api/subscriptions/categories
router.get("/", getAll);                         // GET  /api/subscriptions
router.get("/:id", getOne);                      // GET  /api/subscriptions/:id
router.post("/", validateSubscription, create);  // POST /api/subscriptions
router.put("/:id", update);                      // PUT  /api/subscriptions/:id
router.delete("/:id", remove);                   // DELETE /api/subscriptions/:id
router.post("/:id/log-usage", logUsage);         // POST /api/subscriptions/:id/log-usage

module.exports = router;
