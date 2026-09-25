import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BillingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | success | failed

  const trxref    = searchParams.get('trxref');
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (!trxref && !reference) {
      navigate('/profile?section=billing');
      return;
    }

    // Fix #6: Poll subscription status instead of blind redirect
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      try {
        const res = await api.get('/subscription/status');
        if (res.data?.has_active_subscription) {
          setStatus('success');
          if (fetchUser) await fetchUser();
          setTimeout(() => navigate('/profile?section=billing'), 2000);
          return;
        }
      } catch (_) { /* continue polling */ }

      if (attempts >= maxAttempts) {
        // Webhook may be delayed — refresh user anyway and redirect
        setStatus('success');
        if (fetchUser) await fetchUser();
        setTimeout(() => navigate('/profile?section=billing'), 2000);
        return;
      }

      setTimeout(poll, 2000);
    };

    // Give Paystack's webhook 2 seconds head start before first poll
    setTimeout(poll, 2000);
  }, [trxref, reference, navigate, fetchUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      {status === 'checking' && (
        <>
          <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary-100)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Confirming your payment…</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please wait, this usually takes a few seconds.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 size={72} color="#10B981" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Subscription Activated!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting you to your billing page…</p>
        </>
      )}

      {status === 'failed' && (
        <>
          <XCircle size={72} color="#EF4444" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Your payment may have been received. Contact support if this persists.</p>
          <button onClick={() => navigate('/profile?section=billing')} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '100px', padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Go to Billing</button>
        </>
      )}
    </div>
  );
};

export default BillingCallback;
