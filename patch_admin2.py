content = open('web/src/components/AdminUsers.jsx').read()

# Fix plan badge to use active_plan_slug from API
content = content.replace(
    "const slug = u._planOverride || u.tier?.slug || 'free';",
    "const slug = u._planOverride || u.active_plan_slug || 'free';"
)

# Add subscription expiry as a tooltip/sub-text below badge
content = content.replace(
    """                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: bg, color }}>
                          {slug !== 'free' && <Crown size={11} />}
                          {label}
                        </span>""",
    """                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: bg, color }}>
                            {slug !== 'free' && <Crown size={11} />}
                            {label}
                          </span>
                          {u.subscription_ends && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px', paddingLeft: '2px' }}>until {u.subscription_ends}</div>}
                        </div>"""
)

# Fix modal current plan display to use active_plan_slug
content = content.replace(
    "  Current plan: <strong style={{ color: 'var(--text-dark)' }}>\n                  {selectedUser.tier?.slug === 'max' ? 'Noor (Max)' : selectedUser.tier?.slug === 'pro' ? 'Rawdah (Pro)' : 'Miftah (Free)'}\n                  </strong>",
    """  Current plan: <strong style={{ color: 'var(--text-dark)' }}>
                  {(selectedUser._planOverride || selectedUser.active_plan_slug) === 'max' ? 'Noor (Max)' : (selectedUser._planOverride || selectedUser.active_plan_slug) === 'pro' ? 'Rawdah (Pro)' : 'Miftah (Free)'}
                  </strong>
                  {selectedUser.subscription_ends && <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>· until {selectedUser.subscription_ends}</span>}"""
)

open('web/src/components/AdminUsers.jsx', 'w').write(content)
print("done")
