import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdCreditCard, MdNotifications,
  MdPerson, MdLogout, MdAdd
} from 'react-icons/md';
import { useEffect, useState } from 'react';
import { alertAPI } from '../../services/api';
import styles from './Layout.module.css';

const navItems = [
  { to: '/',               icon: MdDashboard,     label: 'Dashboard',      end: true },
  { to: '/subscriptions',  icon: MdCreditCard,    label: 'Subscriptions' },
  { to: '/alerts',         icon: MdNotifications, label: 'Alerts' },
  { to: '/profile',        icon: MdPerson,        label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    alertAPI.getAll()
      .then(res => setUnread(res.data.unreadCount || 0))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>S</span>
          <span className={styles.brandName}>SubTrackr</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {label === 'Alerts' && unread > 0 && (
                <span className={styles.badge}>{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            className={styles.addBtn}
            onClick={() => navigate('/subscriptions/add')}
          >
            <MdAdd size={18} /> Add Subscription
          </button>

          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userPlan}>{user?.plan === 'premium' ? '⭐ Premium' : 'Free Plan'}</p>
            </div>
            <button className={styles.logoutBtn} onClick={logout} title="Logout">
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
