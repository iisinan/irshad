import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ShieldCheck, Zap } from 'lucide-react';
import api from '../services/api';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Mock Paystack/Flutterwave integration
      const res = await api.post('/billing/upgrade');
      setMessage(res.data?.message || 'Successfully upgraded to Irshad Pro!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>
          Invest with <span style={{ color: 'var(--primary)' }}>Confidence</span>
        </h1>
        <p style={{ fontSize: '0.97rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Choose the plan that fits your halal investment journey. Cancel anytime.
        </p>
      </div>

      {message && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'var(--halal-bg)', color: 'var(--halal)', textAlign: 'center', fontWeight: 700 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', textAlign: 'center', fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        {/* Basic Tier */}
        <div style={{ 
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px 32px',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '1.32rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Basic</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '24px' }}>For beginners exploring halal markets.</p>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '32px' }}>
            Free
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
            {[
              'Basic Portfolio Tracking',
              'Standard Halal Screening',
              'Community Access',
              'Manual Entry Holdings'
            ].map((feature, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-dark)', fontWeight: 600 }}>
                <CheckCircle2 size={20} color="var(--primary)" /> {feature}
              </li>
            ))}
          </ul>
          
          <button onClick={() => navigate('/dashboard')} style={{ 
            width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--bg-section)', 
            border: '2px solid var(--border)', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' 
          }}>
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div style={{ 
          background: 'var(--bg)', border: '2px solid var(--primary)', borderRadius: '24px', padding: '40px 32px',
          display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 24px 48px rgba(15, 82, 87, 0.1)'
        }}>
          <div style={{ 
            position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', 
            background: 'var(--primary)', color: 'var(--bg)', padding: '6px 16px', borderRadius: '20px', 
            fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '1px', textTransform: 'uppercase'
          }}>
            <Star size={14} fill="currentColor" /> Most Popular
          </div>
          
          <h3 style={{ fontSize: '1.32rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Irshad Pro</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '24px' }}>For serious investors demanding deep insights.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '32px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>₦2,500</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>/ month</span>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
            {[
              'Advanced AAOIFI Metrics',
              'Live Brokerage Sync (Mono/Okra)',
              'Priority Price Alerts',
              'Export Portfolio to CSV/PDF',
              'Dedicated Support'
            ].map((feature, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-dark)', fontWeight: 600 }}>
                <CheckCircle2 size={20} color="var(--primary)" /> {feature}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleSubscribe} 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--primary)', 
              border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1,
              boxShadow: '0 8px 24px rgba(15, 82, 87, 0.25)'
            }}
          >
            {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : (
              <>Upgrade to Pro <Zap size={18} fill="currentColor" /></>
            )}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.66rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Secure Payment via Paystack
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
