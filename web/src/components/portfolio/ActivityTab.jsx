import React, { useState, useEffect } from 'react';
import { Activity, Clock, Search, ShieldCheck } from 'lucide-react';
import { fetchHistory } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ActivityTab() {
  const [history, setHistory] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_activity_cache_v1');
      if (cached) return JSON.parse(cached) || [];
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => history.length === 0);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      if (history.length === 0) setLoading(true);
      const res = await fetchHistory();
      const newHistory = res.data?.history || [];
      setHistory(newHistory);
      localStorage.setItem('irshad_activity_cache_v1', JSON.stringify(newHistory));
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
  };

  const getActionIcon = (action) => {
    if (action === 'check') return <Search size={16} />;
    if (action === 'scan') return <ShieldCheck size={16} />;
    return <Activity size={16} />;
  };

  const getActionText = (item) => {
    if (item.action === 'check') {
      return `Screened ${item.detail?.symbol || 'Unknown Stock'}`;
    }
    if (item.action === 'scan') {
      return `Scanned Product Barcode ${item.detail?.barcode || 'Unknown'}`;
    }
    return 'Activity Logged';
  };

  return (
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'0', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Activity size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Activity Log</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '4px' }}>Your recent screening and scan history</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading activity...</p>
          </div>
        ) : history.length === 0 ? (
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
              <Clock size={36} color="var(--primary)" opacity={0.8} />
            </div>
            <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              No Recent Activity
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:'1rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
              Your stock screening and product scan history will appear here. Start exploring the market to build your activity log.
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
              <Search size={18}/> Screen Stocks
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item, i) => (
              <div 
                key={item.id}
                onClick={() => {
                  if (item.action === 'check' && item.detail?.symbol) {
                    navigate(`/market/${item.detail.symbol}`);
                  }
                }}
                className={`roll-in-anim ${item.action === 'check' ? 'hover-lift' : ''}`}
                style={{ 
                  animationDelay: `${i * 0.03}s`,
                  background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)',
                  cursor: item.action === 'check' ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'var(--primary-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800 }}>
                    {getActionIcon(item.action)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>{getActionText(item)}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.detail?.name || 'Manual Action'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Clock size={12} />
                  {formatDate(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
