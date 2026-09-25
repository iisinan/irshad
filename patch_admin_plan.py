content = open('web/src/components/AdminUsers.jsx').read()

# 1. Add overrideAdminUserPlan import
content = content.replace(
    "import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../services/api';",
    "import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, overrideAdminUserPlan } from '../services/api';"
)

# 2. Add CreditCard icon import
content = content.replace(
    "import { Crown, Shield, Edit2, Trash2, Activity, Plus, Search, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';",
    "import { Crown, Shield, Edit2, Trash2, Activity, Plus, Search, AlertTriangle, ChevronLeft, ChevronRight, X, CreditCard, CheckCircle2 } from 'lucide-react';"
)

# 3. Add state variables for the override modal  
content = content.replace(
    "  const [showDeleteModal, setShowDeleteModal] = useState(false);",
    "  const [showDeleteModal, setShowDeleteModal] = useState(false);\n  const [showPlanModal, setShowPlanModal] = useState(false);\n  const [planOverrideLoading, setPlanOverrideLoading] = useState(false);\n  const [planOverrideSuccess, setPlanOverrideSuccess] = useState('');\n  const [planForm, setPlanForm] = useState({ plan_slug: 'pro', expires_at: '', note: '' });"
)

# 4. Add openPlanModal handler after openEditModal
old_open_edit = "  const openEditModal = (u) => {"
new_open_edit = """  const openPlanModal = (u) => {
    setSelectedUser(u);
    setPlanOverrideSuccess('');
    setPlanForm({ plan_slug: 'pro', expires_at: '', note: '' });
    setShowPlanModal(true);
  };

  const submitPlanOverride = async () => {
    setPlanOverrideLoading(true);
    try {
      const res = await overrideAdminUserPlan(selectedUser.id, planForm.plan_slug, planForm.expires_at || null, planForm.note);
      setPlanOverrideSuccess(res.message || 'Plan updated!');
      // Update local users list to reflect change
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, _planOverride: planForm.plan_slug } : u));
    } catch (e) {
      setPlanOverrideSuccess('Error: ' + (e.response?.data?.message || 'Failed to override plan'));
    }
    setPlanOverrideLoading(false);
  };

  const openEditModal = (u) => {"""

content = content.replace(old_open_edit, new_open_edit)

# 5. Improve the plan badge in the table to show actual tier info
old_plan_badge = """                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: u.plan === 'paid' ? 'rgba(180,83,9,0.08)' : 'var(--bg-section)',
                      color: u.plan === 'paid' ? '#B45309' : 'var(--text-muted)'
                    }}>
                      {u.plan === 'paid' && <Crown size={11} />}
                      {u.plan === 'paid' ? 'Premium' : 'Free'}
                    </span>
                  </td>"""

new_plan_badge = """                  <td style={{ padding: '15px 20px' }}>
                    {(() => {
                      const slug = u._planOverride || u.tier?.slug || 'free';
                      const label = slug === 'max' ? 'Noor' : slug === 'pro' ? 'Rawdah' : 'Miftah';
                      const bg = slug === 'max' ? 'rgba(217,160,91,0.12)' : slug === 'pro' ? 'rgba(0,107,70,0.1)' : 'var(--bg-section)';
                      const color = slug === 'max' ? '#B8860B' : slug === 'pro' ? '#006B46' : 'var(--text-muted)';
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: bg, color }}>
                          {slug !== 'free' && <Crown size={11} />}
                          {label}
                        </span>
                      );
                    })()}
                  </td>"""

content = content.replace(old_plan_badge, new_plan_badge)

# 6. Add override plan button to the actions column
old_actions = '                      <button onClick={() => openEditModal(u)} title="Edit User"'
new_actions = """                      <button onClick={() => openPlanModal(u)} title="Override Plan"
                        style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#006B46'; e.currentTarget.style.color = '#006B46'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <CreditCard size={14} />
                      </button>
                      <button onClick={() => openEditModal(u)} title="Edit User" """

content = content.replace(old_actions, new_actions)

# 7. Add the Plan Override Modal before closing fragment
old_footer = "      {/* ── Create User Modal ──────────────────── */"
new_footer = """      {/* ── Plan Override Modal ────────────────── */}
      {showPlanModal && selectedUser && (
        <ModalWrap onClose={() => { setShowPlanModal(false); setPlanOverrideSuccess(''); }}>
          <ModalHeader
            title="Override Subscription Plan"
            subtitle={selectedUser.name}
            onClose={() => { setShowPlanModal(false); setPlanOverrideSuccess(''); }}
          />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {planOverrideSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
                <CheckCircle2 size={48} color={planOverrideSuccess.startsWith('Error') ? '#EF4444' : '#10B981'} />
                <p style={{ textAlign: 'center', fontWeight: 700, color: planOverrideSuccess.startsWith('Error') ? 'var(--non-compliant)' : 'var(--primary)', fontSize: '0.95rem' }}>{planOverrideSuccess}</p>
                <button onClick={() => { setShowPlanModal(false); setPlanOverrideSuccess(''); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '100px', padding: '10px 28px', fontWeight: 700, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg-section)', borderRadius: '12px', padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Current plan: <strong style={{ color: 'var(--text-dark)' }}>
                    {selectedUser.tier?.slug === 'max' ? 'Noor (Max)' : selectedUser.tier?.slug === 'pro' ? 'Rawdah (Pro)' : 'Miftah (Free)'}
                  </strong>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>NEW PLAN</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { slug: 'free', label: 'Miftah', sub: 'Free', color: 'var(--text-muted)', border: 'var(--border)' },
                      { slug: 'pro', label: 'Rawdah', sub: 'Pro', color: '#006B46', border: '#006B46' },
                      { slug: 'max', label: 'Noor', sub: 'Max', color: '#B8860B', border: '#D9A05B' },
                    ].map(p => (
                      <button key={p.slug} onClick={() => setPlanForm(f => ({ ...f, plan_slug: p.slug }))} style={{
                        padding: '14px 8px', borderRadius: '12px', border: `2px solid ${planForm.plan_slug === p.slug ? p.border : 'var(--border)'}`,
                        background: planForm.plan_slug === p.slug ? `${p.color}12` : 'var(--bg)',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                      }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: planForm.plan_slug === p.slug ? p.color : 'var(--text-dark)' }}>{p.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>EXPIRY DATE <span style={{ fontWeight: 500 }}>(leave blank for 1 year)</span></label>
                  <input type="date" value={planForm.expires_at} onChange={e => setPlanForm(f => ({ ...f, expires_at: e.target.value }))}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>NOTE (optional)</label>
                  <input type="text" placeholder="e.g. Scholarship, partner, beta tester..." value={planForm.note} onChange={e => setPlanForm(f => ({ ...f, note: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </div>

                <button onClick={submitPlanOverride} disabled={planOverrideLoading} style={{
                  width: '100%', padding: '14px', borderRadius: '100px',
                  background: planForm.plan_slug === 'max' ? '#D9A05B' : planForm.plan_slug === 'pro' ? '#006B46' : '#374151',
                  border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: planOverrideLoading ? 'not-allowed' : 'pointer',
                  opacity: planOverrideLoading ? 0.7 : 1, transition: 'all 0.2s'
                }}>
                  {planOverrideLoading ? 'Applying...' : `Move to ${planForm.plan_slug === 'max' ? 'Noor (Max)' : planForm.plan_slug === 'pro' ? 'Rawdah (Pro)' : 'Miftah (Free)'}`}
                </button>
              </>
            )}
          </div>
        </ModalWrap>
      )}

      {/* ── Create User Modal ──────────────────── */}"""

content = content.replace(old_footer, new_footer)

open('web/src/components/AdminUsers.jsx', 'w').write(content)
print("done")
