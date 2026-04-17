const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ─── Update Profile ───────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, email_alerts } = req.body;

    await db.promise().query(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email_alerts = COALESCE(?, email_alerts)
       WHERE id = ?`,
      [name, phone, email_alerts, req.user.id]
    );

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Change Password ──────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const [users] = await db.promise().query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, users[0].password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(new_password, 12);
    await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Upgrade to Premium ───────────────────────────────────
const upgradePlan = async (req, res) => {
  try {
    // In production: integrate Razorpay here
    await db.promise().query("UPDATE users SET plan = 'premium' WHERE id = ?", [req.user.id]);
    res.json({ success: true, message: "Upgraded to Premium! 🎉" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { updateProfile, changePassword, upgradePlan };
