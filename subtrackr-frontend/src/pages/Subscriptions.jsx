import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdCheckCircle, MdSearch, MdFilterList } from 'react-icons/md';
import styles from './Subscriptions.module.css';

const STATUS_COLORS = {
  active:    { bg: 'var(--green-bg)',  color: 'var(--green)' },
  paused:    { bg: 'var(--amber-bg)',  color: 'var(--amber)' },
  cancelled: { bg: 'var(--red-bg)',    color: 'var(--red)' },
};

const CYCLE_LABEL = {
  monthly: '/mo', quarterly: '/qtr',
  'half-yearly': '/6mo', yearly: '/yr'
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchSubs = () => {
    subscriptionAPI.getAll()
      .then(res => setSubs(res.data.data || []))
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await subscriptionAPI.remove(id);
    toast.success(`${name} deleted`);
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  const handleLogUsage = async (id, name) => {
    await subscriptionAPI.logUsage(id);
    toast.success(`Usage logged for ${name}!`);
    fetchSubs();
  };

  const filtered = subs.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const totalMonthly = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthly_equivalent || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscriptions</h1>
          <p className={styles.sub}>
            {subs.filter(s => s.status === 'active').length} active ·{' '}
            <span className="text-accent">₹{Math.round(totalMonthly).toLocaleString('en-IN')}/mo</span>
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/subscriptions/add')}>
          <MdAdd size={18} /> Add New
        </button>
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <MdSearch size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterTabs}>
          {['all','active','paused','cancelled'].map(f => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.list}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p style={{ fontSize: 48 }}>📭</p>
          <p>No subscriptions found</p>
          <button className={styles.addBtn} onClick={() => navigate('/subscriptions/add')}>
            <MdAdd size={16} /> Add your first subscription
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((sub, i) => (
            <div key={sub.id} className={styles.row} style={{ animationDelay: `${i * 40}ms` }}>
              <div className={styles.rowLeft}>
                <span className={styles.subEmoji}>{sub.category_icon || '📦'}</span>
                <div>
                  <p className={styles.subName}>{sub.name}</p>
                  <p className={styles.subMeta}>
                    {sub.category_name || 'Other'} ·{' '}
                    Renews {sub.next_renewal_date}
                    {sub.days_until_renewal !== null && (
                      <span className={styles.daysChip}
                        style={{
                          background: sub.days_until_renewal <= 3 ? 'var(--red-bg)' : 'var(--amber-bg)',
                          color: sub.days_until_renewal <= 3 ? 'var(--red)' : 'var(--amber)'
                        }}>
                        in {sub.days_until_renewal}d
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.rowRight}>
                <div className={styles.amtBlock}>
                  <span className={styles.amount}>₹{Number(sub.amount).toLocaleString('en-IN')}</span>
                  <span className={styles.cycle}>{CYCLE_LABEL[sub.billing_cycle]}</span>
                </div>

                <span className={styles.statusBadge}
                  style={{ background: STATUS_COLORS[sub.status]?.bg, color: STATUS_COLORS[sub.status]?.color }}>
                  {sub.status}
                </span>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} title="Log Usage" onClick={() => handleLogUsage(sub.id, sub.name)}>
                    <MdCheckCircle size={17} color="var(--green)" />
                  </button>
                  <button className={styles.actionBtn} title="Edit" onClick={() => navigate(`/subscriptions/edit/${sub.id}`)}>
                    <MdEdit size={17} color="var(--text-secondary)" />
                  </button>
                  <button className={styles.actionBtn} title="Delete" onClick={() => handleDelete(sub.id, sub.name)}>
                    <MdDelete size={17} color="var(--red)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
