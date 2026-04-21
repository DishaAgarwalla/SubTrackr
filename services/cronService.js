const db = require("../config/db");
const { sendRenewalEmail } = require("./emailService");

const ALERT_DAYS = [3, 7]; // Alert 3 and 7 days before renewal

// ─── Daily Renewal Check ──────────────────────────────────
const checkRenewals = async () => {
  try {
    for (const days of ALERT_DAYS) {
      // Find subscriptions renewing in exactly `days` days
      const [subscriptions] = await db.promise().query(
        `SELECT s.*, u.name AS user_name, u.email AS user_email, u.email_alerts,
                c.name AS category_name
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN categories c ON s.category_id = c.id
         WHERE s.status = 'active'
           AND DATEDIFF(s.next_renewal_date, CURDATE()) = ?`,
        [days]
      );

      for (const sub of subscriptions) {
        // Create in-app alert
        const message =
          days === 3
            ? `⚠️ "${sub.name}" renews in 3 days on ${sub.next_renewal_date} — ₹${sub.amount} will be charged.`
            : `📅 "${sub.name}" renews in 7 days on ${sub.next_renewal_date} — ₹${sub.amount}.`;

        const scheduledAt = new Date();

        await db.promise().query(
          `INSERT INTO alerts (user_id, subscription_id, alert_type, message, scheduled_at)
           VALUES (?, ?, 'renewal', ?, ?)
           ON DUPLICATE KEY UPDATE message = message`,
          [sub.user_id, sub.id, message, scheduledAt]
        );

        // Send email if user has email alerts enabled
        if (sub.email_alerts) {
          await sendRenewalEmail({
            to: sub.user_email,
            userName: sub.user_name,
            subscriptionName: sub.name,
            amount: sub.amount,
            renewalDate: sub.next_renewal_date,
            daysLeft: days,
          });
        }
      }
    }

    // ── Detect Wasted / Unused Subscriptions ──
    const [unused] = await db.promise().query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active'
         AND (
           s.last_used_at IS NULL
           OR DATEDIFF(CURDATE(), s.last_used_at) >= 20
         )`
    );

    for (const sub of unused) {
      const daysSince = sub.last_used_at
        ? Math.floor((new Date() - new Date(sub.last_used_at)) / (1000 * 60 * 60 * 24))
        : null;

      const message = daysSince
        ? `🔥 You haven't used "${sub.name}" in ${daysSince} days. You're wasting ₹${sub.amount}/cycle!`
        : `🔥 You've never logged usage for "${sub.name}". Are you actually using it? (₹${sub.amount}/cycle)`;

      const scheduledAt = new Date();

      // Insert unused alert (once per subscription, avoid spam)
      await db.promise().query(
        `INSERT INTO alerts (user_id, subscription_id, alert_type, message, scheduled_at)
         SELECT ?, ?, 'unused', ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM alerts
           WHERE user_id = ? AND subscription_id = ? AND alert_type = 'unused'
             AND DATE(scheduled_at) = CURDATE()
         )`,
        [sub.user_id, sub.id, message, scheduledAt, sub.user_id, sub.id]
      );
    }

    console.log("✅ Renewal check completed.");
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
};

module.exports = { checkRenewals };
