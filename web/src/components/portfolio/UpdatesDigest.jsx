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
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* ── Rich Hero Header ── */}
      <div style={{
        position: 'relative',
        padding: '40px 32px',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--bg)) 0%, color-mix(in srgb, var(--gold) 12%, var(--bg)) 100%)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Background Decorative Rings */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', border: '30px solid rgba(255,255,255,0.4)', borderRadius: '50%', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '40px', width: '150px', height: '150px', border: '20px solid rgba(255,255,255,0.3)', borderRadius: '50%', opacity: 0.5, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '18px', 
            background: 'linear-gradient(135deg, var(--gold), #f59e0b)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.25)',
            flexShrink: 0,
          }}>
            <Mail size={32} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px', letterSpacing: '-0.5px', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
              Irshad Weekly Digest
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', margin: 0, fontWeight: 600, maxWidth: '400px', lineHeight: 1.5 }}>
              Stay effortlessly informed. We deliver your portfolio's Shariah compliance status straight to you.
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {/* ── Feature Highlights Micro-Cards ── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            What you'll receive
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { label: 'New Halal stocks', icon: CheckCircle2, color: 'var(--halal)' },
              { label: 'Non-Halal changes', icon: Bell, color: 'var(--non-halal)' },
              { label: 'Business activity', icon: ChevronRight, color: 'var(--doubtful)' },
              { label: 'Market insights', icon: CheckCircle2, color: 'var(--primary)' }
            ].map(item => (
              <div key={item.label} style={{ 
                background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `color-mix(in srgb, ${item.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={14} color={item.color} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Toggle Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '24px', background: isEnabled ? 'color-mix(in srgb, var(--halal) 5%, transparent)' : 'var(--bg-section)', border: isEnabled ? '1px solid color-mix(in srgb, var(--halal) 20%, transparent)' : '1px solid var(--border)', borderRadius: '16px', transition: 'all 0.3s' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Digest Status
            </h3>
            <p style={{ fontSize: '0.8rem', color: isEnabled ? 'var(--halal)' : 'var(--text-muted)', margin: 0, fontWeight: 700 }}>
              {isEnabled ? '● Active and ready to send' : 'Currently disabled'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            style={{
              padding: '14px 28px',
              borderRadius: '30px',
              border: 'none',
              background: isEnabled ? 'var(--bg)' : 'linear-gradient(135deg, var(--primary), #7c3aed)',
              border: isEnabled ? '1px solid var(--border)' : 'none',
              color: isEnabled ? 'var(--text-dark)' : 'white',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isEnabled ? 'none' : '0 4px 14px rgba(91,41,113,0.3)',
              opacity: saving ? 0.7 : 1,
            }}
            onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isEnabled ? <><CheckCircle2 size={18} color="var(--halal)" /> Enabled</> : <><Bell size={18} /> Enable Digest</>}
          </button>
        </div>

        {/* ── Glassmorphic Settings Panel ── */}
        {isEnabled && pref && (
          <div className="animate-slide-up" style={{ 
            marginTop: '24px', padding: '24px', 
            background: 'color-mix(in srgb, var(--bg-section) 80%, transparent)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', borderRadius: '16px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Delivery Methods</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[{ key: 'email_enabled', label: 'Email Notifications' }, { key: 'in_app_enabled', label: 'In-App Alerts' }].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'transform 0.1s' }}
                         onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.98)'; }}
                         onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                         onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <div onClick={() => { if (!saving) handleDelivery(key); }} style={{ width: '48px', height: '26px', borderRadius: '13px', background: pref[key] ? 'var(--primary)' : 'var(--border)', position: 'relative', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '2px', left: pref[key] ? '24px' : '2px', width: '22px', height: '22px', borderRadius: '50%', background: 'white', transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Frequency</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['weekly', 'monthly'].map(f => (
                  <button key={f} disabled={saving} onClick={() => handleFrequency(f)} 
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: pref.frequency === f ? 'var(--primary-50)' : 'var(--bg)', border: `1px solid ${pref.frequency === f ? 'var(--primary-100)' : 'var(--border)'}`, borderRadius: '12px', padding: '14px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: saving ? 0.6 : 1 }}
                          onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.95)'; }}
                          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${pref.frequency === f ? 'var(--primary)' : 'var(--border)'}`, background: pref.frequency === f ? 'var(--primary)' : 'transparent', flexShrink: 0, transition: 'all 0.2s' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: pref.frequency === f ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{f}</span>
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
