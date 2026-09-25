import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ShieldCheck, Zap, X, Monitor, Briefcase, Eye, PlaySquare, Globe, ShoppingBasket, FileText, Bell, HandCoins, LineChart, Megaphone } from 'lucide-react';
import api from '../services/api';
import Footer from './Footer';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

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
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px', background: '#F8F9FA' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#0A192F', letterSpacing: '-1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              IRSHAD PAYMENT TIERS
            </h1>
            
            {/* Billing Toggle */}
            <div style={{ 
              display: 'inline-flex', background: '#E2E8F0', borderRadius: '100px', padding: '4px', margin: '20px auto'
            }}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                style={{ 
                  padding: '10px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'monthly' ? '#fff' : 'transparent',
                  color: billingCycle === 'monthly' ? '#0F172A' : '#64748B',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'monthly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                style={{ 
                  padding: '10px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'yearly' ? '#fff' : 'transparent',
                  color: billingCycle === 'yearly' ? '#0F172A' : '#64748B',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'yearly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Yearly <span style={{ color: '#10B981', fontSize: '0.75rem', marginLeft: '4px' }}>Save ~20%</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: '32px', padding: '16px', borderRadius: '14px', background: '#FEE2E2', color: '#B91C1C', textAlign: 'center', fontWeight: 700 }}>
              {error}
            </div>
          )}

          {/* Pricing Grid */}
          <div className="pricing-grid stagger-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginBottom: '64px', alignItems: 'stretch' }}>
            
            {/* MIFTAH */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0A192F, #0A5B9C)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>MIFTAH (FREE)</h3>
                <div style={{ fontSize: '3rem', fontWeight: 950, lineHeight: 1 }}>₦0</div>
              </div>
              <div style={{ padding: '30px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="3 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="1 stock" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" text="" />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                </ul>
                <button onClick={() => handleSubscribe('free')} className="hover-lift pricing-btn" style={{ 
                  width: '100%', padding: '16px', borderRadius: '8px', background: '#0A5B9C', 
                  border: 'none', color: 'white', fontWeight: 900, fontSize: '1rem', cursor: 'pointer'
                }}>CHOOSE</button>
              </div>
            </div>

            {/* RAWDAH */}
            <div className="pricing-pro-card" style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,107,70,0.15)', border: '3px solid #006B46', position: 'relative', zIndex: 10 }}>
              <div style={{ background: 'linear-gradient(135deg, #004d32, #006B46)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>
                <div style={{ background: '#D9A05B', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '6px 14px', borderRadius: '100px', display: 'inline-block', marginBottom: '16px', letterSpacing: '1px' }}>MOST POPULAR</div><h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>RAWDAH (PRO)</h3>
                <div style={{ fontSize: '3rem', fontWeight: 950, lineHeight: 1 }}>
                  {billingCycle === 'monthly' ? '₦2,500' : '₦24,000'}
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'monthly' && <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>(₦24,000/yr)</div>}
              </div>
              <div style={{ padding: '30px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="5 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Up to 7 stocks" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Up to 2 stocks" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" text="" />
                  <FeatureRow icon="Basket" title="Baskets" text="Access to 1 curated basket and 2 Custom baskets" />
                  <FeatureRow icon="Doc" title="Statements" text="(Purification & Zakat history)" />
                  <FeatureRow icon="HandCoin" title="Purification & Zakat Calc" text="2 Purifications & Full Zakat Calc" />
                  <FeatureRow empty={true} />
                  <FeatureRow empty={true} />
                </ul>
                <button onClick={() => handleSubscribe('pro')} disabled={loading} className="hover-lift pricing-btn" style={{ 
                  width: '100%', padding: '16px', borderRadius: '8px', background: '#D9A05B', 
                  border: 'none', color: 'white', fontWeight: 900, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                  {loading ? 'PROCESSING...' : 'CHOOSE PRO'}
                </button>
              </div>
            </div>

            {/* NOOR */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(184, 134, 11, 0.08)', border: '1px solid #EADDCD', position: 'relative' }}>
              <div style={{ background: 'linear-gradient(135deg, #8B6508, #B8860B)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#B8860B', color: 'white', padding: '4px 30px', transform: 'translate(28px, 16px) rotate(45deg)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>BEST VALUE</div><h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>NOOR (MAX)</h3>
                <div style={{ fontSize: '3rem', fontWeight: 950, lineHeight: 1 }}>
                  {billingCycle === 'monthly' ? '₦6,500' : '₦62,000'}
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'monthly' && <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>(₦62,000/yr)</div>}
              </div>
              <div style={{ padding: '30px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="Unlimited" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Unlimited" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Unlimited" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" text="" />
                  <FeatureRow icon="Basket" title="Baskets" text="Purification & Zakat calc (Unlimited)" />
                  <FeatureRow icon="Doc" title="Statements" text="(Purification & Zakat history)" />
                  <FeatureRow icon="Bell" title="Dividend alert" text="(Unlimited)" />
                  <FeatureRow icon="HandCoin" title="Purification & Zakat Calc" text="(Unlimited)" />
                  <FeatureRow icon="Chart" title="90-day drift tracking" text="Unlimited stocks" />
                  <FeatureRow icon="Megaphone" title="Monthly spotlight" text="full news, downloadable summaries" />
                </ul>
                <button onClick={() => handleSubscribe('max')} disabled={loading} className="hover-lift pricing-btn" style={{ 
                  width: '100%', padding: '16px', borderRadius: '8px', background: '#0A192F', 
                  border: 'none', color: 'white', fontWeight: 900, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                  {loading ? 'PROCESSING...' : 'CHOOSE MAX'}
                </button>
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10B981" /> Secure 256-Bit Encrypted Payments via Paystack
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

// Quick helper for rendering rows like the graphic
const FeatureRow = ({ icon, title, text, empty }) => {
  if (empty) {
    return (
      <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ width: '20px', height: '2px', background: 'rgba(0,0,0,0.1)' }}></div>
      </li>
    );
  }

  let IconComponent = CheckCircle2;
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
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ 
        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        color: '#0A192F', flexShrink: 0 
      }}>
        <IconComponent size={24} color="#0A192F" />
      </div>
      <div>
        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', lineHeight: 1.2 }}>{title}</div>
        {text && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', lineHeight: 1.3 }}>{text}</div>}
      </div>
    </li>
  );
};

export default Pricing;
