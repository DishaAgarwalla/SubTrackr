const express = require("express");
const router = express.Router();
const { updateProfile, changePassword, upgradePlan } = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.put("/profile", updateProfile);          // PUT /api/user/profile
router.put("/change-password", changePassword); // PUT /api/user/change-password
router.post("/upgrade", upgradePlan);           // POST /api/user/upgrade

module.exports = router;
