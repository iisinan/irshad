import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Check, X, Shield, Clock, AlertTriangle, Edit2, Save,
  RefreshCw, TrendingUp, TrendingDown, ArrowRight,
  Sparkles, ExternalLink, History, Search, Filter,
  CheckSquare, Square, ChevronDown, Inbox
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────── */
const STATUS_CFG = {
  halal:      { label: 'HALAL',      bg: 'rgba(16,185,129,.12)', color: '#059669', border: 'rgba(16,185,129,.3)' },
  'non-halal':{ label: 'NON-HALAL',  bg: 'rgba(239,68,68,.10)',  color: '#DC2626', border: 'rgba(239,68,68,.3)'  },
  doubtful:   { label: 'DOUBTFUL',   bg: 'rgba(245,158,11,.12)', color: '#D97706', border: 'rgba(245,158,11,.3)' },
};

const StatusPill = ({ status, size = 'sm' }) => {
  const c = STATUS_CFG[status] ?? { label: (status || 'UNKNOWN').toUpperCase(), bg: 'rgba(100,100,100,.1)', color: '#6B7280', border: 'rgba(100,100,100,.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'lg' ? '5px 13px' : '3px 9px',
      borderRadius: 100, fontSize: size === 'lg' ? '0.73rem' : '0.63rem',
      fontWeight: 800, letterSpacing: '.6px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
};

const Badge = ({ children, color = '#6B7280' }) => (
  <span style={{
    padding: '2px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
    background: `${color}18`, color, border: `1px solid ${color}30`
  }}>{children}</span>
);

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 16,
    padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 130,
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const Toast = ({ toast }) => toast ? (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    padding: '13px 18px', borderRadius: 14, fontWeight: 700, fontSize: '0.86rem',
    background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
    color: toast.type === 'error' ? '#DC2626' : '#059669',
    border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
    display: 'flex', alignItems: 'center', gap: 10,
    animation: 'slideIn .25s ease',
  }}>
    {toast.type === 'error' ? <X size={15}/> : <Check size={15}/>} {toast.msg}
  </div>
) : null;

/* ─── main component ────────────────────────────────────────── */
export default function AdminComplianceReviews() {
  const { user } = useAuth();

  // tabs: 'pending' | 'history'
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState(null);

  // per-card state
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({ new_status: '', reason: '' });
  const [processingId, setProcId]   = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // selection for bulk actions
  const [selected, setSelected] = useState(new Set());

  // filters
  const [search, setSearch]         = useState('');
  const [filterDir, setFilterDir]   = useState('all'); // all | to-halal | to-nonhalal

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── data fetching ──────────────────────────────────────── */
  const fetchPending = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/compliance-reviews');
      setReviews(r.data);
      setError('');
    } catch { setError('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/compliance-reviews/history');
      setHistory(r.data);
    } catch { setError('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);
  useEffect(() => {
    if (tab === 'history' && history.length === 0) fetchHistory();
    if (tab === 'pending') setLoading(false); // already loaded
  }, [tab]);

  /* ─── actions ────────────────────────────────────────────── */
  const remove = (id) => setReviews(prev => prev.filter(r => r.id !== id));

  const handleApprove = async (id) => {
    setProcId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`);
      remove(id); setSelected(s => { s.delete(id); return new Set(s); });
      showToast('Approved — status updated live!');
    } catch { showToast('Failed to approve', 'error'); }
    finally { setProcId(null); }
  };

  const handleReject = async (id) => {
    setProcId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/reject`);
      remove(id); setSelected(s => { s.delete(id); return new Set(s); });
      showToast('Review rejected.');
    } catch { showToast('Failed to reject', 'error'); }
    finally { setProcId(null); }
  };

  const handleEditSave = async (id) => {
    setProcId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`, editForm);
      remove(id); setEditingId(null);
      showToast('Edited & approved!');
    } catch { showToast('Failed to save', 'error'); }
    finally { setProcId(null); }
  };

  const handleBulkApprove = async () => {
    const ids = [...selected];
    try {
      await api.post('/admin/compliance-reviews/bulk-approve', { ids });
      setReviews(prev => prev.filter(r => !ids.includes(r.id)));
      setSelected(new Set());
      showToast(`${ids.length} reviews approved!`);
    } catch { showToast('Bulk approve failed', 'error'); }
  };

  const handleBulkReject = async () => {
    const ids = [...selected];
    try {
      await api.post('/admin/compliance-reviews/bulk-reject', { ids });
      setReviews(prev => prev.filter(r => !ids.includes(r.id)));
      setSelected(new Set());
      showToast(`${ids.length} reviews rejected.`);
    } catch { showToast('Bulk reject failed', 'error'); }
  };

  /* ─── derived data ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let res = reviews;
    if (search) res = res.filter(r => (r.company?.symbol + ' ' + r.company?.name).toLowerCase().includes(search.toLowerCase()));
    if (filterDir === 'to-halal')    res = res.filter(r => r.new_status === 'halal');
    if (filterDir === 'to-nonhalal') res = res.filter(r => r.new_status === 'non-halal');
    return res;
  }, [reviews, search, filterDir]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };
  const toggleOne = (id) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  /* ─── render ─────────────────────────────────────────────── */
  const tabBtn = (key, label, Icon, count) => (
    <button
      onClick={() => { setTab(key); setError(''); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
        borderRadius: 12, fontSize: '0.84rem', fontWeight: 700,
        background: tab === key ? '#065F46' : 'transparent',
        color: tab === key ? '#fff' : 'var(--text-muted)',
        border: tab === key ? 'none' : '1px solid var(--border)',
        cursor: 'pointer', transition: 'all .2s',
      }}
    >
      <Icon size={15} />
      {label}
      {count != null && (
        <span style={{
          background: tab === key ? 'rgba(255,255,255,.25)' : 'var(--border)',
          color: tab === key ? '#fff' : 'var(--text-muted)',
          padding: '1px 7px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800,
        }}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{ padding: '32px 24px 100px', maxWidth: 980, margin: '0 auto' }}>
      <Toast toast={toast} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg,#065F46,#047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(6,95,70,.25)'
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              Compliance Review
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
              AI-detected status changes awaiting admin decision
            </p>
          </div>
        </div>

        <button
          onClick={() => tab === 'pending' ? fetchPending() : fetchHistory()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 12,
            background: 'var(--bg-section)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#065F46'; e.currentTarget.style.borderColor = '#065F46'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stat cards (pending tab only) ───────────────────── */}
      {tab === 'pending' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard icon={Clock}        label="Pending"        value={reviews.length}                                             color="#F59E0B" />
          <StatCard icon={TrendingUp}   label="→ Halal"        value={reviews.filter(r=>r.new_status==='halal').length}           color="#059669" />
          <StatCard icon={TrendingDown} label="→ Non-Halal"    value={reviews.filter(r=>r.new_status==='non-halal').length}       color="#DC2626" />
          <StatCard icon={History}      label="Resolved"       value={history.length || '—'}                                      color="#6366F1"
            sub={history.length ? `${history.filter(h=>h.status==='approved').length} approved` : 'Click History tab'} />
        </div>
      )}

      {/* ── Tabs + filters ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabBtn('pending', 'Pending', Inbox, reviews.length)}
          {tabBtn('history', 'History', History)}
        </div>

        {tab === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search company…"
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-section)', color: 'var(--text-dark)',
                  fontSize: '0.82rem', outline: 'none', width: 170
                }}
              />
            </div>
            {/* Direction filter */}
            <div style={{ position: 'relative' }}>
              <Filter size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={filterDir}
                onChange={e => setFilterDir(e.target.value)}
                style={{
                  paddingLeft: 28, paddingRight: 28, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-section)', color: 'var(--text-dark)',
                  fontSize: '0.82rem', outline: 'none', cursor: 'pointer', appearance: 'none'
                }}
              >
                <option value="all">All changes</option>
                <option value="to-halal">→ Halal only</option>
                <option value="to-nonhalal">→ Non-Halal only</option>
              </select>
              <ChevronDown size={13} color="var(--text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk action bar ─────────────────────────────────── */}
      {tab === 'pending' && selected.size > 0 && (
        <div style={{
          background: 'linear-gradient(135deg,#065F46,#047857)', borderRadius: 14,
          padding: '12px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          boxShadow: '0 8px 24px rgba(6,95,70,.2)'
        }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.86rem' }}>
            <span style={{ opacity: .8 }}>{selected.size} selected</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleBulkReject} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)',
              background: 'rgba(255,255,255,.1)', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}>
              <X size={13}/> Reject all
            </button>
            <button onClick={handleBulkApprove} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10, border: 'none',
              background: 'white', color: '#065F46', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
            }}>
              <Check size={13}/> Approve all
            </button>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
          padding: '13px 16px', borderRadius: 12, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: '0.86rem'
        }}>
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: 120, borderRadius: 20, background: 'var(--bg-section)',
              border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite'
            }}/>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      )}

      {/* ═══════════ PENDING TAB ════════════════════════════ */}
      {!loading && tab === 'pending' && (
        <>
          {filtered.length === 0 ? (
            <div style={{
              background: 'linear-gradient(160deg,var(--bg-section),var(--bg))',
              border: '1px solid var(--border)', borderRadius: 24, padding: '64px 24px', textAlign: 'center'
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))',
                border: '2px solid rgba(16,185,129,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Check size={30} color="#059669"/>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px' }}>
                {search || filterDir !== 'all' ? 'No matches' : 'All clear!'}
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>
                {search || filterDir !== 'all' ? 'Try adjusting your filters.' : 'No pending compliance reviews at this time.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select-all row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                marginBottom: 8, cursor: 'pointer', width: 'fit-content'
              }} onClick={toggleAll}>
                {allSelected
                  ? <CheckSquare size={17} color="#065F46"/>
                  : <Square size={17} color="var(--text-muted)"/>}
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {allSelected ? 'Deselect all' : `Select all (${filtered.length})`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((review, idx) => {
                  const isEditing   = editingId === review.id;
                  const isProc      = processingId === review.id;
                  const isExpanded  = expandedId === review.id;
                  const isSelected  = selected.has(review.id);

                  return (
                    <div key={review.id} style={{
                      background: 'linear-gradient(160deg,var(--bg-section) 0%,var(--bg) 100%)',
                      border: `1px solid ${isSelected ? '#047857' : 'var(--border)'}`,
                      borderRadius: 20, overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 0 2px rgba(4,120,87,.15)' : '0 4px 16px rgba(0,0,0,.03)',
                      opacity: isProc ? .6 : 1, transition: 'all .25s',
                    }}
                      onMouseEnter={e => !isProc && (e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px rgba(4,120,87,.15),0 8px 28px rgba(0,0,0,.07)' : '0 8px 28px rgba(0,0,0,.07)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px rgba(4,120,87,.15)' : '0 4px 16px rgba(0,0,0,.03)')}
                    >
                      <div style={{ padding: '18px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>

                          {/* Checkbox */}
                          <div style={{ paddingTop: 4, cursor: 'pointer', flexShrink: 0 }} onClick={() => toggleOne(review.id)}>
                            {isSelected
                              ? <CheckSquare size={18} color="#047857"/>
                              : <Square size={18} color="var(--text-muted)"/>}
                          </div>

                          {/* Number badge */}
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg,#065F46,#047857)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 900, fontSize: '0.75rem'
                          }}>{idx + 1}</div>

                          {/* Company info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                                {review.company?.symbol || '??'}
                              </span>
                              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {review.company?.name}
                              </span>
                              <Link
                                to={`/market/${review.company?.symbol}/aaoifi`}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#065F46', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none' }}
                              >
                                <ExternalLink size={11}/> View screening
                              </Link>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={11} color="var(--text-muted)"/>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {new Date(review.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Status change pills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <StatusPill status={review.old_status}/>
                            <ArrowRight size={13} color="var(--text-muted)"/>
                            <StatusPill status={review.new_status} size="lg"/>
                          </div>
                        </div>

                        {/* Reason / Edit */}
                        <div style={{ marginTop: 14 }}>
                          {isEditing ? (
                            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles size={13} color="#C49852"/>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '.6px' }}>Edit before approving</span>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>New Status</label>
                                <select
                                  value={editForm.new_status}
                                  onChange={e => setEditForm({ ...editForm, new_status: e.target.value })}
                                  style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.86rem', outline: 'none' }}
                                >
                                  <option value="halal">Halal</option>
                                  <option value="non-halal">Non-Halal</option>
                                  <option value="doubtful">Doubtful</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>Reason</label>
                                <textarea
                                  value={editForm.reason}
                                  onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                                  rows={3}
                                  placeholder="Provide a reason for this compliance change…"
                                  style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.86rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 15px', cursor: 'pointer', transition: 'border-color .2s' }}
                              onClick={() => setExpandedId(isExpanded ? null : review.id)}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#047857'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                              <p style={{
                                margin: 0, color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.55, fontWeight: 500,
                                overflow: 'hidden', display: isExpanded ? 'block' : '-webkit-box',
                                WebkitLineClamp: isExpanded ? 'unset' : 2, WebkitBoxOrient: 'vertical',
                              }}>
                                {review.reason || 'No reason provided.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, flexWrap: 'wrap' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => setEditingId(null)} style={{ padding: '8px 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleEditSave(review.id)} disabled={isProc} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#065F46,#047857)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(6,95,70,.2)' }}>
                              <Save size={14}/> Save & Approve
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(review.id); setEditForm({ new_status: review.new_status, reason: review.reason }); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all .2s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C49852'; e.currentTarget.style.color = '#C49852'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                            >
                              <Edit2 size={13}/> Edit
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              disabled={isProc}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', color: '#DC2626', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all .2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.14)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.07)'}
                            >
                              <X size={13}/> Reject
                            </button>
                            <button
                              onClick={() => handleApprove(review.id)}
                              disabled={isProc}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#065F46,#047857)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(6,95,70,.2)', transition: 'all .2s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(6,95,70,.3)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,95,70,.2)'; }}
                            >
                              <Check size={14}/> Approve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════ HISTORY TAB ════════════════════════════ */}
      {!loading && tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
              <History size={40} color="var(--text-muted)" style={{ opacity: .4, marginBottom: 14 }}/>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No resolved reviews yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(item => (
                <div key={item.id} style={{
                  background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 16,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
                }}>
                  <Badge color={item.status === 'approved' ? '#059669' : '#DC2626'}>
                    {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </Badge>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{item.company?.symbol}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.company?.name}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
                      {item.reason?.slice(0, 90)}{item.reason?.length > 90 ? '…' : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <StatusPill status={item.old_status}/>
                    <ArrowRight size={12} color="var(--text-muted)"/>
                    <StatusPill status={item.new_status}/>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.reviewed_by}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
