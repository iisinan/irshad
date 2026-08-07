import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, RefreshCw, CheckCircle, Settings2, Zap } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function ZakatSettingsAdmin() {
  const [settings, setSettings] = useState({
    zakat_exchange_rate: '1600',
    zakat_gold_price_override: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      if (data.data) setSettings(prev => ({ ...prev, ...data.data }));
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '680px' }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', marginBottom: '16px' }}>
            <div style={{ height: '14px', borderRadius: '6px', background: 'var(--bg-section)', width: '40%', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '44px', borderRadius: '10px', background: 'var(--bg-section)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  const overrideActive = !!settings.zakat_gold_price_override;

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings2 size={17} />
          </span>
          Zakat Calculator Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
          These settings control how the Nisab threshold is calculated for all users.
        </p>
      </div>

      {/* Status banner */}
      <div style={{ padding: '14px 18px', borderRadius: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', background: overrideActive ? 'rgba(245,158,11,0.08)' : 'var(--halal-bg)', border: `1px solid ${overrideActive ? 'rgba(245,158,11,0.25)' : 'var(--halal-border)'}` }}>
        <Zap size={16} color={overrideActive ? '#D97706' : 'var(--halal)'} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: overrideActive ? '#D97706' : 'var(--halal)' }}>
          {overrideActive
            ? `Manual Gold Price Override is ACTIVE (₦${Number(settings.zakat_gold_price_override).toLocaleString()}/gram) — live API is bypassed`
            : 'Live gold price API is active. Exchange rate multiplier will be applied.'}
        </span>
      </div>

      {/* Feedback message */}
      {message.text && (
        <div style={{ padding: '13px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: message.type === 'success' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: message.type === 'success' ? 'var(--halal)' : 'var(--non-halal)', border: `1px solid ${message.type === 'success' ? 'var(--halal-border)' : 'var(--non-halal-border)'}`, fontSize: '0.85rem', fontWeight: 600 }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Exchange Rate Card */}
        <div style={{ background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>
              NGN / USD Exchange Rate
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Used to convert the live USD gold API price to Naira when calculating Nisab.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', userSelect: 'none' }}>₦</span>
              <input
                type="number" min="1"
                value={settings.zakat_exchange_rate || ''}
                onChange={e => setSettings({ ...settings, zakat_exchange_rate: e.target.value })}
                placeholder="e.g. 1600"
                style={{ width: '100%', padding: '13px 16px 13px 36px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '1rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>per USD</span>
          </div>
          {settings.zakat_exchange_rate && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', margin: '10px 0 0' }}>
              → At current setting: $1 = ₦{Number(settings.zakat_exchange_rate).toLocaleString()}
            </p>
          )}
        </div>

        {/* Manual Override Card */}
        <div style={{ background: 'var(--bg)', borderRadius: '16px', border: `1px solid ${overrideActive ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, padding: '24px', marginBottom: '28px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Manual Gold Price Override
              </label>
              {overrideActive && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: 'rgba(245,158,11,0.12)', color: '#D97706' }}>ACTIVE</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Enter a fixed NGN price per gram of gold. Leave blank to use the live API + exchange rate.
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', userSelect: 'none' }}>₦</span>
            <input
              type="number" min="0"
              value={settings.zakat_gold_price_override || ''}
              onChange={e => setSettings({ ...settings, zakat_gold_price_override: e.target.value })}
              placeholder="Leave blank to use live API"
              style={{ width: '100%', padding: '13px 16px 13px 36px', borderRadius: '12px', border: `1px solid ${overrideActive ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`, background: overrideActive ? 'rgba(245,158,11,0.04)' : 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '1rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          {settings.zakat_gold_price_override && (
            <p style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '10px', margin: '10px 0 0', fontWeight: 600 }}>
              ⚠️ Nisab = ₦{(Number(settings.zakat_gold_price_override) * 85).toLocaleString()} (85g × ₦{Number(settings.zakat_gold_price_override).toLocaleString()})
            </p>
          )}
        </div>

        <button
          type="submit" disabled={saving}
          style={{ width: '100%', padding: '15px', borderRadius: '14px', background: saving ? 'var(--primary-hover)' : 'var(--primary)', color: 'var(--primary-text, #2A1A2E)', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', boxShadow: '0 8px 24px rgba(243,198,81,0.25)', transition: 'all 0.2s' }}
          onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {saving ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
