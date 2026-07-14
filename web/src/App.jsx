import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle, Shield, BarChart2, ChevronRight, Smartphone, Apple, Play, AlertCircle } from 'lucide-react';
import { fetchNgxStocks } from './services/api';
import StockDetails from './components/StockDetails';
import Portfolio from './components/Portfolio';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import AboutPage from './components/About';

import ShariahPage from './components/Shariah';
import Profile from './components/Profile';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './components/AuthPages';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import './index.css';

const DASHBOARD_ROUTES = ['/dashboard', '/portfolio', '/profile'];

/* ─── Navbar ──────────────────────────────────────────────── */
const TopNavbar = () => {
  const location = useLocation();
  // Hide top navbar on dashboard / portfolio / profile — those use the sidebar
  const isDashboard = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinkClass = (path) =>
    `nav-link ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : ''}`;

  return (
    <>
      {isDashboard ? null : (
      <nav className="top-navbar" style={{ boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.07)' : 'none' }}>
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="Irshad"
            style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/shariah" className={navLinkClass('/shariah')}>Shariah Framework</Link>
          <Link to="/about" className={navLinkClass('/about')}>About Us</Link>
          {user && (
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
          )}
          {(user?.role === 'admin' || user?.role === 'scholar') && (
            <Link to="/admin" className={navLinkClass('/admin')} style={{ color: 'var(--primary)' }}>Admin</Link>
          )}
          <div className="nav-divider" />
          {!loading && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--primary-100)' }}>
                    {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                    {user.first_name || user.name || 'Profile'}
                  </span>
                </Link>
                <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log In</Link>
                <Link to="/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.9rem' }}>
                  Get Started
                </Link>
              </>
            )
          )}
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>
      )}

      {/* Mobile drawer — also hidden on dashboard */}
      {!isDashboard && (<div className={`mobile-nav-drawer ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={navLinkClass('/')}>🏠 Home</Link>
        <Link to="/shariah" className={navLinkClass('/shariah')}>⚖️ Shariah Framework</Link>
        <Link to="/about" className={navLinkClass('/about')}>ℹ️ About Us</Link>
        {user && (
          <Link to="/dashboard" className={navLinkClass('/dashboard')}>📊 Dashboard</Link>
        )}
        {(user?.role === 'admin' || user?.role === 'scholar') && (
          <Link to="/admin" className={navLinkClass('/admin')}>⚙️ Admin</Link>
        )}
        <div className="mobile-nav-auth">
          {!loading && (
            user ? (
              <>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 16px', background: 'var(--bg-section)', borderRadius: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                    {user.first_name || user.name || 'Profile'}
                  </span>
                </Link>
                <button onClick={logout} className="btn-secondary" style={{ justifyContent: 'center', padding: '13px' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary" style={{ justifyContent: 'center', padding: '13px' }}>Log In</Link>
                <Link to="/register" className="btn-primary">Get Started →</Link>
              </>
            )
          )}
        </div>
      </div>
      )}
    </>
  );
};


/* ─── Ticker ──────────────────────────────────────────────── */
const StockTicker = () => {
  const [stocks, setStocks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNgxStocks().then(r => { if (r.data) setStocks(r.data); }).catch(() => {});
  }, []);

  if (stocks.length === 0) return null;

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {stocks.concat(stocks).map((stock, i) => {
          let statusStr = 'QUESTIONABLE';
          let color = 'var(--doubtful)';
          const rawStatus = stock.status;
          if (typeof rawStatus === 'object' && rawStatus !== null) {
            const s = rawStatus.status?.toLowerCase();
            if (s === 'halal') { statusStr = 'HALAL'; color = 'var(--halal)'; }
            else if (s === 'non-halal') { statusStr = 'NON-HALAL'; color = 'var(--non-halal)'; }
          } else if (typeof rawStatus === 'string') {
            const s = rawStatus.toLowerCase();
            if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; color = 'var(--halal)'; }
            else if (s === 'non-halal') { statusStr = 'NON-HALAL'; color = 'var(--non-halal)'; }
          }

          const displayPrice = Number(stock.daily_prices?.[0]?.price || 0).toFixed(2);

          return (
            <div key={`${stock.symbol}-${i}`} className="ticker-item" onClick={() => navigate('/login')}>
              <span className="ticker-item-symbol">{stock.symbol}</span>
              <span className="ticker-item-price">₦{displayPrice}</span>
              <span style={{ fontWeight: 800, fontSize: '0.7rem', color, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>{statusStr}</span>
              <div className="ticker-separator" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Stock Card ─────────────────────────────────────────── */
const StockCard = ({ company }) => {
  const priceChange = parseFloat(company.price_change ?? 0);
  const latestPrice = parseFloat(company.latest_price ?? 0);
  
  let pct = parseFloat(company.price_change_pct ?? 0);
  if (!pct && priceChange && latestPrice) {
    pct = (priceChange / (latestPrice - priceChange)) * 100;
  }
  
  const isPositive = priceChange >= 0;

  let statusStr = 'QUESTIONABLE';
  let badgeClass = 'status-doubtful';

  const rawStatus = company.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
    else if (s === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
    else if (s === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
  }

  const navigate = useNavigate();
  return (
    <div onClick={() => navigate('/login')} className="stock-card" style={{ cursor: 'pointer' }}>
      <div className="stock-card-header">
        <div className="stock-card-title">
          <div className="stock-symbol">{company.symbol}</div>
          <div className="stock-name">{company.name}</div>
        </div>
        <span className={`status-badge ${badgeClass}`}>{statusStr}</span>
      </div>
      <div className="stock-card-body">
        <div className="stock-price-wrapper">
          <span className="stock-price-currency">₦</span>
          <span className="stock-price">{latestPrice.toFixed(2)}</span>
        </div>
        <div className={`stock-change-pill ${isPositive ? 'pos' : 'neg'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{pct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};


/* ─── Footer ─────────────────────────────────────────────── */
const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div>
        <div className="footer-logo-area" style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Irshad"
            style={{
              height: '52px',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.88,
            }}
          />
        </div>
        <p className="footer-desc">
          The premier platform for Shariah-compliant stock screening and market analytics on the Nigerian Exchange.
        </p>
      </div>

      <div className="footer-col">
        <h4>Platform</h4>
        <ul>
          <li><Link to="/market">Market Explorer</Link></li>
          <li><Link to="/portfolio">Portfolio Tracker</Link></li>
          <li><Link to="/market">Halal Baskets</Link></li>
          <li><Link to="/market">Purification Calc</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Company</h4>
        <ul>
          <li><Link to="/shariah">Shariah Method</Link></li>
          <li><Link to="/about">Our Story</Link></li>
          <li><Link to="/shariah">Our Methodology</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><Link to="/terms">Terms of Service</Link></li>
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/shariah">Shariah Standards</Link></li>
          <li><Link to="/disclosure">Disclosures</Link></li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Irshad Financial Services Ltd. All rights reserved.</span>
      <span>Regulated · AAOIFI Compliant · Nigeria</span>
    </div>
  </footer>
);

/* ─── Landing Page ───────────────────────────────────────── */
const LandingPage = () => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchNgxStocks().then(r => { if (r.data) setStocks(r.data.slice(0, 6)); }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero animate-fade-in" style={{ position: 'relative', overflow: 'hidden', padding: '120px 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Background Gradients */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, rgba(245,240,232,0) 70%)', zIndex: -1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, rgba(245,240,232,0) 70%)', zIndex: -1, pointerEvents: 'none' }} />

        <div className="hero-tag" style={{ background: 'white', border: '1px solid var(--gold-100)', boxShadow: '0 4px 16px rgba(201,168,76,0.08)', color: 'var(--gold)' }}>
          <Shield size={14} fill="currentColor" style={{ opacity: 0.8 }} />
          Nigeria's #1 Shariah Stock Screener
        </div>

        <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.05, maxWidth: '840px', margin: '0 auto 24px', color: 'var(--text-dark)', textShadow: '0 12px 32px rgba(0,0,0,0.03)' }}>
          Align Your Wealth With Your <span style={{ color: 'var(--primary)', position: 'relative' }}>
            Values
            <svg width="100%" height="12" viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '-4px', left: 0, zIndex: -1, opacity: 0.3 }}>
              <path d="M0,10 Q50,-5 100,10" stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '640px', margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 500 }}>
          Real-time halal screening for every stock on the Nigerian Exchange. Make confident, compliant investment decisions in seconds.
        </p>

        <div className="hero-cta" style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
          <Link to="/login" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem', boxShadow: '0 8px 24px rgba(201,168,76,0.25)', borderRadius: '40px' }}>
            Start Screening <ArrowRight size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" color="var(--gold)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trusted by 10k+ investors</span>
            </div>
          </div>
        </div>

        {/* Floating Abstract UI Elements */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', height: '140px', marginTop: '60px' }}>
          {/* Mock Pill 1 */}
          <div style={{ position: 'absolute', top: '20px', left: '10%', background: 'white', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', animation: 'float 6s ease-in-out infinite' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary-50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>MTN</span>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>MTNN</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--halal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={10} /> Halal</div>
            </div>
          </div>
          
          {/* Mock Pill 2 */}
          <div style={{ position: 'absolute', top: '-10px', right: '15%', background: 'white', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', animation: 'float 7s ease-in-out infinite reverse' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--non-halal-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--non-halal)', fontWeight: 800, fontSize: '0.8rem' }}>NB</span>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>NB</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--non-halal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}><AlertCircle size={10} /> Non-Halal</div>
            </div>
          </div>

          {/* Main Mockup Strip */}
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, transparent 0%, var(--bg) 100%)', position: 'absolute', bottom: 0, left: 0, zIndex: 2 }} />
          <div style={{ width: '80%', height: '100%', margin: '0 auto', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', border: '1px solid var(--border)', borderBottom: 'none', boxShadow: '0 -12px 48px rgba(0,0,0,0.04)', padding: '24px', display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ flex: 1, background: 'var(--bg)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', opacity: 1 - (i*0.15) }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', marginBottom: '16px' }} />
                <div style={{ width: '60%', height: '12px', borderRadius: '4px', background: 'var(--border)', marginBottom: '8px' }} />
                <div style={{ width: '40%', height: '12px', borderRadius: '4px', background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="main-content">
        <div className="stats-strip animate-fade-in delay-1">
          <div className="stat-item">
            <div className="stat-number green">150+</div>
            <div className="stat-label">Stocks Screened</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">Real-time</div>
            <div className="stat-label">Market Data</div>
          </div>
          <div className="stat-item">
            <div className="stat-number green">100%</div>
            <div className="stat-label">AAOIFI Compliant</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section style={{ padding: '100px 0', background: 'var(--bg-section)' }}>
        <div className="main-content">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">Our Process</div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>How Irshad Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '560px', margin: '16px auto 0', lineHeight: 1.7 }}>
              Our proprietary 3-stage algorithm ensures your investments align completely with Islamic financial principles.
            </p>
          </div>

          <div className="feature-grid">
            {[
              {
                step: '01',
                icon: <Shield size={20} />,
                title: 'Business Screening',
                desc: 'We analyze every company\'s core operations to ensure they don\'t participate in prohibited activities like gambling, alcohol, pork, weapons, or conventional banking.',
              },
              {
                step: '02',
                icon: <BarChart2 size={20} />,
                title: 'Financial Ratios',
                desc: 'Corporate balance sheets are evaluated against AAOIFI standards — checking debt-to-market-cap ratios and interest-bearing investments for strict financial compliance.',
              },
              {
                step: '03',
                icon: <CheckCircle size={20} />,
                title: 'Purification Calc',
                desc: 'For companies with minor non-compliant streams, our built-in calculator instantly tells you the exact amount to purify (donate) from your dividends or capital gains.',
              },
            ].map((f, i) => (
              <div className="feature-card animate-fade-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-step">{f.step}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Market Preview */}
      {stocks.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div className="main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div className="section-label">Live Market</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Market Snapshot</h2>
              </div>
              <Link to="/login" className="btn-ghost">View All Stocks <ChevronRight size={16} /></Link>
            </div>
            <div className="stock-grid-home">
              {stocks.map(s => <StockCard key={s.symbol} company={s} />)}
            </div>
          </div>
        </section>
      )}

      {/* About Strip */}
      <section style={{ padding: '80px 0', background: 'var(--bg-section)' }}>
        <div className="main-content">
          <div className="about-strip-grid">
            <div>
              <div className="section-label">Our Story</div>
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '16px 0 24px' }}>
                Built for Muslim Investors in Nigeria
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.85, marginBottom: '20px' }}>
                Irshad was founded to solve a critical gap: Muslim investors in Nigeria had no transparent, automated tool to verify that their stock holdings complied with Islamic principles.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.85, marginBottom: '32px' }}>
                By strictly adhering to AAOIFI standards and building deep integrations with market data, we empower you to grow your wealth without compromising your faith.
              </p>
              <Link to="/about" className="btn-ghost">
                Read our full story <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              padding: '48px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex', flexDirection: 'column', gap: '20px',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark logo */}
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute', bottom: '-24px', right: '-24px',
                  width: '140px', opacity: 0.06,
                  pointerEvents: 'none', userSelect: 'none',
                  filter: 'saturate(0)',
                }}
              />
              {[
                { label: 'Halal Stocks', value: '87', color: 'var(--halal)', bg: 'var(--halal-bg)' },
                { label: 'Questionable Stocks', value: '34', color: 'var(--doubtful)', bg: 'var(--doubtful-bg)' },
                { label: 'Non-Halal Stocks', value: '29', color: 'var(--non-halal)', bg: 'var(--non-halal-bg)' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: row.bg, borderRadius: 'var(--radius-md)', padding: '16px 20px'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.color, fontSize: '1.4rem' }}>{row.value}</span>
                </div>
              ))}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 4 }}>
                Based on AAOIFI screening of listed companies
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Mobile App Section */}
      <section style={{ padding: '80px 0', background: 'var(--primary-50)' }}>
        <div className="main-content">
          <div className="app-section-grid">
            <div>
              <div className="section-label">Get the App</div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 24px', color: 'var(--text-dark)' }}>
                Your Halal Portfolio in Your Pocket
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '32px' }}>
                Download the Irshad mobile app for iOS and Android to track your investments, calculate your Zakat, and receive real-time halal screening alerts directly on your phone.
              </p>
              
              <div className="app-store-btns">
                <a href="#" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#000', color: 'white',
                  padding: '12px 24px', borderRadius: '12px',
                  textDecoration: 'none'
                }}>
                  <Apple size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Download on the</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.3px', marginTop: '-2px' }}>App Store</span>
                  </div>
                </a>

                <a href="#" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#000', color: 'white',
                  padding: '12px 24px', borderRadius: '12px',
                  textDecoration: 'none'
                }}>
                  <Play size={28} fill="currentColor" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Get it on</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.3px', marginTop: '-2px' }}>Google Play</span>
                  </div>
                </a>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <img 
                src="/app_mockup.jpg" 
                alt="Irshad Mobile App" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: '0 24px 64px rgba(201,168,76,0.15)',
                  transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)'
                }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '60px 20px' }}>
        <div className="cta-banner">
          {/* Background logo watermark */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', right: '220px', top: '50%', transform: 'translateY(-50%)',
              height: '220px', opacity: 0.06,
              pointerEvents: 'none', userSelect: 'none',
              filter: 'brightness(10)',
            }}
          />
          <div>
            <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '12px' }}>
              Ready to invest the halal way?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', maxWidth: '520px', lineHeight: 1.7 }}>
              Join thousands of Nigerian Muslims who trust Irshad to screen their investments. Get started free today.
            </p>
          </div>
          <div className="cta-banner-btns">
            <Link to="/register" style={{
              background: 'white',
              color: 'var(--primary)',
              fontWeight: 700,
              padding: '14px 28px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.97rem',
              whiteSpace: 'nowrap',
            }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/market" style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: 600,
              padding: '14px 28px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.97rem',
              whiteSpace: 'nowrap',
              border: '1.5px solid rgba(255,255,255,0.3)',
            }}>
              Browse Market
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ─── Market Page ────────────────────────────────────────── */
const MarketPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchNgxStocks()
      .then(r => { if (r.data) setStocks(r.data); })
      .catch(err => setError(err?.message || 'Failed to load stocks. Please try again.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const getStatus = (company) => {
    const raw = company.status;
    if (typeof raw === 'object' && raw !== null) return raw.status?.toLowerCase() ?? 'doubtful';
    if (typeof raw === 'string') {
      const s = raw.toLowerCase();
      if (s === 'compliant') return 'halal';
      return s;
    }
    return 'doubtful';
  };

  const filtered = stocks.filter(s => {
    const statusMatch = filter === 'all' || getStatus(s) === filter;
    const nameMatch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.symbol?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && nameMatch;
  });

  return (
    <div className="animate-fade-in page-wrapper">
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label" style={{ marginBottom: '12px' }}>Live Market</div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>Stock Market</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Halal compliance screening for every stock on the Nigerian Exchange.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search symbol or company..."
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border)',
            background: 'white',
            fontSize: '0.95rem',
            color: 'var(--text-dark)',
            outline: 'none',
            width: '260px',
            fontFamily: 'inherit',
          }}
        />
        {['all', 'halal', 'doubtful', 'non-halal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '9px 18px',
              borderRadius: '40px',
              border: filter === f ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              background: filter === f ? 'var(--primary-50)' : 'white',
              color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'All Stocks' : f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: '0.88rem', fontWeight: 600 }}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading stocks...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} strokeWidth={1} style={{ margin: '0 auto 20px', color: 'var(--non-halal)' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--non-halal)' }}>Could not load stocks</h3>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchNgxStocks().then(r => { if (r.data) setStocks(r.data); }).catch(err => setError(err?.message || 'Failed')).finally(() => setLoading(false)); }}
            className="btn-primary"
          >Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} strokeWidth={1} style={{ margin: '0 auto 20px' }} />
          <h3 style={{ marginBottom: '8px' }}>No stocks found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="custom-scroll-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map((stock, i) => (
              <div key={stock.symbol} className="roll-in-anim" style={{ animationDelay: `${(i % 15) * 0.05}s` }}>
                <StockCard company={stock} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── App Shell ──────────────────────────────────────────── */
function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopNavbar />
        <StockTicker />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="/shariah" element={<ShariahPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/:symbol" element={<StockDetails />} />
            <Route path="/dashboard" element={
              <DashboardLayout><Dashboard /></DashboardLayout>
            } />
            <Route path="/portfolio" element={
              <DashboardLayout><Portfolio /></DashboardLayout>
            } />
            <Route path="/profile" element={
              <DashboardLayout><Profile /></DashboardLayout>
            } />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
