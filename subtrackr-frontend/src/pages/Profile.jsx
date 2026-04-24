import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdSave, MdStar, MdLock } from 'react-icons/md';
import styles from './Profile.module.css';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.updateProfile({ name, phone });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setPwdSaving(true);
    try {
      await userAPI.changePassword({ current_password: curPwd, new_password: newPwd });
      toast.success('Password changed!');
      setCurPwd(''); setNewPwd('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPwdSaving(false); }
  };

  const handleUpgrade = async () => {
    try {
      await userAPI.upgrade();
      toast.success('Upgraded to Premium! 🎉 (Reload the page)');
    } catch { toast.error('Failed to upgrade'); }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.grid}>
        {/* Profile Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Account Info</h3>
          <form onSubmit={handleProfileSave} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input value={user?.email} disabled className={styles.disabled} />
            </div>
            <div className={styles.field}>
              <label>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              <MdSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className={styles.col}>
          {/* Change Password */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><MdLock size={16} /> Change Password</h3>
            <form onSubmit={handlePwdSave} className={styles.form}>
              <div className={styles.field}>
                <label>Current Password</label>
                <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>New Password</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <button type="submit" className={styles.saveBtn} disabled={pwdSaving}>
                {pwdSaving ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Premium */}
          {user?.plan !== 'premium' && (
            <div className={styles.premiumCard}>
              <div className={styles.premiumIcon}><MdStar size={28} /></div>
              <h3>Upgrade to Premium</h3>
              <p>Unlock smart insights, wasted money detection alerts, and more.</p>
              <ul className={styles.premiumFeatures}>
                <li>✅ Smart spending insights</li>
                <li>✅ Advanced analytics</li>
                <li>✅ Priority email alerts</li>
              </ul>
              <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                <MdStar size={16} /> Upgrade Now
              </button>
            </div>
          )}

          {user?.plan === 'premium' && (
            <div className={styles.premiumCard} style={{ borderColor: 'var(--amber)' }}>
              <p style={{ fontSize: 32 }}>⭐</p>
              <h3 style={{ color: 'var(--amber)' }}>You're on Premium!</h3>
              <p>Enjoy all premium features.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
