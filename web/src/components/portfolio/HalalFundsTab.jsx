import React, { useState } from 'react';
import { Search, Briefcase, Filter, Info } from 'lucide-react';

const funds = [
  { 
    asset: 'Afrinvest Halal Fund', 
    provider: 'Afrinvest Asset Management Ltd',
    description: 'Managed by Afrinvest Asset Management Ltd, the asset-management arm of Afrinvest West Africa and overseen by an Advisory Committee of Experts (ACE). Launched July 2025. Investment Components: 70–100% in Sukuk, 30% Shariah-compliant equities.'
  },
  { 
    asset: 'ARM Halal Balanced Fund', 
    provider: 'ARM Investment Managers Ltd',
    description: 'Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co). Launched July 2004. Trustee: Royal Exchange Plc. Custodian: Rand Merchant Bank.'
  },
  { 
    asset: 'ARM Sharia Compliant Fixed Income Fund', 
    provider: 'ARM Investment Managers Ltd',
    description: 'Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co). Launched July 2024. Trustee: FBNQuest Trustees. Custodian: Rand Merchant Bank. Investment Components: Sukuk, Mudarabah and Murabaha with a minimum BBB rating.'
  },
  { 
    asset: 'CapitalTrust Halal Fixed Income Fund', 
    provider: 'CapitalTrust Investments & Asset Management Ltd',
    description: 'Managed by CapitalTrust Investments & Asset Management Ltd (founded 2006, Lagos). Standalone halal fixed-income funds (2021).'
  },
  { 
    asset: 'CFG Ethical Fund', 
    provider: 'CFG Asset',
    description: 'Managed by CFG Asset (CFG Africa investment bank). Trustee: AVA Trustees. Custodian: Rand Merchant Bank. Registrar: CardinalStone. Shariah adviser:One17 Capital.'
  },
  { 
    asset: 'Cordros Halal Fixed Income Fund', 
    provider: 'Cordros Asset Management Ltd',
    description: 'Managed by Cordros Asset Management Ltd (part of Cordros Capital) but launched alongside a matching conventional Cordros Fixed Income Fund preventing co-mingling.'
  },
  { 
    asset: 'D\'Namaz Halal Fixed Income Fund', 
    provider: 'D\'Namaz Capital',
    description: 'Managed by D\'Namaz Capital. Launched May 2025. Components benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY, only as a yardstick to judge whether the Sukuk/Murabaha returns are competitive with what a conventional saver could get elsewhere.'
  },
  { 
    asset: 'EDC Halal Fund', 
    provider: 'EDC Fund Management',
    description: 'Managed by EDC Fund Management, the asset-management subsidiary of Ecobank Nigeria/Ecobank Capital Group. Launched August 2022 and positioned as a template for a multi-country Islamic fund, not just a domestic product.'
  },
  { 
    asset: 'Emerging Africa Halal Fund', 
    provider: 'Emerging Africa Asset Management Ltd',
    description: 'Managed by Emerging Africa Asset Management Ltd (EAAML) and part of the Emerging Africa Group. Launched July 2024.'
  },
  { 
    asset: 'FSDH Halal Fund', 
    provider: 'FSDH Asset Management Ltd',
    description: 'Managed by FSDH Asset Management Ltd (FSDH Group). Established October 2023 as part of FSDH\'s broader "Coral Funds" family.'
  },
  { 
    asset: 'Lotus Halal ETF', 
    provider: 'Lotus Capital Ltd',
    description: 'Managed by Lotus Capital Ltd. Launched 2014 and tracks the NSE-Lotus Islamic Index. The only halal equity ETF on the NGX.'
  },
  { 
    asset: 'Lotus Halal Fixed Income Fund', 
    provider: 'Lotus Capital Ltd',
    description: 'Managed by Lotus Capital. Invests in Sukuk plus Ijarah and Murabaha contracts.'
  },
  { 
    asset: 'Lotus Halal Investment Fund', 
    provider: 'Lotus Capital Ltd',
    description: 'Managed by Lotus Capital. SEC-registered Shariah-compliant equity fund, equity-based (not fixed-income).'
  },
  { 
    asset: 'Lotus Waqf (Endowment) Fund', 
    provider: 'Lotus Capital Ltd',
    description: 'Managed by Lotus Capital. SEC-approved endowment (Waqf) fund — structured so investment income perpetually funds charitable causes (education, healthcare, economic empowerment) rather than a standard income vehicle.'
  },
  { 
    asset: 'Marble Halal Commodities Fund', 
    provider: 'Marble Capital Ltd',
    description: 'Managed by Marble Capital Ltd. Launched 2021 as a SEC-approved Shariah-compliant commodities fund, investing in securitized commodities (agriculture, precious metals) rather than the Sukuk/equity mix typical of other halal funds.'
  },
  { 
    asset: 'Marble Halal Fixed Income Fund', 
    provider: 'Marble Capital Ltd',
    description: 'Managed by Marble Capital. Launched 2023. Invests in low risk Sukuk plus Ijarah and Murabaha contracts.'
  },
  { 
    asset: 'Norrenberger Islamic Fund', 
    provider: 'Norrenberger Asset Management Ltd',
    description: 'Managed by Norrenberger Asset Management Ltd. Launched 2021 as a shari\'ah compliant fixed-income fund. Trustee: UTL Trust Management Services.'
  },
  { 
    asset: 'One17 Halal Fund', 
    provider: 'One17 Capital Ltd',
    description: 'Managed by One17 Capital Ltd. SEC-licensed ethical/Shariah advisory and fund manager.'
  },
  { 
    asset: 'Stanbic IBTC Ethical Fund (Imaan Fund)', 
    provider: 'Stanbic IBTC Asset Management',
    description: 'Managed by Stanbic IBTC Asset Management investing in shari\'ah-compliant equity product (min. 70% Shariah-compliant equities, up to 30% Sukuk/Shariah money-market instruments).'
  },
  { 
    asset: 'Stanbic IBTC Shariah Fixed Income Fund', 
    provider: 'Stanbic IBTC Asset Management',
    description: 'Managed by Stanbic IBTC Asset Management. Launched August 2019 and invests in Sukuk (minimum 70%).'
  },
];

const getAvatarStyle = (str) => {
  const colors = [
    { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
    { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
    { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
    { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' },
    { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.2)' },
    { bg: 'rgba(14, 165, 233, 0.1)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' },
    { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', border: 'rgba(249, 115, 22, 0.2)' },
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');

  const filteredFunds = funds.filter(f => 
    f.asset.toLowerCase().includes(search.toLowerCase()) || 
    f.provider.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
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
              {filteredFunds.map((fund, idx) => {
                const avatar = getAvatarStyle(fund.provider);
                return (
                <tr 
                  key={idx} 
                  style={{ borderBottom: idx === filteredFunds.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}
                  className="hover-bg"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-section)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '20px', verticalAlign: 'top', minWidth: '300px' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: '12px', 
                        background: avatar.bg, 
                        color: avatar.text, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
                        border: `1px solid ${avatar.border}`,
                        marginTop: '4px'
                      }}>
                        {fund.provider.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>{fund.asset}</span>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <Info size={14} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '600px' }}>
                            {fund.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, verticalAlign: 'top', paddingTop: '26px' }}>
                    {fund.provider}
                  </td>
                </tr>
                );
              })}
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
