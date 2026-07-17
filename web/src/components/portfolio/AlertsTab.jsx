import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchPriceAlerts, deletePriceAlert } from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'0', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Bell size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Price Alerts</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '4px' }}>Never miss a price movement</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading alerts...</p>
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
            <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              No Active Price Alerts
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:'1rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
              Set up price alerts for your favorite stocks to be notified immediately when they hit your target price.
            </p>
            <button 
              onClick={() => navigate('/market')} 
              style={{ 
                display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
                borderRadius:'14px', background:'var(--gold-grad)', color:'white', border:'none', 
                fontWeight:800, fontSize:'0.95rem', cursor:'pointer', textDecoration:'none',
                boxShadow:'0 8px 24px rgba(201,168,76,0.3)', transition:'transform 0.2s, boxShadow 0.2s' 
              }}
            >
              <TrendingUp size={18}/> Set an Alert
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {alerts.map((alert, i) => (
              <div 
                key={alert.id}
                onClick={() => navigate(`/market/${alert.symbol}`)}
                className="roll-in-anim hover-lift"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', background: 'var(--bg-section)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800 }}>
                      {alert.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{alert.symbol}</h4>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: alert.is_active ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: alert.is_active ? 'var(--primary)' : 'var(--text-light)' }} />
                        {alert.is_active ? 'Active' : 'Triggered'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, alert.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--non-halal)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-section)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {alert.condition === 'above' ? <ArrowUpRight size={20} color="var(--halal)" /> : <ArrowDownRight size={20} color="var(--non-halal)" />}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Target</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    ₦{Number(alert.target_price).toFixed(2)}
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
