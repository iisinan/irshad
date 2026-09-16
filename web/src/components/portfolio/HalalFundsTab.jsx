import React, { useState } from 'react';
import { Search, Briefcase, Filter } from 'lucide-react';

const funds = [
  { asset: 'Afrinvest Halal Fund', provider: 'Afrinvest Asset Mgt Ltd.' },
  { asset: 'ARM Halal Balanced Fund', provider: 'ARM Investment Management' },
  { asset: 'ARM Sharia Compliant Fixed Income Fund', provider: 'ARM Investment Management' },
  { asset: 'CapitalTrust Halal Fixed Income Fund', provider: 'CapitalTrust Investments' },
  { asset: 'CFG Ethical Fund', provider: 'CFG Asset Management' },
  { asset: 'Cordros Halal Fixed Income Fund', provider: 'Cordros Asset Management' },
  { asset: 'D\'Namaz Halal Fixed Income Fund', provider: 'D\'Namaz Capital Limited' },
  { asset: 'EDC Halal Fund', provider: 'EDC Fund Management' },
  { asset: 'Emerging Africa Halal Fund', provider: 'Emerging Africa Asset Management' },
  { asset: 'First Asset Halal Fund', provider: 'First Asset Management' },
  { asset: 'FSDH Halal Fund', provider: 'FSDH Asset Management' },
  { asset: 'Lotus Halal 15 ETF', provider: 'Lotus Capital Limited' },
  { asset: 'Lotus Halal ETF', provider: 'Lotus Capital Limited' },
  { asset: 'Lotus Halal Fixed Income Fund', provider: 'Lotus Capital Limited' },
  { asset: 'Lotus Halal Investment Fund', provider: 'Lotus Capital Limited' },
  { asset: 'Lotus Waqf (Endowment) Fund', provider: 'Lotus Capital Limited' },
  { asset: 'Marble Halal Commodities Fund', provider: 'Marble Capital Limited' },
  { asset: 'Marble Halal Fixed Income Fund', provider: 'Marble Capital Limited' },
  { asset: 'Norrenberger Islamic Fund', provider: 'Norrenberger Investments' },
  { asset: 'One17 Halal Fund', provider: 'One17 Capital Limited' },
  { asset: 'Stanbic IBTC Ethical Fund', provider: 'Stanbic IBTC Asset Mgt.' },
  { asset: 'Stanbic IBTC Shariah Fixed Income Fund', provider: 'Stanbic IBTC Asset Mgt.' },
];

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');

  const filteredFunds = funds.filter(f => 
    f.asset.toLowerCase().includes(search.toLowerCase()) || 
    f.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>Halal Mutual Funds</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Explore curated, shariah-compliant mutual funds and ETFs.</p>
        </div>
        
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '320px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search funds or providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'var(--bg)',
              fontSize: '0.85rem', color: 'var(--text-dark)', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Asset</th>
                <th style={{ padding: '16px 20px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Provider</th>
              </tr>
            </thead>
            <tbody>
              {filteredFunds.map((fund, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: idx === filteredFunds.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-section)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <Briefcase size={16} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{fund.asset}</span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {fund.provider}
                  </td>
                </tr>
              ))}
              {filteredFunds.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No funds found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
