import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MdTrendingUp, MdWarning, MdAutorenew, MdLocalFireDepartment,
  MdArrowForward
} from 'react-icons/md';
import styles from './Dashboard.module.css';

const StatCard = ({ label, value, sub, color, icon: Icon, delay }) => (
  <div className={styles.statCard} style={{ animationDelay: delay, borderColor: color + '33' }}>
    <div className={styles.statIcon} style={{ background: color + '18', color }}>
      <Icon size={22} />
    </div>
    <div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={{ color }}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSummary()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.skeletonHeader} />
      <div className={styles.statsGrid}>
        {[...Array(4)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
      </div>
    </div>
  );

  const { overview, renewalsThisWeek, wastedSubscriptions, categoryBreakdown, upcomingRenewals } = data || {};

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subGreeting}>Here's your subscription overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Monthly Spend" icon={MdTrendingUp} delay="0ms" color="var(--accent)"
          value={`₹${overview?.totalMonthlySpend?.toLocaleString('en-IN') || 0}`}
          sub={`₹${overview?.totalYearlySpend?.toLocaleString('en-IN') || 0}/year`}
        />
        <StatCard
          label="Active Subscriptions" icon={MdAutorenew} delay="60ms" color="var(--green)"
          value={overview?.activeSubscriptions || 0}
          sub="Currently active"
        />
        <StatCard
          label="Renewing This Week" icon={MdAutorenew} delay="120ms" color="var(--amber)"
          value={renewalsThisWeek?.count || 0}
          sub={`₹${renewalsThisWeek?.totalAmount?.toLocaleString('en-IN') || 0} outgoing`}
        />
        <StatCard
          label="Wasted Money" icon={MdLocalFireDepartment} delay="180ms" color="var(--red)"
          value={`₹${overview?.totalWasted?.toLocaleString('en-IN') || 0}/mo`}
          sub={`${overview?.wastedSubscriptions || 0} unused subs`}
        />
      </div>

      <div className={styles.grid2}>
        {/* Wasted Subscriptions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <MdLocalFireDepartment color="var(--red)" /> Wasted Money
            </h3>
            <span className={styles.cardBadge} style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
              Unused &gt; 20 days
            </span>
          </div>
          {wastedSubscriptions?.length === 0 ? (
            <div className={styles.emptySmall}>🎉 No wasted subscriptions!</div>
          ) : (
            <div className={styles.wastedList}>
              {wastedSubscriptions?.slice(0, 4).map(sub => (
                <div key={sub.id} className={styles.wastedItem}>
                  <div className={styles.wastedLeft}>
                    <span className={styles.wastedEmoji}>{sub.category_icon || '📦'}</span>
                    <div>
                      <p className={styles.wastedName}>{sub.name}</p>
                      <p className={styles.wastedMeta}>
                        {sub.last_used_at
                          ? `Last used ${Math.floor((new Date() - new Date(sub.last_used_at)) / 86400000)} days ago`
                          : 'Never used'}
                      </p>
                    </div>
                  </div>
                  <span className={styles.wastedAmt}>₹{Number(sub.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <MdAutorenew color="var(--amber)" /> Upcoming Renewals
            </h3>
            <button className={styles.seeAll} onClick={() => navigate('/subscriptions')}>
              See all <MdArrowForward size={14} />
            </button>
          </div>
          {upcomingRenewals?.length === 0 ? (
            <div className={styles.emptySmall}>✅ No renewals in next 30 days</div>
          ) : (
            <div className={styles.renewalList}>
              {upcomingRenewals?.slice(0, 5).map(sub => (
                <div key={sub.id} className={styles.renewalItem}>
                  <div className={styles.renewalLeft}>
                    <span>{sub.category_icon || '📦'}</span>
                    <div>
                      <p className={styles.renewalName}>{sub.name}</p>
                      <p className={styles.renewalDate}>{sub.next_renewal_date}</p>
                    </div>
                  </div>
                  <div className={styles.renewalRight}>
                    <span className={styles.renewalAmt}>₹{Number(sub.amount).toLocaleString('en-IN')}</span>
                    <span className={styles.daysTag}
                      style={{
                        background: sub.days_until_renewal <= 3 ? 'var(--red-bg)' : 'var(--amber-bg)',
                        color: sub.days_until_renewal <= 3 ? 'var(--red)' : 'var(--amber)'
                      }}>
                      {sub.days_until_renewal}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown?.length > 0 && (
        <div className={styles.card} style={{ marginTop: 24 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Spending by Category</h3>
          </div>
          <div className={styles.categoryGrid}>
            {categoryBreakdown.map(cat => {
              const pct = Math.round((cat.total / overview?.totalMonthlySpend) * 100) || 0;
              return (
                <div key={cat.name} className={styles.catItem}>
                  <div className={styles.catTop}>
                    <span>{cat.icon} {cat.name}</span>
                    <span className={styles.catAmt}>₹{Math.round(cat.total)}</span>
                  </div>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill} style={{ width: `${pct}%`, background: cat.color || 'var(--accent)' }} />
                  </div>
                  <p className={styles.catPct}>{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
