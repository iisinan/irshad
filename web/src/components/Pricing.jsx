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

const COMPARISON_FEATURES = [
  ['Billing Cycles', 'Free forever', 'Quarterly & Yearly', 'Quarterly & Yearly'],
  ['Stock Screens', '3 / month', '30 / quarter', 'Unlimited'],
  ['Portfolio Holdings', 'Up to 3 stocks', 'Up to 7 stocks', 'Unlimited'],
  ['Watchlist & Alerts', '—', 'Up to 2 stocks', 'Unlimited'],
  ['Thematic Baskets', '—', '3 curated + 3 custom', 'Full + Unlimited custom'],
  ['Purification Calculator', '—', '6 / quarter', 'Unlimited'],
  ['Automated Zakat Calculator', '—', 'Included', 'Unlimited'],
  ['Broker Statements & History', '—', 'Included', 'Included'],
  ['Dividend Alerts', '—', '—', 'Unlimited'],
  ['90-Day Drift Tracking', '—', '—', '90-day tracking'],
  ['Monthly Spotlight Insights', '—', '—', 'Full insights'],
];

const Pricing = ({ isModal = false, onClose }) => {
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
    if (!user) return false;
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
      <div className={`animate-fade-in page-wrapper pricing-page-shell ${isModal ? 'pricing-page-shell--modal' : ''}`}>
        <div className="pricing-inner">
          
          {/* Header */}
          <div className={`pricing-header ${isModal ? 'pricing-header--modal' : ''}`}>
            <h1 className="pricing-title">
              Choose your plan
            </h1>
            
            {/* Billing Toggle */}
            <div className="pricing-toggle" role="tablist" aria-label="Billing cycle">
              <button
                type="button"
                role="tab"
                aria-selected={billingCycle === 'quarterly'}
                onClick={() => setBillingCycle('quarterly')}
                className={`pricing-toggle-btn ${billingCycle === 'quarterly' ? 'is-active' : ''}`}
              >
                Quarterly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={billingCycle === 'yearly'}
                onClick={() => setBillingCycle('yearly')}
                className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'is-active' : ''}`}
              >
                <span>Yearly</span>
                <span className="pricing-save-badge">Save More</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--non-compliant-bg)', color: 'var(--non-compliant)', border: '1px solid var(--non-compliant-border)', padding: '14px 16px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px', fontWeight: 600, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {/* Pricing Grid */}
          <div className="pricing-grid stagger-fade-in">
            
            {/* MIFTAH */}
            <div className="pricing-card">
              <div className="pricing-card-head">
                <div className="pricing-tier-eyebrow-spacer" aria-hidden="true" />
                <h3 className="pricing-tier-name">Miftah (Free)</h3>
                <p className="pricing-card-desc">Get everyday help with fundamental Islamic finance screening.</p>
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price-row">
                  <span className="pricing-currency">NGN</span>
                  <span className="pricing-amount">0</span>
                  <span className="pricing-period">/forever</span>
                </div>
              </div>

              {isExactCurrentPlan('free')
                ? <div className="pricing-current-pill">✓ Your current plan</div>
                : <button type="button" onClick={() => handleSubscribe('free')} disabled={loading} className="hover-bg-gray pricing-cta-btn pricing-cta-btn--free">{getCtaLabel('free')}</button>
              }

              <div style={{ flex: 1 }}>
                <ul className="pricing-feature-list">
                  <FeatureRow icon="Screen" title="Stock screens" text="3 per month" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="3 stocks" />
                  <FeatureRow icon="Video" title="Resources" text="(video/docs)" />
                  <FeatureRow icon="Globe" title="News and Insight" />
                </ul>
              </div>
            </div>

            {/* RAWDHA */}
            <div className="pricing-card pricing-card--pro pricing-pro-card">
              <div className="pricing-card-head">
                <div className="pricing-tier-top-row">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#006B46' }}>Most Popular</span>
                  <span style={{ 
                    fontSize: '0.68rem', fontWeight: 800, color: '#006B46', background: 'rgba(0, 107, 70, 0.1)', 
                    padding: '3px 9px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap'
                  }}>Promo Entry Price</span>
                </div>
                <h3 className="pricing-tier-name">Rawdha (Pro)</h3>
                <p className="pricing-card-desc">Get more access to custom baskets and deeper portfolio tracking.</p>
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price-row">
                  <span className="pricing-currency" style={{ color: '#006B46' }}>NGN</span>
                  <span className="pricing-amount" style={{ color: '#006B46' }}>
                    {(billingCycle === 'quarterly' ? prices.pro.quarterly : prices.pro.yearly).toLocaleString()}
                  </span>
                  <span className="pricing-period">
                    /{billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                  <span className="pricing-strike-price">
                    ₦{(billingCycle === 'quarterly' ? prices.pro.stdQuarterly : prices.pro.stdYearly).toLocaleString()}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <div className="pricing-promo-note" style={{ color: '#006B46' }}>
                    Equivalent to ₦{Math.round(prices.pro.yearly / 4).toLocaleString()}/quarter • Save ₦{(prices.pro.stdYearly - prices.pro.yearly).toLocaleString()} off standard
                  </div>
                ) : (
                  <div className="pricing-promo-note" style={{ color: '#006B46' }}>
                    Save ₦{(prices.pro.stdQuarterly - prices.pro.quarterly).toLocaleString()} with promo entry price
                  </div>
                )}
              </div>

              {isExactCurrentPlan('pro')
                ? <div className="pricing-current-pill pricing-current-pill--pro">✓ Your current plan</div>
                : <button type="button" onClick={() => handleSubscribe('pro')} disabled={loading} className="hover-lift pricing-cta-btn pricing-cta-btn--pro">{getCtaLabel('pro')}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <CheckCircle2 size={16} color="#006B46" style={{ flexShrink: 0 }} /> Everything in free and:
                </div>
                <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 14px 0' }}></div>
                <ul className="pricing-feature-list">
                  <FeatureRow icon="Screen" title="Stock screens" text="30 per quarter" />
                  <FeatureRow icon="Briefcase" title="Portfolio (holdings)" text="Up to 7 stocks" />
                  <FeatureRow icon="Eye" title="Watchlist" text="Up to 2 stocks" />
                  <FeatureRow icon="Basket" title="Thematic baskets" text="Limited access" />
                  <FeatureRow icon="HandCoin" title="Automated purification calculation" text="6 per quarter" />
                  <FeatureRow icon="Calculator" title="Automated zakat calculation" text="Included" />
                  <FeatureRow icon="Doc" title="Statements" text="History tracking" />
                </ul>
              </div>
            </div>

            {/* NOOR */}
            <div className="pricing-card pricing-card--max">
              <div className="pricing-card-head">
                <div className="pricing-tier-top-row">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D9A05B' }}>Best Value</span>
                  <span style={{ 
                    fontSize: '0.68rem', fontWeight: 800, color: '#B8860B', background: 'rgba(217, 160, 91, 0.15)', 
                    padding: '3px 9px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap'
                  }}>Promo Entry Price</span>
                </div>
                <h3 className="pricing-tier-name">Noor (Max)</h3>
                <p className="pricing-card-desc">Unlock the highest level of access and exclusive premium features.</p>
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price-row">
                  <span className="pricing-currency" style={{ color: '#D9A05B' }}>NGN</span>
                  <span className="pricing-amount" style={{ color: '#D9A05B' }}>
                    {(billingCycle === 'quarterly' ? prices.max.quarterly : prices.max.yearly).toLocaleString()}
                  </span>
                  <span className="pricing-period">
                    /{billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                  <span className="pricing-strike-price">
                    ₦{(billingCycle === 'quarterly' ? prices.max.stdQuarterly : prices.max.stdYearly).toLocaleString()}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <div className="pricing-promo-note" style={{ color: '#B8860B' }}>
                    Equivalent to ₦{Math.round(prices.max.yearly / 4).toLocaleString()}/quarter • Save ₦{(prices.max.stdYearly - prices.max.yearly).toLocaleString()} off standard
                  </div>
                ) : (
                  <div className="pricing-promo-note" style={{ color: '#B8860B' }}>
                    Save ₦{(prices.max.stdQuarterly - prices.max.quarterly).toLocaleString()} with promo entry price
                  </div>
                )}
              </div>

              {isExactCurrentPlan('max')
                ? <div className="pricing-current-pill pricing-current-pill--max">✓ Your current plan</div>
                : <button type="button" onClick={() => handleSubscribe('max')} disabled={loading} className="hover-lift pricing-cta-btn pricing-cta-btn--max">{getCtaLabel('max')}</button>
              }

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <CheckCircle2 size={16} color="#D9A05B" style={{ flexShrink: 0 }} /> Everything in Pro and:
                </div>
                <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 14px 0' }}></div>
                <ul className="pricing-feature-list">
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
          <div className="pricing-matrix-card">
            <div className="pricing-matrix-head">
              <h3>Compare all plan features</h3>
            </div>

            {/* Desktop & Tablet Table */}
            <div className="pricing-comparison-desktop" style={{ overflowX: 'auto' }}>
              <table className="pricing-comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th style={{ textAlign: 'center', color: 'var(--text-dark)' }}>Miftah (Free)</th>
                    <th style={{ textAlign: 'center', color: '#006B46' }}>Rawdha (Pro)</th>
                    <th style={{ textAlign: 'center', color: '#B8860B' }}>Noor (Max)</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map(([feature, freeVal, proVal, maxVal], idx) => (
                    <tr key={feature} style={{ borderBottom: idx === COMPARISON_FEATURES.length - 1 ? 'none' : '1px solid var(--border)' }}>
                      <td className="pricing-table-feature">{feature}</td>
                      {[freeVal, proVal, maxVal].map((val, colIdx) => (
                        <td
                          key={colIdx}
                          style={{
                            textAlign: 'center',
                            padding: '12px 16px',
                            color: val === '—' ? 'var(--text-muted)' : colIdx === 1 ? '#006B46' : colIdx === 2 ? '#B8860B' : 'var(--text-dark)',
                            fontWeight: val === '—' ? 500 : 600,
                          }}
                        >
                          {val === '—' ? <Minus size={14} style={{ opacity: 0.45 }} /> : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Feature Cards (zero horizontal overflow) */}
            <div className="pricing-comparison-mobile">
              {COMPARISON_FEATURES.map(([feature, freeVal, proVal, maxVal]) => (
                <div key={feature} className="pricing-mobile-feature-card">
                  <div className="pricing-mobile-feature-title">{feature}</div>
                  <div className="pricing-mobile-tier-grid">
                    {[
                      { label: 'Miftah', val: freeVal, tone: 'free' },
                      { label: 'Rawdha', val: proVal, tone: 'pro' },
                      { label: 'Noor', val: maxVal, tone: 'max' },
                    ].map(({ label, val, tone }) => (
                      <div key={label} className={`pricing-mobile-tier-pill pricing-mobile-tier-pill--${tone}`}>
                        <span className="pricing-mobile-tier-label">{label}</span>
                        <span className={`pricing-mobile-tier-val ${val === '—' ? 'is-empty' : ''}`}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-trust-note">
            <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0 }} />
            <span>Secure payments powered by Squad</span>
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
