-- ============================================================
-- SubTrackr Database Schema
-- Run this file once to set up your MySQL database
-- Command: mysql -u root -p < config/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS subtrackr_db;
USE subtrackr_db;

-- ─── Users Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  plan ENUM('free', 'premium') DEFAULT 'free',
  email_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Categories Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(20)
);

INSERT INTO categories (name, icon, color) VALUES
  ('OTT / Streaming', '🎬', '#E50914'),
  ('Music', '🎵', '#1DB954'),
  ('Fitness & Gym', '💪', '#FF6B35'),
  ('Apps & Software', '📱', '#4285F4'),
  ('Gaming', '🎮', '#9B59B6'),
  ('Cloud Storage', '☁️', '#00BCD4'),
  ('Courses & Learning', '📚', '#FF9800'),
  ('News & Magazine', '📰', '#607D8B'),
  ('Other', '🔖', '#9E9E9E');

-- ─── Subscriptions Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'INR',
  billing_cycle ENUM('monthly', 'quarterly', 'half-yearly', 'yearly') DEFAULT 'monthly',
  start_date DATE NOT NULL,
  next_renewal_date DATE NOT NULL,
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  payment_method VARCHAR(50),
  website_url VARCHAR(255),
  logo_url VARCHAR(255),
  notes TEXT,
  last_used_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON SET NULL
);

-- ─── Alerts / Reminders Table ─────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_id INT NOT NULL,
  alert_type ENUM('renewal', 'unused', 'weekly_summary', 'custom') DEFAULT 'renewal',
  message TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  sent_at DATETIME,
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- ─── Usage Tracking Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_id INT NOT NULL,
  used_at DATE NOT NULL,
  notes VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- ─── Spending History Table (monthly snapshots) ───────────
CREATE TABLE IF NOT EXISTS spending_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  subscription_count INT DEFAULT 0,
  snapshot_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_month (user_id, month, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Indexes for Performance ──────────────────────────────
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(next_renewal_date);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_scheduled ON alerts(scheduled_at);
CREATE INDEX idx_usage_subscription ON usage_logs(subscription_id);
