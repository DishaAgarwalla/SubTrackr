const db = require("../config/db");

// ─── Get All Alerts for User ──────────────────────────────
const getAlerts = async (req, res) => {
  try {
    const [alerts] = await db.promise().query(
      `SELECT a.*, s.name AS subscription_name, s.logo_url
       FROM alerts a
       JOIN subscriptions s ON a.subscription_id = s.id
       WHERE a.user_id = ?
       ORDER BY a.scheduled_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const unreadCount = alerts.filter((a) => !a.is_read).length;

    res.json({ success: true, data: alerts, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Mark Alert as Read ───────────────────────────────────
const markRead = async (req, res) => {
  try {
    await db.promise().query(
      "UPDATE alerts SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Alert marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Mark All Alerts as Read ──────────────────────────────
const markAllRead = async (req, res) => {
  try {
    await db.promise().query(
      "UPDATE alerts SET is_read = TRUE WHERE user_id = ?",
      [req.user.id]
    );
    res.json({ success: true, message: "All alerts marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Delete Alert ─────────────────────────────────────────
const deleteAlert = async (req, res) => {
  try {
    await db.promise().query(
      "DELETE FROM alerts WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Alert deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getAlerts, markRead, markAllRead, deleteAlert };
