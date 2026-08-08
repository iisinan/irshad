import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ShieldCheck, Zap, HelpCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Footer from './Footer';

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
      const res = await api.post('/billing/upgrade');
      setMessage(res.data?.message || 'Successfully upgraded to Irshad Pro!');
      setTimeout(() => navigate('/portfolio'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--primary)" />
              Transparent Pricing
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1.2px', marginBottom: '16px' }}>
              Invest with Absolute <span style={{ color: 'var(--primary)' }}>Clarity</span>
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
              Transparent, fair pricing designed for Nigerian Muslim investors and wealth managers. No hidden fees. Cancel anytime.
            </p>
          </div>

          {message && (
            <div style={{ marginBottom: '32px', padding: '16px', borderRadius: '14px', background: 'var(--halal-bg)', color: 'var(--halal)', textAlign: 'center', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '32px', padding: '16px', borderRadius: '14px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', textAlign: 'center', fontWeight: 700, border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Pricing Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '32px', marginBottom: '64px' }}>
            
            {/* Basic Tier */}
            <div style={{ 
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px 36px',
              display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '8px' }}>Free Community</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '24px', lineHeight: 1.6 }}>Essential screening and market explorer for beginner halal investors.</p>
              
              <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--text-dark)', marginBottom: '32px' }}>
                ₦0 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ forever</span>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
                {[
                  'Full NGX Halal / Non-Halal Screener',
                  'Basic AAOIFI Compliance Verdicts',
                  '1 Custom Portfolio Watchlist',
                  'Manual Dividend Purification Calculator',
                  'Access to AAOIFI Standards & Guides'
                ].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.88rem' }}>
                    <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} /> {feature}
                  </li>
                ))}
              </ul>
              
              <button onClick={() => navigate('/portfolio')} style={{ 
                width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--bg-section)', 
                border: '1.5px solid var(--border)', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }} className="hover-lift">
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div style={{ 
              background: 'linear-gradient(145deg, #0A192F 0%, #0F3A40 50%, #0B4F55 100%)',
              border: '1.5px solid rgba(201,168,76,0.4)',
              borderRadius: '24px', padding: '40px 36px',
              display: 'flex', flexDirection: 'column', position: 'relative',
              boxShadow: '0 24px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              color: 'white', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <div style={{ 
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', 
                background: 'var(--gold-grad, linear-gradient(135deg, var(--gold) 0%, var(--gold) 100%))',
                color: '#0F172A', padding: '6px 20px', borderRadius: '20px', 
                fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '1px', textTransform: 'uppercase',
                boxShadow: '0 4px 16px rgba(209, 165, 98,0.4)'
              }}>
                <Star size={14} fill="currentColor" /> Recommended
              </div>
              
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '8px', letterSpacing: '-0.3px' }}>Irshad Pro</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.86rem', marginBottom: '24px', lineHeight: 1.6 }}>For active stock pickers and funds requiring automated portfolio purification.</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '32px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.5px' }}>₦2,500</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>/ month</span>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1, position: 'relative', zIndex: 1 }}>
                {[
                  'Everything in Free Community, plus:',
                  'Automated Portfolio Dividend Purification',
                  'Granular AAOIFI Metric Historical Graphs',
                  'Instant Compliance Change Alert Push/Email',
                  'Direct NGX Regulatory Filing Auditing Access',
                  'Unlimited Multi-Portfolio Tracking',
                  'One-Click PDF/CSV Audit Reports'
                ].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'rgba(255,255,255,0.92)', fontWeight: 600, fontSize: '0.88rem' }}>
                    <CheckCircle2 size={18} color="var(--gold, var(--gold))" style={{ flexShrink: 0 }} /> {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={handleSubscribe} 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '14px',
                  background: 'var(--gold-grad, linear-gradient(135deg, var(--gold) 0%, var(--gold) 100%))', 
                  border: 'none', color: '#0F172A', fontWeight: 900, fontSize: '0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 24px rgba(209, 165, 98, 0.35)', transition: 'all 0.2s', position: 'relative', zIndex: 1
                }}
                className="hover-lift"
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#0F172A', borderWidth: '2px' }} /> : (
                  <>Upgrade to Pro <Zap size={18} fill="currentColor" /></>
                )}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
                <ShieldCheck size={14} color="var(--gold)" /> 256-Bit Encrypted Payments via Paystack
              </div>
            </div>

          </div>

          {/* FAQ Section */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '48px 40px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div className="section-label" style={{ marginBottom: '12px' }}>FAQ</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                Frequently Asked Pricing Questions
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '28px' }}>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Can I cancel anytime?</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  Yes! There are no long-term contracts. You can cancel your subscription at any time directly in your account settings with a single click.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Which payment methods do you support?</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  We support all Nigerian debit cards (Mastercard, Visa, Verve), bank transfers, and USSD via our licensed payment gateway partner Paystack.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>What is Automated Dividend Purification?</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  Irshad Pro calculates the exact naira amount you must give to charity from each dividend payment received across all portfolio holdings under AAOIFI Rule 3/4/2.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Do you offer enterprise or fund pricing?</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  Yes! For institutional asset managers, pension fund administrators (PFAs), and Shariah review boards, contact our team at <a href="mailto:institutional@iirshad.com" style={{ color: 'var(--primary)', fontWeight: 700 }}>institutional@iirshad.com</a>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default Pricing;

