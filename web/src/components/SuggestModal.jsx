import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';
import api from '../services/api';

export default function SuggestModal({ onClose }) {
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
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="animate-scale-up" style={{
        background: 'var(--bg)', borderRadius: '24px', padding: '32px',
        width: '100%', maxWidth: '500px', position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'var(--bg-section)', border: 'none', borderRadius: '50%',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)'
        }}>
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={24} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>Suggest for Irshad</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Help us improve the platform.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your suggestion or feedback here..."
            style={{
              width: '100%', height: '150px', padding: '16px',
              borderRadius: '16px', border: '1px solid var(--border)',
              background: 'var(--bg-section)', color: 'var(--text-dark)',
              fontSize: '0.9rem', resize: 'none', marginBottom: '24px',
              fontFamily: 'inherit'
            }}
            required
          />
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '16px',
            background: 'var(--primary)', color: 'white', border: 'none',
            fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}
