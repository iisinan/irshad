import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BillingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  
  const trxref = searchParams.get('trxref');
  const reference = searchParams.get('reference');
  
  useEffect(() => {
    // Paystack redirects here.
    // The webhook will do the actual DB update, but we can refresh the user session here to get the new plan.
    if (trxref || reference) {
      setTimeout(() => {
        if (fetchUser) fetchUser();
        navigate('/profile?section=billing');
      }, 4000);
    } else {
      navigate('/profile?section=billing');
    }
  }, [trxref, reference, navigate, fetchUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F9FA' }}>
      <CheckCircle2 size={64} color="#10B981" style={{ marginBottom: '24px' }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Payment Processing</h2>
      <p style={{ color: '#64748B' }}>Please wait while we confirm your subscription...</p>
      <div className="spinner" style={{ marginTop: '24px', width: '24px', height: '24px', borderTopColor: '#0F172A' }}></div>
    </div>
  );
};

export default BillingCallback;
