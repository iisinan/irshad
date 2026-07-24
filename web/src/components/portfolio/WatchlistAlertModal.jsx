import React, { useState } from 'react';
import { X, Bell, Mail, Smartphone, Inbox, AlertTriangle, ShieldAlert, FileText, TrendingUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toastError, toastSuccess } from '../../utils/toast';
import { updateWatchlist } from '../../services/api';

const ToggleRow = ({ field, icon: Icon, title, description, prefs, handleToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
      </div>
    </div>
    <div 
      onClick={() => handleToggle(field)}
      style={{ 
        width: '44px', height: '24px', borderRadius: '12px', background: prefs[field] ? 'var(--primary)' : 'var(--bg-section)',
        position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: `1px solid ${prefs[field] ? 'var(--primary)' : 'var(--border)'}`
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
        left: prefs[field] ? '22px' : '2px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }} />
    </div>
  </div>
);

export default function WatchlistAlertModal({ stock, watchlistData, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  
  // Local state for the toggles
  const [prefs, setPrefs] = useState({
    alert_email: watchlistData?.alert_email || false,
    alert_inapp: watchlistData?.alert_inapp || false,
    alert_push: watchlistData?.alert_push || false,
    alert_verdict_change: watchlistData?.alert_verdict_change || false,
    alert_compliance_risk: watchlistData?.alert_compliance_risk || false,
    alert_weekly_digest: watchlistData?.alert_weekly_digest || false,
    alert_price_change: watchlistData?.alert_price_change || false,
  });

  const handleToggle = (field) => {
    setPrefs(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    const hasDelivery = prefs.alert_email || prefs.alert_inapp || prefs.alert_push;
    const hasType = prefs.alert_verdict_change || prefs.alert_compliance_risk || prefs.alert_price_change || prefs.alert_weekly_digest;

    if (hasDelivery && !hasType) {
      toastError('Please select at least one alert type to receive.');
      return;
    }
    if (hasType && !hasDelivery) {
      toastError('Please select at least one delivery method.');
      return;
    }

    setSaving(true);
    try {
      await updateWatchlist(stock.symbol, prefs);
      toastSuccess('Alert preferences updated');
      onUpdated({ ...watchlistData, ...prefs });
      onClose();
    } catch (err) {
      toastError('Failed to save alert preferences');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }} className="animate-scale-in">
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-10)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Bell size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stock.symbol} Alerts</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure notifications for this asset</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          <ToggleRow 
            field="alert_email" 
            icon={Mail} 
            title="Email Notifications" 
            description="Receive alerts directly to your inbox" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_inapp" 
            icon={Inbox} 
            title="In-App Inbox" 
            description="Receive alerts in your Irshad web dashboard" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_push" 
            icon={Smartphone} 
            title="Push Notifications" 
            description="Get instant push alerts on your phone" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_verdict_change" 
            icon={AlertTriangle} 
            title="Verdict Change" 
            description="Status changes (e.g., Halal to Non-Halal)" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_compliance_risk" 
            icon={ShieldAlert} 
            title="Compliance Risk" 
            description="Non-compliant revenue approaches thresholds" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_price_change" 
            icon={TrendingUp} 
            title="Price Movements" 
            description="Significant daily price rise or fall" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
          <ToggleRow 
            field="alert_weekly_digest" 
            icon={FileText} 
            title="Weekly Digest" 
            description="Include in your weekly portfolio summary" 
            prefs={prefs}
            handleToggle={handleToggle}
          />
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg-section)' }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--gold-grad)', color: 'var(--bg)', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(201,168,76,0.3)', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Alert Settings'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
