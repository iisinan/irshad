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
          <div style={{ background: 'linear-gradient(135deg, var(--gold-50) 0%, #fff 100%)', borderRadius: '24px', padding: '32px', border: '1px solid var(--gold-border)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '24px' }}>Calculation Result</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Wealth</span>
              <span style={{ color: 'var(--text-dark)', fontWeight: 800 }}>₦{totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nisab Threshold</span>
              <span style={{ color: 'var(--text-dark)', fontWeight: 800 }}>₦{NISAB_THRESHOLD.toLocaleString()}</span>
            </div>

            {/* Visual Breakdown */}
            {totalWealth > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset Breakdown</div>
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${(portfolioValue / totalWealth) * 100}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} title="Portfolio" />
                  <div style={{ width: `${(cashValue / totalWealth) * 100}%`, background: 'var(--gold)', transition: 'width 0.3s ease' }} title="Cash" />
                  <div style={{ width: `${(goldValue / totalWealth) * 100}%`, background: '#fbbf24', transition: 'width 0.3s ease' }} title="Gold" />
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}/> Portfolio</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }}/> Cash</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}/> Gold</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {isEligible ? <CheckCircle size={18} color="var(--primary)" /> : <Info size={18} color="var(--text-light)" />}
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isEligible ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {isEligible ? 'Eligible for Zakat' : 'Below Nisab Threshold'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--text-muted)' }}>Zakat Due (2.5%)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(212,175,55,0.2)' }}>
                ₦{zakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            <button onClick={handlePrint} className="no-print" style={{ marginTop: '24px', background: 'var(--gold)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}>
              <Download size={18} />
              Download Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
