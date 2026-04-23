import { useEffect, useState } from 'react';
import { alertAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdNotifications, MdDone, MdDoneAll, MdDelete, MdLocalFireDepartment, MdAutorenew } from 'react-icons/md';
import styles from './Alerts.module.css';

const ALERT_ICONS = {
  renewal: <MdAutorenew size={18} color="var(--amber)" />,
  unused:  <MdLocalFireDepartment size={18} color="var(--red)" />,
  weekly_summary: <MdNotifications size={18} color="var(--accent)" />,
  custom:  <MdNotifications size={18} color="var(--blue)" />,
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    alertAPI.getAll()
      .then(res => setAlerts(res.data.data || []))
      .catch(() => toast.error('Failed to load alerts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkRead = async (id) => {
    await alertAPI.markRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const handleMarkAllRead = async () => {
    await alertAPI.markAllRead();
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    toast.success('All alerts marked as read');
  };

  const handleDelete = async (id) => {
    await alertAPI.delete(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const unread = alerts.filter(a => !a.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alerts</h1>
          <p className={styles.sub}>{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <MdDoneAll size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.list}>
          {[...Array(4)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonRow}`} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize: 48 }}>🔔</span>
          <p>No alerts yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Alerts will appear here when subscriptions are about to renew or go unused.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {alerts.map((alert, i) => (
            <div
              key={alert.id}
              className={`${styles.alertRow} ${!alert.is_read ? styles.unread : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={styles.alertIcon}>
                {ALERT_ICONS[alert.alert_type] || ALERT_ICONS.custom}
              </div>
              <div className={styles.alertBody}>
                <p className={styles.alertMsg}>{alert.message}</p>
                <p className={styles.alertMeta}>
                  {alert.subscription_name} · {new Date(alert.scheduled_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
              <div className={styles.alertActions}>
                {!alert.is_read && (
                  <button className={styles.iconBtn} title="Mark read" onClick={() => handleMarkRead(alert.id)}>
                    <MdDone size={16} color="var(--green)" />
                  </button>
                )}
                <button className={styles.iconBtn} title="Delete" onClick={() => handleDelete(alert.id)}>
                  <MdDelete size={16} color="var(--red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
