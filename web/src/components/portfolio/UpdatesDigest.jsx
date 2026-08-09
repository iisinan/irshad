import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Bell, ChevronRight } from 'lucide-react';
import { fetchDigestPreference, updateDigestPreference } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';

export default function UpdatesDigest() {
  const [pref, setPref] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDigestPreference()
      .then(r => setPref(r.data))
      .catch(() => setPref({ email_enabled: false, in_app_enabled: true, frequency: 'weekly', enabled: false }));
  }, []);

  const isEnabled = pref?.email_enabled || pref?.in_app_enabled;

  const handleToggle = async () => {
    try {
      setSaving(true);
      const next = isEnabled
        ? { email_enabled: false, in_app_enabled: false }
        : { email_enabled: false, in_app_enabled: true };
      const res = await updateDigestPreference(next);
      setPref(res.data);
      toastSuccess(isEnabled ? 'Weekly Digest disabled' : 'Weekly Digest enabled');
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const handleFrequency = async (freq) => {
    try {
      setSaving(true);
      const res = await updateDigestPreference({ ...pref, frequency: freq });
      setPref(res.data);
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const handleDelivery = async (field) => {
    try {
      setSaving(true);
      const res = await updateDigestPreference({ ...pref, [field]: !pref[field] });
      setPref(res.data);
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '24px',
      padding: '32px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Decorative background */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle at top right, rgba(209,165,98,0.05), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gold-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={24} color="var(--gold)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Irshad Weekly Digest
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              Stay informed about your portfolio's Shariah compliance status automatically.
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: '0 0 16px', lineHeight: 1.5, fontWeight: 500 }}>
            Get a comprehensive summary of your portfolio. We'll track and notify you about:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {['New Halal stocks', 'Non-Halal changes', 'Business activity', 'Market intelligence', 'Portfolio insights'].map(item => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                <CheckCircle2 size={16} color="var(--halal)" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '24px', borderBottom: isEnabled ? '1px solid var(--border)' : 'none' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>
              Digest Status
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {isEnabled ? 'Your weekly digest is currently active.' : 'Enable the digest to start receiving updates.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: isEnabled ? 'var(--bg)' : 'var(--primary)',
              border: isEnabled ? '1px solid var(--border)' : '1px solid var(--primary)',
              color: isEnabled ? 'var(--text-dark)' : 'white',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isEnabled ? 'none' : '0 4px 12px rgba(91,41,113,0.2)',
            }}
          >
            {isEnabled ? <><CheckCircle2 size={16} color="var(--halal)" /> Enabled</> : <><Bell size={16} /> Enable Digest</>}
          </button>
        </div>

        {isEnabled && pref && (
          <div className="animate-slide-up" style={{ paddingTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Delivery Methods</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[{ key: 'email_enabled', label: 'Email Notifications' }, { key: 'in_app_enabled', label: 'In-App Alerts' }].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'transform 0.1s' }}
                         onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.95)'; }}
                         onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                         onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <div onClick={() => { if (!saving) handleDelivery(key); }} style={{ width: '44px', height: '24px', borderRadius: '12px', background: pref[key] ? 'var(--primary)' : 'var(--border)', position: 'relative', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '2px', left: pref[key] ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-body)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Frequency</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['weekly', 'monthly'].map(f => (
                  <button key={f} disabled={saving} onClick={() => handleFrequency(f)} 
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: pref.frequency === f ? 'var(--primary-50)' : 'var(--bg)', border: `1px solid ${pref.frequency === f ? 'var(--primary-100)' : 'var(--border)'}`, borderRadius: '12px', padding: '12px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: saving ? 0.6 : 1 }}
                          onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.95)'; }}
                          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${pref.frequency === f ? 'var(--primary)' : 'var(--text-muted)'}`, background: pref.frequency === f ? 'var(--primary)' : 'transparent', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pref.frequency === f ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{f}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
