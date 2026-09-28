import React, { useState, useEffect } from 'react';
import { Mail, Search, CheckCircle, Clock, Trash2, Reply } from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';

export default function AdminInbox() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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

    const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    try {
      setReplyLoading(true);
      await api.post(`/admin/suggestions/${id}/reply`, { reply: replyMessage });
      toastSuccess('Reply sent successfully');
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'read' } : s));
      setReplyingTo(null);
      setReplyMessage('');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

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
                
                <button onClick={() => { setReplyingTo(replyingTo === s.id ? null : s.id); setReplyMessage(''); }} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary-50)', color: 'var(--primary)',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Reply size={14} /> {replyingTo === s.id ? 'Cancel Reply' : 'Reply'}
                </button>
                <button onClick={() => handleDelete(s.id)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'
                }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              
              {replyingTo === s.id && (
                <div style={{ marginTop: '12px', background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <form onSubmit={(e) => handleReplySubmit(e, s.id)}>
                    <textarea 
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder={`Draft your reply to ${s.user?.name || 'this user'}...`}
                      style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      disabled={replyLoading}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={replyLoading || !replyMessage.trim()} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: (replyLoading || !replyMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (replyLoading || !replyMessage.trim()) ? 0.7 : 1 }}>
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
