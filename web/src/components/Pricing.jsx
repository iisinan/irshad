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
      setTimeout(() => navigate('/portfolio'), 2000);
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
          
          <button onClick={() => navigate('/portfolio')} style={{ 
            width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--bg-section)', 
            border: '2px solid var(--border)', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' 
          }}>
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div style={{ 
          background: 'linear-gradient(145deg, #0A192F 0%, #0F3A40 50%, #0B4F55 100%)',
          border: '1.5px solid rgba(201,168,76,0.4)',
          borderRadius: '24px', padding: '40px 32px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          color: 'white', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div style={{ 
            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', 
            background: 'var(--gold-grad, linear-gradient(135deg, #d4af37 0%, #b89326 100%))',
            color: '#0F172A', padding: '6px 18px', borderRadius: '20px', 
            fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '1px', textTransform: 'uppercase',
            boxShadow: '0 4px 16px rgba(212,175,55,0.4)'
          }}>
            <Star size={14} fill="currentColor" /> Most Popular
          </div>
          
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'white', marginBottom: '8px', letterSpacing: '-0.3px' }}>Irshad Pro</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '24px' }}>For serious investors demanding deep insights.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '32px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.5px' }}>₦2,500</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>/ month</span>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1, position: 'relative', zIndex: 1 }}>
            {[
              'Advanced AAOIFI Metrics & Breakdown',
              'Live Brokerage Sync (Mono/Okra)',
              'Priority Price & Purification Alerts',
              'Export Portfolio to CSV/PDF',
              'Dedicated Shariah Advisory Support'
            ].map((feature, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'rgba(255,255,255,0.92)', fontWeight: 600, fontSize: '0.9rem' }}>
                <CheckCircle2 size={20} color="var(--gold, #d4af37)" /> {feature}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleSubscribe} 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'var(--gold-grad, linear-gradient(135deg, #d4af37 0%, #b89326 100%))', 
              border: 'none', color: '#0F172A', fontWeight: 900, fontSize: '0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1,
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)', transition: 'all 0.2s', position: 'relative', zIndex: 1
            }}
            className="hover-lift"
          >
            {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#0F172A', borderWidth: '2px' }} /> : (
              <>Upgrade to Pro <Zap size={18} fill="currentColor" /></>
            )}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
            <ShieldCheck size={14} color="var(--gold)" /> Secure Payment via Paystack
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
