import React, { useState, useEffect } from 'react';
import { Activity, Clock, Search, ShieldCheck, ChevronRight } from 'lucide-react';
import { fetchHistory } from '../../services/api';
import Skeleton from '../ui/Skeleton';
import CompanyLogo from '../CompanyLogo';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="animate-fade-in stagger-1" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'0', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #3C2D3E 100%)', padding: '32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid rgba(201, 149, 42, 0.15)' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201, 149, 42, 0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(201, 149, 42, 0.12)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(201, 149, 42, 0.35)' }}>
            <Activity size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Activity Log</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.79rem', marginTop: '4px', margin: 0 }}>Your recent screening and scan history</p>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800, background: 'rgba(201, 149, 42, 0.12)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(201, 149, 42, 0.3)', backdropFilter: 'blur(10px)' }}>
            {history.length} {history.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
              <Skeleton height="70px" borderRadius="14px" />
              <Skeleton height="70px" borderRadius="14px" />
              <Skeleton height="70px" borderRadius="14px" />
            </div>
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
            <div style={{ fontSize: '1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              No Recent Activity
            </div>
            <p style={{ color:'var(--text-muted)', fontSize: '0.88rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
              Your stock screening and product scan history will appear here. Start exploring the market to build your activity log.
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
              <Search size={18}/> Screen Stocks
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item, i) => {
              const isStock = item.action === 'check' && item.detail?.symbol;
              return (
                <div 
                  key={item.id || i}
                  onClick={() => {
                    if (isStock) {
                      navigate(`/market/${item.detail.symbol}`);
                    }
                  }}
                  className={`roll-in-anim ${isStock ? 'hover-lift' : ''}`}
                  style={{ 
                    animationDelay: `${(i % 15) * 0.03}s`,
                    background: 'var(--bg)', borderRadius: '16px', padding: '18px 20px', border: '1px solid var(--border)',
                    cursor: isStock ? 'pointer' : 'default', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isStock ? (
                      <CompanyLogo symbol={item.detail.symbol} logoUrl={item.detail.logo_url} size={42} radius={12} />
                    ) : (
                      <div style={{ width: '42px', height: '42px', background: 'var(--primary-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800 }}>
                        {getActionIcon(item.action)}
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.2px' }}>
                        {getActionText(item)}
                      </h4>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
                        {item.detail?.name || (isStock ? `${item.detail.symbol} Screening Analysis` : 'Manual Action')}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)', fontSize: '0.72rem', fontWeight: 600 }}>
                      <Clock size={13} />
                      {formatDate(item.created_at)}
                    </div>
                    {isStock && <ChevronRight size={18} color="var(--text-light)" />}
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
