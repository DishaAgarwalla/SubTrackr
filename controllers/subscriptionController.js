const db = require("../config/db");
const { calculateNextRenewal, getMonthlyEquivalent } = require("../utils/dateHelpers");

// ─── Get All Subscriptions ────────────────────────────────
const getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category_id } = req.query;

    let query = `
      SELECT s.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
        DATEDIFF(s.next_renewal_date, CURDATE()) AS days_until_renewal
      FROM subscriptions s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (status) { query += " AND s.status = ?"; params.push(status); }
    if (category_id) { query += " AND s.category_id = ?"; params.push(category_id); }

    query += " ORDER BY s.next_renewal_date ASC";

    const [rows] = await db.promise().query(query, params);

    // Add monthly_equivalent field for each subscription
    const enriched = rows.map((sub) => ({
      ...sub,
      monthly_equivalent: getMonthlyEquivalent(sub.amount, sub.billing_cycle),
    }));

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Get Single Subscription ──────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, c.name AS category_name, c.icon AS category_icon
       FROM subscriptions s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Subscription not found." });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Create Subscription ──────────────────────────────────
const create = async (req, res) => {
  try {
    const {
      name, category_id, amount, billing_cycle,
      start_date, next_renewal_date, payment_method,
      website_url, logo_url, notes, description
    } = req.body;

    if (!name || !amount || !start_date || !next_renewal_date)
      return res.status(400).json({ success: false, message: "name, amount, start_date, and next_renewal_date are required." });

    const [result] = await db.promise().query(
      `INSERT INTO subscriptions
        (user_id, name, category_id, amount, billing_cycle, start_date, next_renewal_date,
         payment_method, website_url, logo_url, notes, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, name, category_id || null, amount,
        billing_cycle || "monthly", start_date, next_renewal_date,
        payment_method || null, website_url || null, logo_url || null,
        notes || null, description || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Subscription added successfully!",
      data: { id: result.insertId },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Update Subscription ──────────────────────────────────
const update = async (req, res) => {
  try {
    const {
      name, category_id, amount, billing_cycle, next_renewal_date,
      status, payment_method, website_url, logo_url, notes, description
    } = req.body;

    const [existing] = await db.promise().query(
      "SELECT id FROM subscriptions WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: "Subscription not found." });

    await db.promise().query(
      `UPDATE subscriptions SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        amount = COALESCE(?, amount),
        billing_cycle = COALESCE(?, billing_cycle),
        next_renewal_date = COALESCE(?, next_renewal_date),
        status = COALESCE(?, status),
        payment_method = COALESCE(?, payment_method),
        website_url = COALESCE(?, website_url),
        logo_url = COALESCE(?, logo_url),
        notes = COALESCE(?, notes),
        description = COALESCE(?, description)
       WHERE id = ? AND user_id = ?`,
      [
        name, category_id, amount, billing_cycle, next_renewal_date,
        status, payment_method, website_url, logo_url, notes, description,
        req.params.id, req.user.id,
      ]
    );

    res.json({ success: true, message: "Subscription updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Delete Subscription ──────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "DELETE FROM subscriptions WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Subscription not found." });

    res.json({ success: true, message: "Subscription deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Log Usage (marks subscription as used today) ─────────
const logUsage = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    await db.promise().query(
      "INSERT INTO usage_logs (user_id, subscription_id, used_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE used_at = ?",
      [req.user.id, req.params.id, today, today]
    );

    await db.promise().query(
      "UPDATE subscriptions SET last_used_at = ? WHERE id = ? AND user_id = ?",
      [today, req.params.id, req.user.id]
    );

    res.json({ success: true, message: "Usage logged!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Get Categories ───────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM categories ORDER BY name ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, logUsage, getCategories };
