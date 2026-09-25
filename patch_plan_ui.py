content = open('web/src/components/AdminUsers.jsx').read()

# The new 3-plan selector JSX (used in both modals)
PLAN_SELECTOR = """                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Plan</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { slug: 'free', label: 'Miftah', color: 'var(--text-muted)', border: 'var(--border)' },
                    { slug: 'pro',  label: 'Rawdah', color: '#006B46', border: '#006B46' },
                    { slug: 'max',  label: 'Noor',   color: '#B8860B', border: '#D9A05B' },
                  ].map(p => (
                    <button key={p.slug} type="button" onClick={() => setFormData({...formData, plan: p.slug})} style={{
                      padding: '10px 4px', borderRadius: '10px',
                      border: `1.5px solid ${formData.plan === p.slug ? p.border : 'var(--border)'}`,
                      background: formData.plan === p.slug ? `${p.color}18` : 'var(--bg-section)',
                      color: formData.plan === p.slug ? p.color : 'var(--text-muted)',
                      fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                    }}>{p.label}</button>
                  ))}
                </div>"""

OLD_PLAN_BLOCK = """                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Plan</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['free', 'paid'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setFormData({...formData, plan: t})}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: formData.plan === t ? 'var(--primary)' : 'var(--border)',
                        background: formData.plan === t ? 'var(--primary-50)' : 'var(--bg-section)',
                        color: formData.plan === t ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                      }}
                    >{t === 'paid' ? 'Premium' : 'Free'}</button>
                  ))}
                </div>"""

# Replace ALL occurrences (create modal + edit modal both have this block)
content = content.replace(OLD_PLAN_BLOCK, PLAN_SELECTOR)

open('web/src/components/AdminUsers.jsx', 'w').write(content)
print(f"Replaced: {content.count('Miftah') - 1} occurrences found (expected 2+ from badges + 2 selectors)")
