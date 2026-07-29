import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Check, X, Shield, Clock, AlertTriangle, Edit2, Save, 
  ChevronRight, RefreshCw, TrendingUp, TrendingDown, 
  Minus, FileText, ArrowRight, Sparkles, Eye
} from 'lucide-react';

const STATUS_CONFIG = {
  halal: { label: 'HALAL', bg: 'rgba(16,185,129,0.1)', color: '#059669', border: 'rgba(16,185,129,0.3)' },
  'non-halal': { label: 'NON-HALAL', bg: 'rgba(239,68,68,0.1)', color: '#DC2626', border: 'rgba(239,68,68,0.3)' },
  doubtful: { label: 'DOUBTFUL', bg: 'rgba(245,158,11,0.1)', color: '#D97706', border: 'rgba(245,158,11,0.3)' },
};

const StatusPill = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || { label: status?.toUpperCase() || 'UNKNOWN', bg: 'rgba(100,100,100,0.1)', color: '#6B7280', border: 'rgba(100,100,100,0.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: size === 'lg' ? '6px 14px' : '3px 10px',
      borderRadius: '100px', fontSize: size === 'lg' ? '0.75rem' : '0.65rem',
      fontWeight: 800, letterSpacing: '0.6px',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: 'var(--bg-section)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: '16px',
    flex: 1, minWidth: '140px'
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: '12px',
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  </div>
);

export default function AdminComplianceReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ new_status: '', reason: '' });
  const [processingId, setProcessingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/compliance-reviews');
      setReviews(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch compliance reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`);
      setReviews(reviews.filter(r => r.id !== id));
      showToast('Review approved and status updated!');
    } catch (err) {
      showToast('Failed to approve review', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/reject`);
      setReviews(reviews.filter(r => r.id !== id));
      showToast('Review rejected.');
    } catch (err) {
      showToast('Failed to reject review', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditSave = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`, editForm);
      setReviews(reviews.filter(r => r.id !== id));
      setEditingId(null);
      showToast('Review edited & approved!');
    } catch (err) {
      showToast('Failed to save review', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = reviews.length;
  const halalCount = reviews.filter(r => r.new_status === 'halal').length;
  const nonHalalCount = reviews.filter(r => r.new_status === 'non-halal').length;

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: '140px', borderRadius: '20px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 100px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '0.88rem',
          background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          color: toast.type === 'error' ? '#DC2626' : '#059669',
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '14px',
              background: 'linear-gradient(135deg, #065F46, #047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(6,95,70,0.25)'
            }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                Compliance Review Queue
              </h1>
              <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                AI-detected status changes awaiting admin approval
              </p>
            </div>
          </div>
          <button
            onClick={fetchReviews}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.84rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard icon={Clock} label="Pending Reviews" value={pendingCount} color="#F59E0B" />
        <StatCard icon={TrendingUp} label="→ Halal Proposals" value={halalCount} color="#059669" />
        <StatCard icon={TrendingDown} label="→ Non-Halal Proposals" value={nonHalalCount} color="#DC2626" />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
          padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.88rem'
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Empty state */}
      {reviews.length === 0 && !error ? (
        <div style={{
          background: 'linear-gradient(160deg, var(--bg-section), var(--bg))',
          border: '1px solid var(--border)', borderRadius: '24px',
          padding: '64px 24px', textAlign: 'center'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
            border: '2px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Check size={32} color="#059669" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 8px' }}>
            All clear!
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            No pending compliance reviews at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map((review, idx) => {
            const isEditing = editingId === review.id;
            const isProcessing = processingId === review.id;
            const isExpanded = expandedId === review.id;

            return (
              <div
                key={review.id}
                style={{
                  background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  opacity: isProcessing ? 0.6 : 1,
                }}
                onMouseEnter={e => !isProcessing && (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)')}
              >
                {/* Card header */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>

                    {/* Index badge */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #065F46, #047857)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: '0.8rem'
                    }}>
                      {idx + 1}
                    </div>

                    {/* Company + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                          {review.company?.symbol || '??'}
                        </h3>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
                          {review.company?.name || 'Unknown Company'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <Clock size={12} />
                        <span>{new Date(review.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Status transition */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <StatusPill status={review.old_status} />
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <StatusPill status={review.new_status} size="lg" />
                    </div>
                  </div>

                  {/* Reason / Edit area */}
                  <div style={{ marginTop: '16px' }}>
                    {isEditing ? (
                      <div style={{
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Sparkles size={14} color="var(--primary)" />
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Edit before approving
                          </span>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            New Status
                          </label>
                          <select
                            value={editForm.new_status}
                            onChange={e => setEditForm({ ...editForm, new_status: e.target.value })}
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: '10px',
                              border: '1px solid var(--border)', background: 'var(--bg-section)',
                              color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.88rem', outline: 'none'
                            }}
                          >
                            <option value="halal">Halal</option>
                            <option value="non-halal">Non-Halal</option>
                            <option value="doubtful">Doubtful</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Reason
                          </label>
                          <textarea
                            value={editForm.reason}
                            onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                            rows={3}
                            placeholder="Provide a reason for this compliance change..."
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: '10px',
                              border: '1px solid var(--border)', background: 'var(--bg-section)',
                              color: 'var(--text-dark)', fontSize: '0.88rem', resize: 'vertical',
                              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          borderRadius: '12px', padding: '14px 16px',
                          cursor: 'pointer', transition: 'border-color 0.2s'
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : review.id)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <p style={{
                              margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 500,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: isExpanded ? 'block' : '-webkit-box',
                              WebkitLineClamp: isExpanded ? 'unset' : 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {review.reason || 'No reason provided.'}
                            </p>
                          </div>
                          <ChevronRight size={16} color="var(--text-muted)" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action footer */}
                <div style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap'
                }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '9px 18px', borderRadius: '10px',
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(review.id)}
                        disabled={isProcessing}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 20px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #065F46, #047857)', border: 'none',
                          color: 'white', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(6,95,70,0.2)'
                        }}
                      >
                        <Save size={15} /> Save & Approve
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(review.id); setEditForm({ new_status: review.new_status, reason: review.reason }); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 18px', borderRadius: '10px',
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C49852'; e.currentTarget.style.color = '#C49852'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={isProcessing}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 18px', borderRadius: '10px',
                          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#DC2626', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.13)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={isProcessing}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '9px 20px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #065F46, #047857)', border: 'none',
                          color: 'white', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(6,95,70,0.2)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(6,95,70,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,95,70,0.2)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <Check size={15} /> Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
