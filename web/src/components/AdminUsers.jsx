import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../services/api';
import { Users, Shield, Plus, X, Search, Edit2, Trash2, Crown, ChevronRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── Shared modal input ───────────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  border: '1px solid var(--border)', background: 'var(--bg-section)',
  color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none',
  fontFamily: 'inherit',
};

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_admin_users_cache_v1');
      if (cached) { const { data } = JSON.parse(cached); return data || []; }
    } catch {}
    return [];
  });
  const [meta, setMeta] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_admin_users_cache_v1');
      if (cached) { const { meta } = JSON.parse(cached); return meta || null; }
    } catch {}
    return null;
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_admin_users_cache_v1');
      return !cached;
    } catch {}
    return true;
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', plan: 'free' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/portfolio'); return; }
    loadUsers(page, debouncedSearch);
  }, [user, page, debouncedSearch]);

  const loadUsers = async (currentPage, currentSearch) => {
    try {
      setLoading(true);
      const res = await fetchAdminUsers(currentPage, currentSearch);
      setUsers(res.data || []);
      setMeta(res);
      // Cache page 1 with no search for instant next visit
      if (currentPage === 1 && !currentSearch) {
        localStorage.setItem('irshad_admin_users_cache_v1', JSON.stringify({ data: res.data || [], meta: res }));
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      await createAdminUser(formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'user', plan: 'free' });
      loadUsers(page, debouncedSearch);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({ name: u.name || '', email: u.email || '', role: u.role || 'user', plan: u.plan || 'free' });
    setFormError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      await updateAdminUser(selectedUser.id, { name: formData.name, email: formData.email, role: formData.role, plan: formData.plan });
      toast.success('User updated successfully');
      setShowEditModal(false);
      loadUsers(page, debouncedSearch);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setFormLoading(true);
    try {
      await deleteAdminUser(selectedUser.id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      loadUsers(page, debouncedSearch);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Modal backdrop/container ──────────────────────────────
  const ModalWrap = ({ children, onClose }) => createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
      <div className="animate-fade-in" style={{ background: 'var(--bg)', width: '100%', maxWidth: '440px', borderRadius: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>,
    document.body
  );

  const ModalHeader = ({ title, subtitle, onClose }) => (
    <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        {subtitle && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{subtitle}</div>}
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{title}</h3>
      </div>
      <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
        <X size={16} />
      </button>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin</span>
          <ChevronRight size={12} color="var(--text-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Users</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </span>
              User Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 0' }}>
              View all registered users and manage their plans or roles.
            </p>
          </div>
          <button
            onClick={() => { setFormData({ name: '', email: '', password: '', role: 'user', plan: 'free' }); setShowCreateModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,82,87,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} /> New User
          </button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto', minWidth: '240px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>{meta?.total || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>Total Users</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────── */}
      <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Search bar */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-section)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search users by name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '38px', padding: '10px 14px 10px 38px' }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {meta?.total || 0} result{(meta?.total || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Plan', 'Role', 'Joined', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '13px 20px', textAlign: i === 5 ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} style={{ padding: '18px 20px' }}>
                        <div style={{ height: '13px', borderRadius: '6px', background: 'var(--bg-section)', animation: 'pulse 1.5s ease-in-out infinite', width: j === 6 ? '50px' : '75%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '56px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{u.email}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: u.plan === 'paid' ? 'rgba(180,83,9,0.08)' : 'var(--bg-section)',
                      color: u.plan === 'paid' ? '#B45309' : 'var(--text-muted)'
                    }}>
                      {u.plan === 'paid' && <Crown size={11} />}
                      {u.plan === 'paid' ? 'Premium' : 'Free'}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: u.role === 'admin' ? 'var(--primary-50)' : 'var(--bg-section)',
                      color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'
                    }}>
                      {u.role === 'admin' && <Shield size={11} />}
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditModal(u)} title="Edit User"
                        style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {user.id !== u.id && (
                        <button onClick={() => { setSelectedUser(u); setDeleteConfirmText(''); setShowDeleteModal(true); }} title="Delete User"
                          style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--non-halal)'; e.currentTarget.style.color = 'var(--non-halal)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '24px 0' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: page === 1 ? 'var(--text-light)' : 'var(--text-dark)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: page === meta.last_page ? 'var(--text-light)' : 'var(--text-dark)', cursor: page === meta.last_page ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Create User Modal ──────────────────── */}
      {showCreateModal && (
        <ModalWrap onClose={() => setShowCreateModal(false)}>
          <ModalHeader title="Create User" subtitle="New Account" onClose={() => setShowCreateModal(false)} />
          <form onSubmit={handleCreateAdmin} style={{ padding: '28px' }}>
            {formError && <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '20px', fontWeight: 600 }}>{formError}</div>}
            <FormField label="Full Name">
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Jane Smith" />
            </FormField>
            <FormField label="Email Address">
              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="jane@irshad.app" />
            </FormField>
            <FormField label="Password">
              <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} minLength={8} style={inputStyle} placeholder="Min 8 characters" />
            </FormField>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['user', 'admin'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setFormData({...formData, role: t})}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: formData.role === t ? 'var(--primary)' : 'var(--border)',
                        background: formData.role === t ? 'var(--primary-50)' : 'var(--bg-section)',
                        color: formData.role === t ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Plan</label>
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
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={formLoading} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {formLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <><Plus size={15} /> Create User</>}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* ── Edit User Modal ─────────────────────── */}
      {showEditModal && (
        <ModalWrap onClose={() => setShowEditModal(false)}>
          <ModalHeader title={selectedUser?.name} subtitle="Edit Account" onClose={() => setShowEditModal(false)} />
          <form onSubmit={handleUpdateUser} style={{ padding: '28px' }}>
            {formError && <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '20px', fontWeight: 600 }}>{formError}</div>}
            <FormField label="Full Name">
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Email Address">
              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
            </FormField>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['user', 'admin'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setFormData({...formData, role: t})}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: formData.role === t ? 'var(--primary)' : 'var(--border)',
                        background: formData.role === t ? 'var(--primary-50)' : 'var(--bg-section)',
                        color: formData.role === t ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Plan</label>
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
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={formLoading} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {formLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* ── Delete Confirmation Modal ─────────── */}
      {showDeleteModal && (
        <ModalWrap onClose={() => setShowDeleteModal(false)}>
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 10px' }}>Delete User?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-dark)' }}>{selectedUser?.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ marginBottom: '28px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Type "DELETE" to confirm
              </label>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={e => setDeleteConfirmText(e.target.value)} 
                placeholder="DELETE"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--non-halal-border)', background: 'var(--bg-section)', color: 'var(--non-halal)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', textAlign: 'center', fontWeight: 700 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-dark)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteUser} disabled={formLoading || deleteConfirmText !== 'DELETE'} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--non-halal)', border: 'none', color: 'white', fontWeight: 700, cursor: formLoading || deleteConfirmText !== 'DELETE' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5 }}>
                {formLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Delete'}
              </button>
            </div>
          </div>
        </ModalWrap>
      )}

    </div>
  );
};

export default AdminUsers;
