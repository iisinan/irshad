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
      <div style={{ background:'white', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', background: purificationDue > 0 ? 'rgba(230,81,0,0.08)' : 'var(--halal-bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: purificationDue > 0 ? 'var(--doubtful)' : 'var(--halal)' }}>
            {purificationDue > 0 ? <ShieldAlert size={28} /> : <CheckCircle size={28} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Dividend Purification</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Cleanse your portfolio of non-compliant income</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Due</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: purificationDue > 0 ? 'var(--doubtful)' : 'var(--text-dark)', letterSpacing: '-1px', transition: 'color 0.3s' }}>
            ₦{purificationDue.toLocaleString()}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {needsPurification.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{h.symbol}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.shares} Shares</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--doubtful)' }}>₦{Number(h.purification_due).toLocaleString()}</div>
                  <button 
                    onClick={() => setSelectedHolding(h)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', marginTop: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Purify Now <ArrowRight size={12} />
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
