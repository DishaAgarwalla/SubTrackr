const db = require("../config/db");
const { getMonthlyEquivalent } = require("../utils/dateHelpers");

// ─── Main Dashboard Summary ───────────────────────────────
// Returns: total monthly spend, wasted subscriptions, renewals this week
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // All active subscriptions
    const [subscriptions] = await db.promise().query(
      `SELECT s.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
        DATEDIFF(s.next_renewal_date, CURDATE()) AS days_until_renewal
       FROM subscriptions s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.user_id = ? AND s.status = 'active'`,
      [userId]
    );

    // ── Total Monthly Spend ──
    const totalMonthly = subscriptions.reduce(
      (sum, sub) => sum + getMonthlyEquivalent(sub.amount, sub.billing_cycle),
      0
    );

    // ── Wasted Money: unused for > 20 days ──
    const UNUSED_DAYS_THRESHOLD = 20;
    const wastedSubscriptions = subscriptions.filter((sub) => {
      if (!sub.last_used_at) return true; // never used = wasted
      const daysSinceUse = Math.floor(
        (new Date() - new Date(sub.last_used_at)) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUse >= UNUSED_DAYS_THRESHOLD;
    });
    const totalWasted = wastedSubscriptions.reduce(
      (sum, sub) => sum + getMonthlyEquivalent(sub.amount, sub.billing_cycle),
      0
    );

    // ── Renewals This Week ──
    const renewalsThisWeek = subscriptions.filter(
      (sub) => sub.days_until_renewal >= 0 && sub.days_until_renewal <= 7
    );
    const renewalAmountThisWeek = renewalsThisWeek.reduce((sum, sub) => sum + Number(sub.amount), 0);

    // ── Category Breakdown ──
    const categoryBreakdown = {};
    subscriptions.forEach((sub) => {
      const cat = sub.category_name || "Other";
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = {
          name: cat,
          icon: sub.category_icon,
          color: sub.category_color,
          total: 0,
          count: 0,
        };
      }
      categoryBreakdown[cat].total += getMonthlyEquivalent(sub.amount, sub.billing_cycle);
      categoryBreakdown[cat].count++;
    });

    // ── Upcoming Renewals (next 30 days) ──
    const upcomingRenewals = subscriptions
      .filter((sub) => sub.days_until_renewal >= 0 && sub.days_until_renewal <= 30)
      .sort((a, b) => a.days_until_renewal - b.days_until_renewal);

    res.json({
      success: true,
      data: {
        overview: {
          totalMonthlySpend: Math.round(totalMonthly * 100) / 100,
          totalYearlySpend: Math.round(totalMonthly * 12 * 100) / 100,
          activeSubscriptions: subscriptions.length,
          wastedSubscriptions: wastedSubscriptions.length,
          totalWasted: Math.round(totalWasted * 100) / 100,
        },
        renewalsThisWeek: {
          count: renewalsThisWeek.length,
          totalAmount: Math.round(renewalAmountThisWeek * 100) / 100,
          subscriptions: renewalsThisWeek,
        },
        wastedSubscriptions,
        categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.total - a.total),
        upcomingRenewals,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Monthly Spending History ─────────────────────────────
const getSpendingHistory = async (req, res) => {
  try {
    const [history] = await db.promise().query(
      `SELECT month, year, total_amount, subscription_count
       FROM spending_history
       WHERE user_id = ?
       ORDER BY year DESC, month DESC
       LIMIT 12`,
      [req.user.id]
    );

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── Insights / AI-style Tips ─────────────────────────────
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = [];

    const [subscriptions] = await db.promise().query(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    // Tip 1: Multiple OTT platforms
    const [ottSubs] = await db.promise().query(
      `SELECT s.* FROM subscriptions s
       JOIN categories c ON s.category_id = c.id
       WHERE s.user_id = ? AND s.status = 'active' AND c.name = 'OTT / Streaming'`,
      [userId]
    );
    if (ottSubs.length >= 3) {
      const ottTotal = ottSubs.reduce((sum, s) => sum + getMonthlyEquivalent(s.amount, s.billing_cycle), 0);
      insights.push({
        type: "warning",
        icon: "🎬",
        title: "Multiple Streaming Services",
        message: `You have ${ottSubs.length} OTT subscriptions costing ₹${Math.round(ottTotal)}/month. Consider rotating them.`,
      });
    }

    // Tip 2: Highest spending category
    const categoryTotals = {};
    subscriptions.forEach((sub) => {
      const key = sub.category_id || 0;
      categoryTotals[key] = (categoryTotals[key] || 0) + getMonthlyEquivalent(sub.amount, sub.billing_cycle);
    });

    // Tip 3: Yearly plans could save money
    const monthlySubs = subscriptions.filter((s) => s.billing_cycle === "monthly");
    if (monthlySubs.length > 0) {
      insights.push({
        type: "tip",
        icon: "💡",
        title: "Switch to Annual Plans",
        message: `${monthlySubs.length} of your subscriptions are billed monthly. Annual plans typically save 15–40%.`,
      });
    }

    // Tip 4: Wasted subscriptions
    const wasted = subscriptions.filter((sub) => {
      if (!sub.last_used_at) return true;
      const days = Math.floor((new Date() - new Date(sub.last_used_at)) / (1000 * 60 * 60 * 24));
      return days >= 20;
    });
    if (wasted.length > 0) {
      const wastedTotal = wasted.reduce((sum, sub) => sum + getMonthlyEquivalent(sub.amount, sub.billing_cycle), 0);
      insights.push({
        type: "danger",
        icon: "🔥",
        title: "Money Being Wasted",
        message: `You're wasting ₹${Math.round(wastedTotal)}/month on ${wasted.length} unused subscription(s). Cancel or pause them.`,
      });
    }

    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getSummary, getSpendingHistory, getInsights };
