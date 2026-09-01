import React, { useState, useEffect } from 'react';
import { Mail, Search, CheckCircle, Clock, Trash2, Reply } from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';

export default function AdminInbox() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/suggestions');
      setSuggestions(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/suggestions/${id}/status`, { status });
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toastSuccess(`Marked as ${status}`);
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await api.delete(`/admin/suggestions/${id}`);
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toastSuccess('Deleted successfully');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError('Failed to delete');
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>Loading inbox...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={24} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>Admin Inbox</h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>User suggestions and feedback</div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Mail size={32} color="var(--border)" style={{ marginBottom: '16px' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Inbox is empty</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              background: 'var(--bg)',
              border: `1px solid ${s.status === 'unread' ? 'var(--primary-100)' : 'var(--border)'}`,
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}>
              {s.status === 'unread' && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-compliant)' }} />
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '20px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                    {s.user?.name || s.user?.first_name || 'Anonymous User'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.user?.email || 'No email provided'} • {new Date(s.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, background: 'var(--bg-section)', padding: '16px', borderRadius: '12px' }}>
                {s.message}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {s.status === 'unread' ? (
                  <button onClick={() => handleUpdateStatus(s.id, 'read')} style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary-50)', color: 'var(--primary)',
                    fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <CheckCircle size={14} /> Mark Read
                  </button>
                ) : (
                  <button onClick={() => handleUpdateStatus(s.id, 'unread')} style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--bg-section)', color: 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Clock size={14} /> Mark Unread
                  </button>
                )}
                
                <a href={`mailto:${s.user?.email || ''}?subject=Re: Your Suggestion for Irshad`} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary-50)', color: 'var(--primary)',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                }}>
                  <Reply size={14} /> Reply
                </a>
                <button onClick={() => handleDelete(s.id)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'
                }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
