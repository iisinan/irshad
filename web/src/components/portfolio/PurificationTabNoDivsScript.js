const fs = require('fs');

let content = fs.readFileSync('web/src/components/portfolio/PurificationTab.jsx', 'utf8');

const filterCode = `
  const holdings = data?.holdings || [];
  const needsPurification = holdings.filter(h => h.purification_due > 0 && !purifiedSymbols.includes(h.symbol));
  const holdingsNoDividends = holdings.filter(h => Number(h.purification_due) === 0 && Number(h.non_compliant_ratio) > 0);
`;

content = content.replace(
  "const holdings = data?.holdings || [];\n  const needsPurification = holdings.filter(h => h.purification_due > 0 && !purifiedSymbols.includes(h.symbol));",
  filterCode
);

const htmlCode = `
      {/* ─ Watching for Dividends ─ */}
      {holdingsNoDividends.length > 0 && (
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', marginTop: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={20} color="#D97706" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>Watching for Dividends</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                These stocks generate impure income and are currently awaiting dividend payments.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {holdingsNoDividends.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', overflow: 'hidden' }}>
                  {h.company_logo ? (
                    <img src={h.company_logo} alt={h.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{h.symbol.substring(0, 4)}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>{h.symbol}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {h.non_compliant_ratio}% impure ratio · No dividends in 12M
                  </div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                  Watching
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace("    </div>\n  );\n}", htmlCode);

fs.writeFileSync('web/src/components/portfolio/PurificationTab.jsx', content);
console.log('Done');
