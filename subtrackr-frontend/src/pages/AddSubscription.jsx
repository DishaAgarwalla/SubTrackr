import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdArrowBack, MdSave } from 'react-icons/md';
import styles from './AddSubscription.module.css';

const POPULAR = [
  { name: 'Netflix', amount: 649, billing_cycle: 'monthly' },
  { name: 'Spotify', amount: 119, billing_cycle: 'monthly' },
  { name: 'Amazon Prime', amount: 1499, billing_cycle: 'yearly' },
  { name: 'Hotstar', amount: 899, billing_cycle: 'yearly' },
  { name: 'YouTube Premium', amount: 189, billing_cycle: 'monthly' },
  { name: 'Zee5', amount: 999, billing_cycle: 'yearly' },
];

const today = new Date().toISOString().split('T')[0];

export default function AddSubscription() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', category_id: '', amount: '', billing_cycle: 'monthly',
    start_date: today, next_renewal_date: '', payment_method: '',
    website_url: '', notes: '', status: 'active',
  });

  useEffect(() => {
    subscriptionAPI.getCategories().then(res => setCategories(res.data.data || []));
    if (isEdit) {
      subscriptionAPI.getOne(id).then(res => {
        const s = res.data.data;
        setForm({
          name: s.name, category_id: s.category_id || '', amount: s.amount,
          billing_cycle: s.billing_cycle, start_date: s.start_date,
          next_renewal_date: s.next_renewal_date, payment_method: s.payment_method || '',
          website_url: s.website_url || '', notes: s.notes || '', status: s.status,
        });
      });
    }
  }, [id]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const autofillRenewal = (startDate, cycle) => {
    if (!startDate) return;
    const d = new Date(startDate);
    const map = { monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 };
    d.setMonth(d.getMonth() + map[cycle]);
    set('next_renewal_date', d.toISOString().split('T')[0]);
  };

  const handleQuickFill = (preset) => {
    setForm(prev => ({
      ...prev, name: preset.name, amount: preset.amount,
      billing_cycle: preset.billing_cycle,
    }));
    autofillRenewal(form.start_date || today, preset.billing_cycle);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await subscriptionAPI.update(id, form);
        toast.success('Subscription updated!');
      } else {
        await subscriptionAPI.create(form);
        toast.success('Subscription added!');
      }
      navigate('/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/subscriptions')}>
        <MdArrowBack size={18} /> Back
      </button>

      <h1 className={styles.title}>{isEdit ? 'Edit Subscription' : 'Add Subscription'}</h1>

      {/* Quick Fill */}
      {!isEdit && (
        <div className={styles.quickFill}>
          <p className={styles.quickLabel}>Quick fill popular apps:</p>
          <div className={styles.quickChips}>
            {POPULAR.map(p => (
              <button key={p.name} className={styles.quickChip} onClick={() => handleQuickFill(p)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Subscription Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Netflix" />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Amount (₹) *</label>
            <input required type="number" min="0" value={form.amount}
              onChange={e => set('amount', e.target.value)} placeholder="e.g. 649" />
          </div>
          <div className={styles.field}>
            <label>Billing Cycle</label>
            <select value={form.billing_cycle} onChange={e => {
              set('billing_cycle', e.target.value);
              autofillRenewal(form.start_date, e.target.value);
            }}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Start Date *</label>
            <input required type="date" value={form.start_date}
              onChange={e => {
                set('start_date', e.target.value);
                autofillRenewal(e.target.value, form.billing_cycle);
              }} />
          </div>
          <div className={styles.field}>
            <label>Next Renewal Date *</label>
            <input required type="date" value={form.next_renewal_date}
              onChange={e => set('next_renewal_date', e.target.value)} />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Payment Method</label>
            <input value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              placeholder="e.g. HDFC Credit Card" />
          </div>
          <div className={styles.field}>
            <label>Website URL</label>
            <input type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)}
              placeholder="https://netflix.com" />
          </div>
        </div>

        {isEdit && (
          <div className={styles.field}>
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} placeholder="Any notes about this subscription..." />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>
          <MdSave size={18} />
          {saving ? 'Saving...' : isEdit ? 'Update Subscription' : 'Add Subscription'}
        </button>
      </form>
    </div>
  );
}
