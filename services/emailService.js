const nodemailer = require("nodemailer");
require("dotenv").config();

// ─── Transporter Setup ────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Renewal Reminder Email ───────────────────────────────
const sendRenewalEmail = async ({ to, userName, subscriptionName, amount, renewalDate, daysLeft }) => {
  try {
    const urgencyColor = daysLeft <= 3 ? "#E53E3E" : "#DD6B20";
    const urgencyLabel = daysLeft <= 3 ? "URGENT" : "Reminder";

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `[${urgencyLabel}] "${subscriptionName}" renews in ${daysLeft} day${daysLeft > 1 ? "s" : ""} — ₹${amount}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', sans-serif; background: #F7F8FA; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📊 SubTrackr</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your Subscription Manager</p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 24px;">
              <p style="color: #2D3748; font-size: 16px; margin: 0 0 20px;">Hi <strong>${userName}</strong>,</p>
              
              <div style="background: #FFF5F5; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="color: ${urgencyColor}; font-weight: 700; font-size: 13px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.5px;">${urgencyLabel}</p>
                <p style="color: #2D3748; font-size: 18px; font-weight: 700; margin: 0;">${subscriptionName}</p>
                <p style="color: #718096; font-size: 14px; margin: 6px 0 0;">Renews in <strong style="color: ${urgencyColor};">${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong> on ${renewalDate}</p>
              </div>

              <div style="background: #F0FFF4; border-radius: 8px; padding: 16px 20px; text-align: center; margin-bottom: 24px;">
                <p style="color: #276749; font-size: 13px; margin: 0 0 4px;">Amount to be charged</p>
                <p style="color: #22543D; font-size: 32px; font-weight: 800; margin: 0;">₹${amount}</p>
              </div>

              <p style="color: #718096; font-size: 13px; line-height: 1.6;">
                Make sure your payment method is up to date to avoid service interruption.
                If you no longer use this service, consider cancelling it on SubTrackr.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #F7F8FA; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                You're receiving this because you enabled email alerts in SubTrackr.<br/>
                <a href="#" style="color: #667eea;">Manage your alerts</a> · <a href="#" style="color: #667eea;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`📧 Renewal email sent to ${to} for ${subscriptionName}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

// ─── Weekly Summary Email ─────────────────────────────────
const sendWeeklySummaryEmail = async ({ to, userName, totalMonthly, activeCount, wastedCount, wastedAmount }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Your Weekly Subscription Summary — ₹${totalMonthly}/month`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', sans-serif; background: #F7F8FA; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Summary</h1>
            </div>
            <div style="padding: 28px 24px;">
              <p style="color: #2D3748;">Hi <strong>${userName}</strong>, here's your subscription summary:</p>
              <div style="display: flex; gap: 12px; margin: 20px 0;">
                <div style="flex: 1; background: #EBF8FF; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="color: #2B6CB0; font-size: 28px; font-weight: 800; margin: 0;">₹${totalMonthly}</p>
                  <p style="color: #4A5568; font-size: 12px; margin: 4px 0 0;">Monthly Spend</p>
                </div>
                <div style="flex: 1; background: #F0FFF4; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="color: #276749; font-size: 28px; font-weight: 800; margin: 0;">${activeCount}</p>
                  <p style="color: #4A5568; font-size: 12px; margin: 4px 0 0;">Active Subs</p>
                </div>
              </div>
              ${wastedCount > 0 ? `
              <div style="background: #FFF5F5; border-radius: 8px; padding: 16px; border-left: 4px solid #E53E3E;">
                <p style="color: #E53E3E; font-weight: 700; margin: 0 0 4px;">🔥 Wasted Money Alert</p>
                <p style="color: #4A5568; font-size: 14px; margin: 0;">
                  ${wastedCount} unused subscription(s) costing <strong>₹${wastedAmount}/month</strong>. Consider cancelling them.
                </p>
              </div>` : ""}
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`📧 Weekly summary sent to ${to}`);
  } catch (err) {
    console.error("❌ Weekly email failed:", err.message);
  }
};

module.exports = { sendRenewalEmail, sendWeeklySummaryEmail };
