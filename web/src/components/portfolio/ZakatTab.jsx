import React, { useState } from 'react';
import { Calculator, Download, CheckCircle, Info } from 'lucide-react';

export default function ZakatTab({ data }) {
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');

  // Fixed Nisab value for demo (could be fetched from API later)
  const NISAB_THRESHOLD = 3000000; // 3 Million Naira
  
  const portfolioValue = data?.summary?.total_balance || 0;
  const cashValue = Number(cash) || 0;
  const goldValue = Number(gold) || 0;
  
  const totalWealth = portfolioValue + cashValue + goldValue;
  const isEligible = totalWealth >= NISAB_THRESHOLD;
  const zakatDue = isEligible ? (totalWealth * 0.025) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in stagger-1 zakat-print-container">
      {/* Print-specific styles to hide navigation and other elements during print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .zakat-print-container, .zakat-print-container * {
            visibility: visible;
          }
          .zakat-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div style={{ background:'white', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--gold-50)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <Calculator size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Zakat Calculator</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Calculate your 2.5% obligation (Hawl & Nisab)</p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label style={{ display:'block', fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>
                Stock Portfolio Value
              </label>
              <div style={{ background:'var(--bg-section)', padding:'16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1.1rem', fontWeight:700, color:'var(--text-dark)' }}>
                ₦{portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'6px', display:'block' }} className="no-print">Automatically synced from your Overview</span>
            </div>

            <div className="input-group no-print">
              <label style={{ display:'block', fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>
                Cash & Savings
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                <input 
                  type="number"
                  value={cash}
                  onChange={e => setCash(e.target.value)}
                  placeholder="0.00"
                  style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1.1rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }}
                />
              </div>
            </div>

            <div className="input-group no-print">
              <label style={{ display:'block', fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>
                Gold & Silver Value
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                <input 
                  type="number"
                  value={gold}
                  onChange={e => setGold(e.target.value)}
                  placeholder="0.00"
                  style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1.1rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }}
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius: '24px', padding: '32px', border: 'none', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 32px rgba(13,27,42,0.15)', position: 'relative', overflow: 'hidden', color: 'white' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%', filter: 'blur(30px)' }} />
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
              <Calculator size={18} color="var(--gold)" /> Calculation Result
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Total Wealth</span>
              <span style={{ color: 'white', fontWeight: 900 }}>₦{totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Nisab Threshold</span>
              <span style={{ color: 'white', fontWeight: 900 }}>₦{NISAB_THRESHOLD.toLocaleString()}</span>
            </div>

            {/* Nisab Progress */}
            <div style={{ marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nisab Progress</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isEligible ? 'var(--halal)' : 'var(--text-muted)' }}>
                  {Math.min(100, Math.round((totalWealth / NISAB_THRESHOLD) * 100))}%
                </span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-section)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ 
                  width: `${Math.min(100, (totalWealth / NISAB_THRESHOLD) * 100)}%`, 
                  height: '100%', 
                  background: isEligible ? 'var(--primary)' : 'var(--gold)', 
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  borderRadius: '10px'
                }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: isEligible ? 'var(--primary)' : 'var(--text-muted)' }}>
                {isEligible ? <CheckCircle size={16} color="var(--primary)" /> : <Info size={16} color="var(--text-light)" />}
                {isEligible ? 'You have reached the Nisab threshold. Zakat is due.' : `₦${(NISAB_THRESHOLD - totalWealth).toLocaleString(undefined, { maximumFractionDigits: 0 })} away from Nisab threshold.`}
              </div>
            </div>

            {/* Visual Breakdown */}
            {totalWealth > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset Breakdown</div>
                <div style={{ display: 'flex', height: '14px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: `${(portfolioValue / totalWealth) * 100}%`, background: 'var(--primary)', transition: 'width 0.5s ease' }} title="Portfolio" />
                  <div style={{ width: `${(cashValue / totalWealth) * 100}%`, background: 'var(--gold)', transition: 'width 0.5s ease' }} title="Cash" />
                  <div style={{ width: `${(goldValue / totalWealth) * 100}%`, background: '#fbbf24', transition: 'width 0.5s ease' }} title="Gold" />
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}/> Portfolio</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)' }}/> Cash</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}/> Gold</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: '0 8px 32px rgba(212,175,55,0.08)' }}>
              <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>Zakat Due (2.5%)</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1.5px', textShadow: '0 4px 20px rgba(212,175,55,0.25)', lineHeight: 1 }}>
                ₦{zakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            <button onClick={handlePrint} className="no-print" style={{ marginTop: '24px', background: 'var(--primary)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(15,82,87,0.3)' }}>
              <Download size={18} />
              Download Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
