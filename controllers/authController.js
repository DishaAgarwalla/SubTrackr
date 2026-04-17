const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ─── Register ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });

    // Check if user already exists
    const [existing] = await db.promise().query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.promise().query(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, phone || null]
    );

    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: { id: result.insertId, name, email, plan: "free" },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const [users] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Get Current User ─────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      "SELECT id, name, email, phone, plan, email_alerts, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0)
      return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { register, login, getMe };
