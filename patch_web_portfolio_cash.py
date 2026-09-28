import re

content = open('web/src/components/portfolio/PortfolioTab.jsx').read()

OLD = """              {totalGainPct !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPortfolioUp ? '#16a34a' : '#dc2626' }}>
                  {isPortfolioUp ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownRight size={18} strokeWidth={3} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    {isPortfolioUp ? '+' : ''}{totalGainPct}% Avg Return
                  </span>
                </div>
              )}
            </div>"""

NEW = """              {totalGainPct !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPortfolioUp ? '#16a34a' : '#dc2626' }}>
                  {isPortfolioUp ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownRight size={18} strokeWidth={3} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    {isPortfolioUp ? '+' : ''}{totalGainPct}% Avg Return
                  </span>
                </div>
              )}
            </div>
            
            {(summary.cash_balance > 0) && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <div style={{ padding: '6px 12px', background: 'var(--primary-10)', borderRadius: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                  Stocks: \u20A6{(totalBalance - summary.cash_balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(22, 163, 74, 0.1)', borderRadius: '8px', color: '#16a34a', fontWeight: 800, fontSize: '0.85rem' }}>
                  Cash: \u20A6{(summary.cash_balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}"""

content = content.replace(OLD, NEW)
open('web/src/components/portfolio/PortfolioTab.jsx', 'w').write(content)
print("Patched PortfolioTab.jsx for Cash Balance")
