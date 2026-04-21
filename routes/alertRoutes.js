const express = require("express");
const router = express.Router();
const { getAlerts, markRead, markAllRead, deleteAlert } = require("../controllers/alertController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", getAlerts);                    // GET    /api/alerts
router.put("/read-all", markAllRead);          // PUT    /api/alerts/read-all
router.put("/:id/read", markRead);             // PUT    /api/alerts/:id/read
router.delete("/:id", deleteAlert);            // DELETE /api/alerts/:id

module.exports = router;
