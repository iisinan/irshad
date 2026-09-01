import React, { useState } from 'react';
import { Mail, X, Send, Paperclip } from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuggestModal({ onClose }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await api.post('/suggestions', { message });
      toastSuccess('Suggestion submitted successfully! Thank you.');
      onClose();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to submit suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="animate-slide-up" style={{
        background: 'var(--bg)', borderRadius: '16px', 
        width: '100%', maxWidth: '600px', position: 'relative',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header - Looks like Email header */}
        <div style={{
          background: 'var(--bg-section)', padding: '16px 20px',
          borderBottom: '1px solid var(--border)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>New Suggestion</h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px', borderRadius: '50%'
          }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Email To/From fields mockup */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, width: '40px' }}>To:</span>
              <span style={{ background: 'var(--primary-50)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                Irshad Admin Team
              </span>
            </div>
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, width: '40px' }}>From:</span>
              <span style={{ color: 'var(--text-dark)', fontSize: '0.9rem', fontWeight: 500 }}>
                {user?.email || 'user@example.com'}
              </span>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your suggestion or feedback here..."
            autoFocus
            style={{
              width: '100%', minHeight: '200px', padding: '20px',
              border: 'none', background: 'transparent',
              color: 'var(--text-dark)', fontSize: '0.95rem',
              resize: 'none', outline: 'none', fontFamily: 'inherit',
              lineHeight: '1.6'
            }}
            required
          />

          <div style={{
            padding: '16px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-section)'
          }}>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Paperclip size={18} style={{ cursor: 'not-allowed', opacity: 0.5 }} />
              <span style={{ fontSize: '0.8rem' }}>Attachments not supported yet</span>
            </div>
            
            <button type="submit" disabled={loading} style={{
              padding: '10px 24px', borderRadius: '30px',
              background: 'var(--primary)', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(91,41,113,0.3)'
            }}>
              {loading ? 'Sending...' : 'Send'} <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
