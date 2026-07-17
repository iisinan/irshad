import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, X, Heart, CheckCircle } from 'lucide-react';

/* ─── Purify Modal ─────────────────────────────────────────── */
function PurifyModal({ holding, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    // Simulate payment API call
    setTimeout(() => {
      setLoading(false);
      onSuccess(holding.symbol);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ padding:'32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--gold-50)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--gold)' }}>
            <Heart size={32} />
          </div>
          <h3 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--text-dark)', marginBottom: '8px' }}>Purify {holding.symbol}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
            You are about to donate <strong>₦{Number(holding.purification_due).toLocaleString()}</strong> to charity. This amount cleanses your dividend income from non-compliant sources.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <button 
              onClick={handlePay} 
              disabled={loading} 
              style={{ width:'100%', padding:'16px', borderRadius:'14px', background:'var(--primary)', border:'none', color:'white', fontWeight:800, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(34,197,94,0.25)' }}
            >
              {loading ? <div className="spinner" style={{ width:'18px', height:'18px', borderTopColor:'white' }}/> : 'Donate Securely'}
            </button>
            <button 
              onClick={onClose} 
              disabled={loading}
              style={{ width:'100%', padding:'16px', borderRadius:'14px', background:'white', border:'none', color:'var(--text-muted)', fontWeight:700, fontSize:'0.95rem', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurificationTab({ data }) {
  const [purifiedSymbols, setPurifiedSymbols] = useState([]);
  const [selectedHolding, setSelectedHolding] = useState(null);

  const holdings = data?.holdings || [];
  
  // Exclude holdings the user just purified in the UI
  const needsPurification = holdings.filter(h => h.purification_due > 0 && !purifiedSymbols.includes(h.symbol));
  
  // Recalculate total due based on what's left
  const purificationDue = needsPurification.reduce((acc, h) => acc + Number(h.purification_due), 0);

  const handleSuccess = (symbol) => {
    setPurifiedSymbols(prev => [...prev, symbol]);
    setSelectedHolding(null);
  };

  return (
    <div className="animate-fade-in stagger-1">
      {selectedHolding && (
        <PurifyModal 
          holding={selectedHolding} 
          onClose={() => setSelectedHolding(null)} 
          onSuccess={handleSuccess} 
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'32px', boxShadow:'0 12px 32px rgba(13,27,42,0.15)', border:'none', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              {purificationDue > 0 ? <ShieldAlert size={28} color="var(--gold)" /> : <CheckCircle size={28} color="var(--halal)" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Dividend Purification</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '4px' }}>Cleanse your portfolio of non-compliant income</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Total Due</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: purificationDue > 0 ? '#f87171' : 'white', letterSpacing: '-1px', transition: 'color 0.3s', lineHeight: 1 }}>
              ₦{purificationDue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ background:'white', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '24px' }}>Pending Purifications</h3>
        
        {needsPurification.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', 
            borderRadius: '24px', border: '1px dashed #bbf7d0', boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ 
              width:'80px', height:'80px', background:'#dcfce7', borderRadius:'24px', 
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px',
              border:'1px solid #86efac', boxShadow:'0 12px 32px rgba(34,197,94,0.15)'
            }}>
              <CheckCircle size={36} color="var(--halal)" fill="rgba(34,197,94,0.2)" />
            </div>
            <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              Your Portfolio is Clean!
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:'1rem', maxWidth:'400px', lineHeight:1.6 }}>
              Alhamdulillah. All your dividend income is derived from Shariah-compliant sources. There are no pending purifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {needsPurification.map((h, idx) => (
              <div key={h.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                alignItems: 'center',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '18px',
                border: '1px solid var(--doubtful-border)',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(245,158,11,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(245,158,11,0.05)'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--doubtful-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'var(--doubtful)' }}>
                      {(h.symbol || '').slice(0, 4)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-dark)' }}>{h.symbol}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1px' }}>{h.shares} shares</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'var(--bg-section)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (h.purification_due / h.total_value) * 100 * 5)}%`, height: '100%', background: 'var(--doubtful)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {((h.purification_due / h.total_value) * 100).toFixed(2)}% of value
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--doubtful)', marginBottom: '8px' }}>₦{Number(h.purification_due).toLocaleString()}</div>
                  <button 
                    onClick={() => setSelectedHolding(h)}
                    style={{ 
                      background: 'var(--doubtful)', color: 'white', border: 'none', 
                      fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity='1'}
                  >
                    Purify Now <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
