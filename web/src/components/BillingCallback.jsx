import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BillingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | success | failed

  const reference =
    searchParams.get('reference') ||
    searchParams.get('transaction_ref') ||
    searchParams.get('transactionRef') ||
    searchParams.get('trxref') ||
    sessionStorage.getItem('pending_payment_ref');

  useEffect(() => {
    if (!reference) {
      navigate('/profile?section=billing');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;
    let timerId = null;

    const finishSuccess = async () => {
      sessionStorage.removeItem('pending_payment_ref');
      if (cancelled) return;
      setStatus('success');
      if (fetchUser) await fetchUser();
      timerId = setTimeout(() => {
        if (!cancelled) navigate('/profile?section=billing');
      }, 1800);
    };

    const verifyPayment = async () => {
      attempts++;
      try {
        const res = await api.post('/subscription/verify', { reference });
        if (res.data?.verified || res.data?.has_active_subscription) {
          await finishSuccess();
          return;
        }
      } catch (err) {
        if (err.response?.status === 422 || err.response?.data?.status === 'failed') {
          sessionStorage.removeItem('pending_payment_ref');
          if (!cancelled) setStatus('failed');
          return;
        }
      }

      if (attempts >= maxAttempts) {
        // Fallback check on /subscription/status in case webhook completed asynchronously
        try {
          const statusRes = await api.get('/subscription/status');
          if (statusRes.data?.has_active_subscription) {
            await finishSuccess();
            return;
          }
        } catch (_) { /* ignore */ }

        if (!cancelled) setStatus('failed');
        return;
      }

      timerId = setTimeout(verifyPayment, 2000);
    };

    verifyPayment();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [reference, navigate, fetchUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      {status === 'checking' && (
        <>
          <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary-100)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Confirming your payment…</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please wait while we verify your Squad payment.</p>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Payment not confirmed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center', maxWidth: '380px' }}>
            We could not confirm your payment yet. If you were debited, your plan will activate automatically once Squad confirms it.
          </p>
          <button onClick={() => navigate('/profile?section=billing')} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '100px', padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Go to Billing</button>
        </>
      )}
    </div>
  );
};

export default BillingCallback;
