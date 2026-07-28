import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Check, X, Shield, Clock, AlertTriangle, Edit2, Save } from 'lucide-react';

export default function AdminComplianceReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ new_status: '', reason: '' });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/compliance-reviews');
      setReviews(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch compliance reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/compliance-reviews/${id}/reject`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to reject review');
    }
  };

  const handleEditSave = async (id) => {
    try {
      const response = await api.post(`/admin/compliance-reviews/${id}/approve`, editForm);
      setReviews(reviews.filter(r => r.id !== id));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save and approve review');
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading compliance reviews...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Shield size={24} color="var(--primary)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Compliance Reviews</h2>
      </div>

      {error && (
        <div style={{
          background: 'var(--non-halal-bg)', color: 'var(--non-halal)',
          padding: '16px', borderRadius: '8px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', padding: '48px', borderRadius: '16px',
          textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <Check size={48} color="var(--halal)" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '8px' }}>All caught up!</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are no pending compliance reviews.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(review => (
            <div key={review.id} style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 4px 0' }}>
                    {review.company?.symbol || 'Unknown'} - {review.company?.name || 'Unknown'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Clock size={14} />
                    <span>{new Date(review.created_at).toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    background: review.old_status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
                    color: review.old_status === 'halal' ? 'var(--halal)' : 'var(--non-halal)',
                    textTransform: 'uppercase'
                  }}>
                    {review.old_status}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    background: review.new_status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
                    color: review.new_status === 'halal' ? 'var(--halal)' : 'var(--non-halal)',
                    textTransform: 'uppercase'
                  }}>
                    {review.new_status}
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.02)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.04)'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dark)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reason for Change
                </h4>
                {editingId === review.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>NEW STATUS</label>
                      <select
                        value={editForm.new_status}
                        onChange={(e) => setEditForm({ ...editForm, new_status: e.target.value })}
                        style={{
                          width: '100%', padding: '8px', borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
                          color: 'var(--text-dark)', fontWeight: '600'
                        }}
                      >
                        <option value="halal">Halal</option>
                        <option value="non-halal">Non-Halal</option>
                        <option value="doubtful">Doubtful</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>REASON</label>
                      <textarea
                        value={editForm.reason}
                        onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                        rows={3}
                        style={{
                          width: '100%', padding: '8px', borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
                          color: 'var(--text-dark)', fontSize: '0.9rem', resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-body)', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {review.reason}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                {editingId === review.id ? (
                  <>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
                        color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(review.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'var(--primary)', border: 'none',
                        color: '#fff', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      <Save size={16} />
                      Save & Approve
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(review.id);
                        setEditForm({ new_status: review.new_status, reason: review.reason });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
                        color: 'var(--text-dark)', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'transparent', border: '1px solid var(--non-halal)',
                        color: 'var(--non-halal)', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      <X size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(review.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'var(--primary)', border: 'none',
                        color: '#fff', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      <Check size={16} />
                      Approve Change
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
