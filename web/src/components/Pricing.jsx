import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ShieldCheck, Monitor, Briefcase, Eye, PlaySquare, Globe, ShoppingBasket, FileText, Bell, HandCoins, LineChart, Megaphone, Check } from 'lucide-react';
import api from '../services/api';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const Pricing = ({ isModal }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fix #8: Clear stale error when page mounts
  useEffect(() => { setError(''); setMessage(''); }, []);

  const currentPlanSlug = user?.tier?.slug ?? 'free';
  const hasPaid = user?.has_paid_subscription ?? false;

  const handleSubscribe = async (planSlug) => {
    if (planSlug === 'free') {
      navigate('/portfolio');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/subscription/initialize', {
        plan_slug: planSlug,
        billing_cycle: billingCycle
      });
      
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setError('Unable to initialize payment. Please try again.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { returnTo: '/pricing' } });
      } else {
        setError(err.response?.data?.error || 'Payment failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600, color: '#1F2937', letterSpacing: '-0.5px', marginBottom: '16px' }}>
              Choose your plan
            </h1>
            
            {/* Billing Toggle */}
            <div style={{ 
              display: 'inline-flex', background: '#F3F4F6', borderRadius: '100px', padding: '4px', margin: '10px auto 30px'
            }}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                style={{ 
                  padding: '8px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'monthly' ? '#fff' : 'transparent',
                  color: billingCycle === 'monthly' ? '#111827' : '#4B5563',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                style={{ 
                  padding: '8px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'yearly' ? '#fff' : 'transparent',
                  color: billingCycle === 'yearly' ? '#111827' : '#4B5563',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Yearly
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '32px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Pricing Grid */}
          <div className="pricing-grid stagger-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '64px', alignItems: 'stretch' }}>
            
            {/* MIFTAH */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>Miftah (Free)</h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.5, height: '44px' }}>Get everyday help with fundamental Islamic finance screening.</p>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>NGN</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 500, color: '#111827', lineHeight: 1 }}>0</span>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>/month</span>
              </div>

              {currentPlanSlug === 'free' && !hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#6B7280', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '32px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('free')} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: 'transparent', border: '1px solid #D1D5DB', color: '#374151', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginBottom: '32px', transition: 'all 0.2s' }} className="hover-bg-gray">Get started</button>
              }

              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="3 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="1 stock" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" />
                </ul>
              </div>
            </div>

            {/* RAWDAH */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#006B46', marginBottom: '8px' }}>Most Popular</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>Rawdah (Pro)</h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.5, height: '44px' }}>Get more access to custom baskets and deeper portfolio tracking.</p>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#006B46' }}>NGN</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 500, color: '#006B46', lineHeight: 1 }}>
                  {billingCycle === 'monthly' ? '2,500' : '24,000'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>

              {currentPlanSlug === 'pro' && hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#E6F4EE', border: '2px solid #006B46', color: '#006B46', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('pro')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#006B46', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#006B46" /> Everything in free and:
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', margin: '0 0 16px 0' }}></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="5 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Up to 7 stocks" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Up to 2 stocks" />
                  <FeatureRow icon="Basket" title="Baskets" text="1 curated, 2 custom" />
                  <FeatureRow icon="HandCoin" title="Purification & Zakat" text="2 purifications & calc" />
                  <FeatureRow icon="Doc" title="Statements" text="History tracking" />
                </ul>
              </div>
            </div>

            {/* NOOR */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D9A05B', marginBottom: '8px' }}>Best Value</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>Noor (Max)</h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.5, height: '44px' }}>Unlock the highest level of access and exclusive premium features.</p>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#D9A05B' }}>NGN</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 500, color: '#D9A05B', lineHeight: 1 }}>
                  {billingCycle === 'monthly' ? '6,500' : '62,000'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>

              {currentPlanSlug === 'max' && hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#FEF5E7', border: '2px solid #D9A05B', color: '#B8860B', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('max')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#D9A05B', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#D9A05B" /> Everything in Pro and:
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', margin: '0 0 16px 0' }}></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="Unlimited" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Unlimited" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Unlimited" />
                  <FeatureRow icon="Basket" title="Baskets & Zakat" text="Unlimited" />
                  <FeatureRow icon="Bell" title="Dividend alerts" text="Unlimited" />
                  <FeatureRow icon="Chart" title="Drift tracking" text="90-day tracking" />
                  <FeatureRow icon="Megaphone" title="Monthly spotlight" text="Full insights" />
                </ul>
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '0.85rem', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10B981" /> Secure payments powered by Paystack
          </div>
        </div>
      </div>
      {!isModal && <Footer />}
    </>
  );
};

// Quick helper for rendering rows
const FeatureRow = ({ icon, title, text }) => {
  let IconComponent = Check;
  switch (icon) {
    case 'Screen': IconComponent = Monitor; break;
    case 'Briefcase': IconComponent = Briefcase; break;
    case 'Eye': IconComponent = Eye; break;
    case 'Video': IconComponent = PlaySquare; break;
    case 'Globe': IconComponent = Globe; break;
    case 'Basket': IconComponent = ShoppingBasket; break;
    case 'Doc': IconComponent = FileText; break;
    case 'Bell': IconComponent = Bell; break;
    case 'HandCoin': IconComponent = HandCoins; break;
    case 'Chart': IconComponent = LineChart; break;
    case 'Megaphone': IconComponent = Megaphone; break;
  }

  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0' }}>
      <div style={{ marginTop: '2px', color: '#111827' }}>
        <IconComponent size={20} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', marginBottom: '2px' }}>{title}</div>
        {text && <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.4 }}>{text}</div>}
      </div>
    </li>
  );
};

export default Pricing;
