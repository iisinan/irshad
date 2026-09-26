content = open('web/src/components/AdminSidebar.jsx').read()

OLD_BLOCK = """              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                  {user?.email || ''}
                </div>
              </div>"""

NEW_BLOCK = """              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.first_name || user?.name || 'User'}
                  </div>
                  <span style={{
                    padding: '2px 6px', borderRadius: '100px', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: user?.tier?.slug === 'max' ? 'rgba(217,160,91,0.15)' : user?.tier?.slug === 'pro' ? 'rgba(0,107,70,0.1)' : 'var(--bg-section)',
                    color: user?.tier?.slug === 'max' ? '#B8860B' : user?.tier?.slug === 'pro' ? '#006B46' : 'var(--text-muted)'
                  }}>
                    {user?.tier?.name || 'Miftah'}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {user?.email || ''}
                </div>
              </div>"""

content = content.replace(OLD_BLOCK, NEW_BLOCK)
open('web/src/components/AdminSidebar.jsx', 'w').write(content)
print(f"Replaced {content.count('tier?.slug')} times in AdminSidebar")
