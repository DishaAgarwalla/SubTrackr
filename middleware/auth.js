const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

// Premium-only route guard
const requirePremium = async (req, res, next) => {
  const db = require("../config/db");
  const [users] = await db.promise().query("SELECT plan FROM users WHERE id = ?", [req.user.id]);
  if (!users.length || users[0].plan !== "premium")
    return res.status(403).json({ success: false, message: "This feature requires a Premium plan." });
  next();
};

module.exports = { authenticate, requirePremium };
