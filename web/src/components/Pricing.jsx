import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ShieldCheck, Monitor, Briefcase, Eye, PlaySquare, Globe, ShoppingBasket, FileText, Bell, HandCoins, LineChart, Megaphone, Check, Calculator, Minus } from 'lucide-react';
import api from '../services/api';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { customConfirm, customAlert } from '../utils/confirm';

const DEFAULT_PRICES = {
  pro: { quarterly: 6500, yearly: 25000, stdQuarterly: 7500, stdYearly: 30000 },
  max: { quarterly: 8500, yearly: 33000, stdQuarterly: 10000, stdYearly: 40000 },
};

const Pricing = ({ isModal, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('quarterly');
  const [livePlans, setLivePlans] = useState([]);
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();

  useEffect(() => {
    setError('');
    setMessage('');
    let cancelled = false;
    api.get('/plans')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.plans;
        if (!cancelled && Array.isArray(list)) {
          setLivePlans(list);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const currentPlanSlug = user?.tier?.slug ?? 'free';
  const hasPaid = user?.has_paid_subscription ?? false;
  const currentBillingCycle = user?.active_subscription?.billing_cycle ?? null;

  const prices = useMemo(() => {
    const map = {
      pro: { ...DEFAULT_PRICES.pro },
      max: { ...DEFAULT_PRICES.max },
    };
    livePlans.forEach((p) => {
      if (p.slug === 'pro' || p.slug === 'max') {
        const q = Number(p.price_quarterly ?? p.quarterly_price ?? map[p.slug].quarterly);
        const y = Number(p.price_yearly ?? p.yearly_price ?? map[p.slug].yearly);
        const sq = Number(p.price_quarterly_regular ?? map[p.slug].stdQuarterly);
        const sy = Number(p.price_yearly_regular ?? map[p.slug].stdYearly);
        map[p.slug].quarterly = q > 0 ? q : map[p.slug].quarterly;
        map[p.slug].yearly = y > 0 ? y : map[p.slug].yearly;
        map[p.slug].stdQuarterly = sq > 0 ? sq : map[p.slug].stdQuarterly;
        map[p.slug].stdYearly = sy > 0 ? sy : map[p.slug].stdYearly;
      }
    });
    return map;
  }, [livePlans]);

  const isExactCurrentPlan = (slug) => {
    if (slug === 'free') return currentPlanSlug === 'free' && !hasPaid;
    return currentPlanSlug === slug && hasPaid && (!currentBillingCycle || currentBillingCycle === billingCycle);
  };

  const getCtaLabel = (slug) => {
    if (loading) return 'Processing...';
    if (slug === 'free') {
      return hasPaid ? 'Downgrade to Free' : 'Get started';
    }
    if (currentPlanSlug === slug && hasPaid && currentBillingCycle && currentBillingCycle !== billingCycle) {
      return `Switch to ${billingCycle === 'yearly' ? 'Yearly' : 'Quarterly'}`;
    }
    if (currentPlanSlug === 'pro' && slug === 'max') return 'Upgrade to Noor';
    return 'Get started';
  };

  const handleSubscribe = async (planSlug) => {
    if (planSlug === 'free') {
      if (hasPaid) {
        const ok = await customConfirm('Downgrade to Miftah (Free)? Your current paid subscription auto-renewal will be canceled and you will keep access until the end of your current billing period.');
        if (!ok) return;
        setLoading(true);
        setError('');
        try {
          await api.post('/subscription/cancel');
          if (fetchUser) await fetchUser();
          await customAlert('Your subscription has been canceled. You keep paid access until your current billing period ends.');
          if (onClose) onClose();
        } catch (err) {
          setError(err.response?.data?.message || 'Unable to downgrade subscription right now.');
        } finally {
          setLoading(false);
        }
      } else {
        if (onClose) onClose();
        navigate('/portfolio');
      }
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
        if (res.data?.reference) {
          sessionStorage.setItem('pending_payment_ref', res.data.reference);
        }
        window.location.href = res.data.authorization_url;
      } else {
        setError('Unable to initialize payment. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { returnTo: '/pricing' } });
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Payment failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600, color: '#1F2937', letterSpacing: '-0.5px', marginBottom: '16px' }}>
              Choose your plan
            </h1>
            
            {/* Billing Toggle */}
            <div style={{ 
              display: 'inline-flex', background: 'var(--bg-alt)', borderRadius: '100px', padding: '4px', margin: '10px auto 30px',
              border: '1px solid var(--border)'
            }}>
              <button 
                onClick={() => setBillingCycle('quarterly')}
                style={{ 
                  padding: '8px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'quarterly' ? '#fff' : 'transparent',
                  color: billingCycle === 'quarterly' ? 'var(--text-dark)' : '#4B5563',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'quarterly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Quarterly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                style={{ 
                  padding: '8px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'yearly' ? '#fff' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--text-dark)' : '#4B5563',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}
              >
                <span>Yearly</span>
                <span style={{ 
                  background: '#10B981', color: '#fff', fontSize: '0.65rem', 
                  fontWeight: 800, padding: '2px 8px', borderRadius: '100px',
                  textTransform: 'uppercase'
                }}>Save More</span>
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
            <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '12px' }}>Miftah (Free)</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, height: '44px' }}>Get everyday help with fundamental Islamic finance screening.</p>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>NGN</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 500, color: 'var(--text-dark)', lineHeight: 1 }}>0</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/forever</span>
              </div>

              {isExactCurrentPlan('free')
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: 'var(--bg-alt)', border: '1px solid #D1D5DB', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '32px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('free')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: 'transparent', border: '1px solid #D1D5DB', color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '32px', transition: 'all 0.2s' }} className="hover-bg-gray">{getCtaLabel('free')}</button>
              }

              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="3 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="3 stocks" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" />
                </ul>
              </div>
            </div>

            {/* RAWDHA */}
            <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#006B46' }}>Most Popular</span>
                  <span style={{ 
                    fontSize: '0.68rem', fontWeight: 800, color: '#006B46', background: 'rgba(0, 107, 70, 0.1)', 
                    padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.3px' 
                  }}>Promo Entry Price</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '12px' }}>Rawdha (Pro)</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, height: '44px' }}>Get more access to custom baskets and deeper portfolio tracking.</p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#006B46' }}>NGN</span>
                  <span style={{ fontSize: '2.4rem', fontWeight: 500, color: '#006B46', lineHeight: 1 }}>
                    {(billingCycle === 'quarterly' ? prices.pro.quarterly : prices.pro.yearly).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    /{billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                  <span style={{ fontSize: '1.05rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500, marginLeft: '4px' }}>
                    ₦{(billingCycle === 'quarterly' ? prices.pro.stdQuarterly : prices.pro.stdYearly).toLocaleString()}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <div style={{ fontSize: '0.78rem', color: '#006B46', fontWeight: 600, marginTop: '6px' }}>
                    Equivalent to ₦{Math.round(prices.pro.yearly / 4).toLocaleString()}/quarter • Save ₦{(prices.pro.stdYearly - prices.pro.yearly).toLocaleString()} off standard
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#006B46', fontWeight: 600, marginTop: '6px' }}>
                    Save ₦{(prices.pro.stdQuarterly - prices.pro.quarterly).toLocaleString()} with promo entry price
                  </div>
                )}
              </div>

              {isExactCurrentPlan('pro')
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#E6F4EE', border: '2px solid #006B46', color: '#006B46', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('pro')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#006B46', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{getCtaLabel('pro')}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#006B46" /> Everything in free and:
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', margin: '0 0 16px 0' }}></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="10 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Up to 7 stocks" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Up to 2 stocks" />
                  <FeatureRow icon="Basket" title="Thematic baskets" text="Limited access" />
                  <FeatureRow icon="HandCoin" title="Automated purification calculation" text="2 per month" />
                  <FeatureRow icon="Calculator" title="Automated zakat calculation" text="Included" />
                  <FeatureRow icon="Doc" title="Statements" text="History tracking" />
                </ul>
              </div>
            </div>

            {/* NOOR */}
            <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D9A05B' }}>Best Value</span>
                  <span style={{ 
                    fontSize: '0.68rem', fontWeight: 800, color: '#B8860B', background: 'rgba(217, 160, 91, 0.15)', 
                    padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.3px' 
                  }}>Promo Entry Price</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '12px' }}>Noor (Max)</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, height: '44px' }}>Unlock the highest level of access and exclusive premium features.</p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#D9A05B' }}>NGN</span>
                  <span style={{ fontSize: '2.4rem', fontWeight: 500, color: '#D9A05B', lineHeight: 1 }}>
                    {(billingCycle === 'quarterly' ? prices.max.quarterly : prices.max.yearly).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    /{billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                  <span style={{ fontSize: '1.05rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500, marginLeft: '4px' }}>
                    ₦{(billingCycle === 'quarterly' ? prices.max.stdQuarterly : prices.max.stdYearly).toLocaleString()}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <div style={{ fontSize: '0.78rem', color: '#B8860B', fontWeight: 600, marginTop: '6px' }}>
                    Equivalent to ₦{Math.round(prices.max.yearly / 4).toLocaleString()}/quarter • Save ₦{(prices.max.stdYearly - prices.max.yearly).toLocaleString()} off standard
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#B8860B', fontWeight: 600, marginTop: '6px' }}>
                    Save ₦{(prices.max.stdQuarterly - prices.max.quarterly).toLocaleString()} with promo entry price
                  </div>
                )}
              </div>

              {isExactCurrentPlan('max')
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#FEF5E7', border: '2px solid #D9A05B', color: '#B8860B', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('max')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#D9A05B', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{getCtaLabel('max')}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#D9A05B" /> Everything in Pro and:
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', margin: '0 0 16px 0' }}></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <FeatureRow icon="Screen" title="Stock screens" text="Unlimited" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Unlimited" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Unlimited" />
                  <FeatureRow icon="Basket" title="Thematic baskets" text="Full access" />
                  <FeatureRow icon="HandCoin" title="Automated purification calculation" text="Unlimited" />
                  <FeatureRow icon="Calculator" title="Automated zakat calculation" text="Unlimited" />
                  <FeatureRow icon="Bell" title="Dividend alerts" text="Unlimited" />
                  <FeatureRow icon="Chart" title="Drift tracking" text="90-day tracking" />
                  <FeatureRow icon="Megaphone" title="Monthly spotlight" text="Full insights" />
                </ul>
              </div>
            </div>

          </div>

          {/* Feature Comparison Matrix */}
          <div style={{ marginBottom: '44px', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', background: 'var(--bg)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', background: 'var(--bg-alt)' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>Compare all plan features</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', background: 'var(--bg)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Feature</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', color: 'var(--text-dark)', fontWeight: 700 }}>Miftah (Free)</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', color: '#006B46', fontWeight: 700 }}>Rawdha (Pro)</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', color: '#B8860B', fontWeight: 700 }}>Noor (Max)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Billing Cycles', 'Free forever', 'Quarterly & Yearly', 'Quarterly & Yearly'],
                    ['Monthly Stock Screens', '3 / month', '10 / month', 'Unlimited'],
                    ['Portfolio Holdings', 'Up to 3 stocks', 'Up to 7 stocks', 'Unlimited'],
                    ['Watchlist & Alerts', '—', 'Up to 2 stocks', 'Unlimited'],
                    ['Thematic Baskets', '—', '3 curated + 3 custom', 'Full + Unlimited custom'],
                    ['Purification Calculator', '—', '2 / month', 'Unlimited'],
                    ['Automated Zakat Calculator', '—', 'Included', 'Unlimited'],
                    ['Broker Statements & History', '—', 'Included', 'Included'],
                    ['Dividend Alerts', '—', '—', 'Unlimited'],
                    ['90-Day Drift Tracking', '—', '—', '90-day tracking'],
                    ['Monthly Spotlight Insights', '—', '—', 'Full insights'],
                  ].map(([feature, freeVal, proVal, maxVal], idx) => (
                    <tr key={feature} style={{ borderBottom: idx === 10 ? 'none' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-dark)' }}>{feature}</td>
                      {[freeVal, proVal, maxVal].map((val, colIdx) => (
                        <td key={colIdx} style={{ textAlign: 'center', padding: '12px 16px', color: val === '—' ? '#9CA3AF' : colIdx === 1 ? '#006B46' : colIdx === 2 ? '#B8860B' : 'var(--text-dark)', fontWeight: val === '—' ? 500 : 600 }}>
                          {val === '—' ? <Minus size={14} style={{ opacity: 0.45 }} /> : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10B981" /> Secure payments powered by Squad
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
    case 'Calculator': IconComponent = Calculator; break;
  }

  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0' }}>
      <div style={{ marginTop: '2px', color: 'var(--text-dark)' }}>
        <IconComponent size={20} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '2px' }}>{title}</div>
        {text && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{text}</div>}
      </div>
    </li>
  );
};

export default Pricing;
