import re

content = open('web/src/components/portfolio/AddHoldingModal.jsx').read()

OLD = """                  <button type="button" onClick={handleLinkBroker} disabled={linking || !brokerName} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: (linking || !brokerName) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(69, 165, 138,0.25)', opacity: (linking || !brokerName) ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {linking ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : 'Continue'}
                  </button>"""

NEW = """                  <button type="button" disabled={true} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--border)', border: 'none', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.88rem', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    Coming Soon
                  </button>"""

content = content.replace(OLD, NEW)
open('web/src/components/portfolio/AddHoldingModal.jsx', 'w').write(content)
print("Patched web broker button")
