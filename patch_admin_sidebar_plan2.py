content = open('web/src/components/AdminSidebar.jsx').read()

OLD_BLOCK = """                  {user?.role === 'admin' && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 800,
                      color: '#FFFFFF', background: 'var(--primary)',
                      padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.5px',
                      textTransform: 'uppercase', flexShrink: 0,
                    }}>Admin</span>
                  )}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>"""

NEW_BLOCK = """                  {user?.role === 'admin' && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 800,
                      color: '#FFFFFF', background: 'var(--primary)',
                      padding: '2px 5px', borderRadius: '4px', letterSpacing: '0.5px',
                      textTransform: 'uppercase', flexShrink: 0,
                    }}>Admin</span>
                  )}
                  <span style={{
                    padding: '2px 6px', borderRadius: '100px', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: user?.tier?.slug === 'max' ? 'rgba(217,160,91,0.15)' : user?.tier?.slug === 'pro' ? 'rgba(0,107,70,0.1)' : 'var(--bg-section)',
                    color: user?.tier?.slug === 'max' ? '#B8860B' : user?.tier?.slug === 'pro' ? '#006B46' : 'var(--text-muted)',
                    marginLeft: user?.role === 'admin' ? 0 : 'auto',
                  }}>
                    {user?.tier?.name || 'Miftah'}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>"""

content = content.replace(OLD_BLOCK, NEW_BLOCK)
open('web/src/components/AdminSidebar.jsx', 'w').write(content)
print(f"Replaced in AdminSidebar")
