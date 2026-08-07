import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight } from 'lucide-react';
import { fetchPriceAlerts, deletePriceAlert } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import CompanyLogo from '../CompanyLogo';
import Skeleton from '../ui/Skeleton';

export default function AlertsTab() {
  const [alerts, setAlerts] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_alerts_cache_v1');
      if (cached) return JSON.parse(cached) || [];
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => alerts.length === 0);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = async () => {
    try {
      if (alerts.length === 0) setLoading(true);
      const res = await fetchPriceAlerts();
      const newAlerts = res.data || [];
      setAlerts(newAlerts);
      localStorage.setItem('irshad_alerts_cache_v1', JSON.stringify(newAlerts));
    } catch (err) {
      console.error('Failed to load price alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this price alert?')) return;
    try {
      await deletePriceAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  return (
    <div className="animate-fade-in stagger-1" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'0', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #3C2D3E 100%)', padding: '32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid rgba(201, 149, 42, 0.15)' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201, 149, 42, 0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(201, 149, 42, 0.12)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(201, 149, 42, 0.35)' }}>
            <Bell size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Price Alerts</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.79rem', marginTop: '4px', margin: 0 }}>Real-time notifications for target market price thresholds</p>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800, background: 'rgba(201, 149, 42, 0.12)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(201, 149, 42, 0.3)', backdropFilter: 'blur(10px)' }}>
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
              <Skeleton height="120px" borderRadius="16px" />
              <Skeleton height="120px" borderRadius="16px" />
              <Skeleton height="120px" borderRadius="16px" />
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #ffffff 0%, var(--bg-section) 100%)', 
            borderRadius: '24px', border: '1px dashed var(--border-strong)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ 
              width:'80px', height:'80px', background:'var(--primary-50)', borderRadius:'24px', 
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px',
              border:'1px solid var(--primary-100)', boxShadow:'0 12px 32px rgba(201,168,76,0.15)'
            }}>
              <BellRing size={36} color="var(--primary)" fill="var(--primary)" opacity={0.8} />
            </div>
            <div style={{ fontSize: '1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              No Active Price Alerts
            </div>
            <p style={{ color:'var(--text-muted)', fontSize: '0.88rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
              Set up price alerts for your favorite stocks to be notified immediately when they hit your target price.
            </p>
            <button 
              onClick={() => navigate('/portfolio#market')} 
              style={{ 
                display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
                borderRadius:'14px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', 
                fontWeight:800, fontSize: '0.84rem', cursor:'pointer', textDecoration:'none',
                boxShadow:'0 8px 24px rgba(201,168,76,0.3)', transition:'transform 0.2s, boxShadow 0.2s' 
              }}
              className="hover-lift"
            >
              <TrendingUp size={18}/> Set an Alert
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {alerts.map((alert, i) => {
              const isAbove = alert.condition === 'above';
              const targetFormatted = Number(alert.target_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div 
                  key={alert.id}
                  onClick={() => navigate(`/market/${alert.symbol}`)}
                  className="roll-in-anim hover-lift"
                  style={{ 
                    animationDelay: `${(i % 12) * 0.04}s`,
                    background: 'var(--bg)', borderRadius: '18px', padding: '20px', border: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', gap: '16px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CompanyLogo symbol={alert.symbol} logoUrl={alert.logo_url} size={44} radius={12} />
                      <div>
                        <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>{alert.symbol}</h4>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: alert.is_active ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: alert.is_active ? '#10B981' : 'var(--text-light)', boxShadow: alert.is_active ? '0 0 6px rgba(16,185,129,0.4)' : 'none' }} />
                          {alert.is_active ? 'Monitoring' : 'Triggered'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, alert.id)}
                      style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--non-halal)'; e.currentTarget.style.borderColor = 'var(--non-halal)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      title="Delete alert"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-section)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isAbove ? 'var(--halal-bg)' : 'var(--non-halal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isAbove ? <ArrowUpRight size={16} color="var(--halal)" /> : <ArrowDownRight size={16} color="var(--non-halal)" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {isAbove ? 'Rises Above' : 'Falls Below'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.18rem', fontWeight: 900, color: 'var(--text-dark)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
                      ₦{targetFormatted}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
