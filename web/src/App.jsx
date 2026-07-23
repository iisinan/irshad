import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle, Shield, BarChart2, ChevronRight, Smartphone, Apple, Play, AlertCircle, HelpCircle, Home, Scale, Info, BookOpen, Settings, LayoutDashboard, User } from 'lucide-react';
import { fetchNgxStocks } from './services/api';
import DashboardLayout from './components/DashboardLayout';
import Footer from './components/Footer';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './components/AuthPages';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import { useAuth } from './context/AuthContext';
import './index.css';

const StockDetails = React.lazy(() => import('./components/StockDetails'));
const AaoifiScreening = React.lazy(() => import('./components/AaoifiScreening'));
const Portfolio = React.lazy(() => import('./components/Portfolio'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const AboutPage = React.lazy(() => import('./components/About'));
const ShariahPage = React.lazy(() => import('./components/Shariah'));
const ResourcesPage = React.lazy(() => import('./components/Resources'));
const Profile = React.lazy(() => import('./components/Profile'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const RoleBasedDashboard = React.lazy(() => import('./components/RoleBasedDashboard'));
const Pricing = React.lazy(() => import('./components/Pricing'));

const DASHBOARD_ROUTES = ['/dashboard', '/portfolio', '/profile'];

/* ─── Animated Routes Wrapper ─────────────────────────────── */
const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  // Using location.pathname as a key triggers a re-render and animation on route change
  return (
    <div key={location.pathname} className="animate-fade-in" style={{ animationDuration: '0.3s' }}>
      <Routes location={location}>
        {children}
      </Routes>
    </div>
  );
};

import { trackPageView, identifyUser } from './utils/analytics';

/* ─── Document Title Updater & Analytics ──────────────────── */
const DocumentTitleUpdater = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      identifyUser(user);
    }
  }, [user]);

  useEffect(() => {
    const path = location.pathname;
    
    // Track Page View
    trackPageView(path);

    let title = 'Irshad - Islamic Finance & Shariah Screening';
    if (path === '/') title = 'Home | Irshad';
    else if (path.startsWith('/market')) title = 'Market Screener | Irshad';
    else if (path.startsWith('/portfolio')) title = 'My Portfolio | Irshad';
    else if (path.startsWith('/profile')) title = 'Profile & Settings | Irshad';
    else if (path.startsWith('/login')) title = 'Login | Irshad';
    else if (path.startsWith('/register')) title = 'Register | Irshad';
    else if (path.startsWith('/shariah')) title = 'Shariah Framework | Irshad';
    else if (path.startsWith('/resources')) title = 'Resources | Irshad';
    else if (path.startsWith('/about')) title = 'About Us | Irshad';
    document.title = title;
  }, [location]);
  return null;
};

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
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.svg"
            alt="Irshad Logo"
            style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.14rem', color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
            Irshad
          </span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/shariah" className={navLinkClass('/shariah')}>Shariah Framework</Link>
          <Link to="/resources" className={navLinkClass('/resources')}>Resources</Link>
          <Link to="/about" className={navLinkClass('/about')}>About Us</Link>
          {user && (
            <Link to="/portfolio" className={navLinkClass('/portfolio')}>Dashboard</Link>
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
                  <span style={{ fontSize: '0.79rem', color: 'var(--text-dark)', fontWeight: 600 }}>
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
                <Link to="/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.79rem' }}>
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
        <Link to="/" className={navLinkClass('/')} onClick={() => setMenuOpen(false)}>
          <Home size={18} /> Home
        </Link>
        <Link to="/shariah" className={navLinkClass('/shariah')} onClick={() => setMenuOpen(false)}>
          <Scale size={18} /> Shariah Framework
        </Link>
        <Link to="/about" className={navLinkClass('/about')} onClick={() => setMenuOpen(false)}>
          <Info size={18} /> About Us
        </Link>
        <Link to="/resources" className={navLinkClass('/resources')} onClick={() => setMenuOpen(false)}>
          <BookOpen size={18} /> Resources
        </Link>

        {user && (
          <Link to="/portfolio" className={navLinkClass('/portfolio')} onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}
        {(user?.role === 'admin' || user?.role === 'scholar') && (
          <Link to="/admin" className={navLinkClass('/admin')} onClick={() => setMenuOpen(false)}>
            <Settings size={18} /> Admin
          </Link>
        )}
        
        <div className="mobile-nav-auth">
          {!loading && (
            user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '14px 16px', background: 'var(--bg-section)', borderRadius: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                    {user.first_name || user.name || 'Profile'}
                  </span>
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="btn-secondary" style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>Log In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>Get Started →</Link>
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
    fetchNgxStocks().then(r => { if (r.data) setStocks(r.data.filter(s => parseFloat(s.latest_price) > 0)); }).catch(() => {});
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

          const displayPrice = Number(stock.latest_price || stock.daily_prices?.[0]?.price || 0).toFixed(2);

          return (
            <div key={`${stock.symbol}-${i}`} className="ticker-item" onClick={() => navigate('/login')}>
              <span className="ticker-item-symbol">{stock.symbol}</span>
              <span className="ticker-item-price">₦{displayPrice}</span>
              <span style={{ fontWeight: 800, fontSize: '0.62rem', color, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>{statusStr}</span>
              <div className="ticker-separator" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Company Avatar ────────────────────────────────────────── */
const CompanyAvatar = ({ symbol, size = 40, style = {} }) => {
  const [error, setError] = useState(false);
  const letter = (symbol || '').substring(0, 2).toUpperCase();
  const radius = size * 0.25;

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, color: 'var(--text-dark)', fontSize: `${size * 0.35}px`,
      overflow: 'hidden', flexShrink: 0,
      border: '1px solid var(--border)',
      ...style
    }}>
      {!error ? (
        <img
          src={`https://storage.googleapis.com/irshad-images/logos/${(symbol || '').toLowerCase()}.png`}
          alt={symbol}
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg)' }}
        />
      ) : (
        letter
      )}
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
  const sector = company.sector || 'Equities';

  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/login`)} className="stock-card hover-card" style={{ cursor: 'pointer', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <div className="stock-card-header" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CompanyAvatar symbol={company.symbol} size={36} />
        <div className="stock-card-title" style={{ flex: 1 }}>
          <div className="stock-symbol" style={{ fontSize: '0.79rem' }}>{company.symbol}</div>
          {company.name && <div className="stock-name" style={{ fontSize: '0.57rem' }}>{company.name}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        </div>
      </div>
      <div className="stock-card-body">
        {latestPrice > 0 ? (
          <>
            <div className="stock-price-wrapper">
              <span className="stock-price-currency" style={{ fontSize: '0.66rem' }}>₦</span>
              <span className="stock-price" style={{ fontSize: '0.92rem' }}>{latestPrice.toFixed(2)}</span>
            </div>
            {pct !== 0 && (
              <div className={`stock-change-pill ${isPositive ? 'pos' : 'neg'}`} style={{ fontSize: '0.57rem', padding: '2px 6px' }}>
                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isPositive ? '+' : ''}{pct.toFixed(2)}%
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data unavailable</div>
        )}
      </div>
    </div>
  );
};


// Footer moved to components/Footer.jsx

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

        <div className="hero-tag" style={{ background: 'var(--bg)', border: '1px solid var(--gold-100)', boxShadow: '0 4px 16px rgba(201,168,76,0.08)', color: 'var(--gold)' }}>
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
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 500 }}>
          Real-time halal screening for every stock on the Nigerian Exchange. Make confident, compliant investment decisions in seconds.
        </p>

        <div className="hero-cta" style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
          <Link to="/login" className="btn-primary" style={{ padding: '16px 36px', fontSize: '0.92rem', boxShadow: '0 8px 24px rgba(201,168,76,0.25)', borderRadius: '40px' }}>
            Start Screening <ArrowRight size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" color="var(--gold)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trusted by 10k+ investors</span>
            </div>
          </div>
        </div>

        {/* Floating Abstract UI Elements */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', height: '140px', marginTop: '60px' }}>
          {/* Mock Pill 1 */}
          <div style={{ position: 'absolute', top: '20px', left: '10%', background: 'var(--bg)', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', animation: 'float 6s ease-in-out infinite' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary-50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem' }}>MTN</span>
            </div>
            <div>
              <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--text-dark)' }}>MTNN</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--halal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={10} /> Halal</div>
            </div>
          </div>
          
          {/* Mock Pill 2 */}
          <div style={{ position: 'absolute', top: '-10px', right: '15%', background: 'var(--bg)', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', animation: 'float 7s ease-in-out infinite reverse' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--non-halal-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--non-halal)', fontWeight: 800, fontSize: '0.7rem' }}>NB</span>
            </div>
            <div>
              <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--text-dark)' }}>NB</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--non-halal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}><AlertCircle size={10} /> Non-Halal</div>
            </div>
          </div>

          {/* Main Mockup Strip */}
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, transparent 0%, var(--bg) 100%)', position: 'absolute', bottom: 0, left: 0, zIndex: 2 }} />
          <div style={{ width: '80%', height: '100%', margin: '0 auto', background: 'var(--bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', border: '1px solid var(--border)', borderBottom: 'none', boxShadow: '0 -12px 48px rgba(0,0,0,0.04)', padding: '24px', display: 'flex', gap: '16px', overflow: 'hidden' }}>
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
            <h2 style={{ fontSize: '2.11rem', fontWeight: '800', letterSpacing: '-0.5px' }}>How Irshad Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.97rem', maxWidth: '560px', margin: '16px auto 0', lineHeight: 1.7 }}>
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
                <h2 style={{ fontSize: '1.94rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Market Snapshot</h2>
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
              <h2 style={{ fontSize: '2.11rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '16px 0 24px' }}>
                Built for Muslim Investors in Nigeria
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.85, marginBottom: '20px' }}>
                Irshad was founded to solve a critical gap: Muslim investors in Nigeria had no transparent, automated tool to verify that their stock holdings complied with Islamic principles.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.85, marginBottom: '32px' }}>
                By strictly adhering to AAOIFI standards and building deep integrations with market data, we empower you to grow your wealth without compromising your faith.
              </p>
              <Link to="/about" className="btn-ghost">
                Read our full story <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{
              background: 'var(--bg)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex', flexDirection: 'column', gap: '20px',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark logo */}
              <img
                src="/logo.svg"
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
                  <span style={{ fontWeight: 800, color: row.color, fontSize: '1.23rem' }}>{row.value}</span>
                </div>
              ))}
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 4 }}>
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
              <h2 style={{ fontSize: '2.29rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 24px', color: 'var(--text-dark)' }}>
                Your Halal Portfolio in Your Pocket
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.97rem', lineHeight: 1.8, marginBottom: '32px' }}>
                Download the Irshad mobile app for iOS and Android to track your investments, calculate your Zakat, and receive real-time halal screening alerts directly on your phone.
              </p>
              
              <div className="app-store-btns">
                <a href="#" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#000', color: 'var(--bg)',
                  padding: '12px 24px', borderRadius: '12px',
                  textDecoration: 'none'
                }}>
                  <Apple size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Download on the</span>
                    <span style={{ fontSize: '0.97rem', fontWeight: 600, letterSpacing: '-0.3px', marginTop: '-2px' }}>App Store</span>
                  </div>
                </a>

                <a href="#" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#000', color: 'var(--bg)',
                  padding: '12px 24px', borderRadius: '12px',
                  textDecoration: 'none'
                }}>
                  <Play size={28} fill="currentColor" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Get it on</span>
                    <span style={{ fontSize: '0.97rem', fontWeight: 600, letterSpacing: '-0.3px', marginTop: '-2px' }}>Google Play</span>
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
            src="/logo.svg"
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
            <h2 style={{ color: 'white', fontSize: '1.94rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '12px' }}>
              Ready to invest the halal way?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem', maxWidth: '520px', lineHeight: 1.7 }}>
              Join thousands of Nigerian Muslims who trust Irshad to screen their investments. Get started free today.
            </p>
          </div>
          <div className="cta-banner-btns">
            <Link to="/register" style={{
              background: 'var(--bg)',
              color: 'var(--primary)',
              fontWeight: 700,
              padding: '14px 28px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
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
              fontSize: '0.85rem',
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

/* ─── Screen a Stock Page ──────────────────────────────────── */
const MarketPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchNgxStocks()
      .then(r => { if (r.data) setStocks(r.data.filter(s => parseFloat(s.latest_price) > 0)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const getStatus = (company) => {
    const raw = company.status;
    if (typeof raw === 'object' && raw !== null) return raw.status?.toLowerCase() ?? 'doubtful';
    if (typeof raw === 'string') { const s = raw.toLowerCase(); return s === 'compliant' ? 'halal' : s; }
    return 'doubtful';
  };

  const filtered = stocks.filter(s => {
    const statusMatch = filter === 'all' || getStatus(s) === filter;
    
    // Determine sector (defaulting to 'Other' if empty)
    const stockSector = (s.sector || 'Other').toLowerCase();
    const sectorMatch = sectorFilter === 'all' || stockSector.includes(sectorFilter.toLowerCase());
    
    const q = search.toLowerCase();
    const nameMatch = s.name?.toLowerCase()?.includes(q) || s.symbol?.toLowerCase()?.includes(q) || stockSector.includes(q);
    
    return statusMatch && sectorMatch && nameMatch;
  });

  // Extract unique sectors from loaded stocks
  const uniqueSectors = Array.from(new Set(stocks.map(s => (s.sector || 'Other').trim()))).filter(Boolean).sort();

  const statusConfig = {
    halal:    { label: 'HALAL',    cls: 'status-halal',     icon: <CheckCircle size={11} /> },
    'non-halal': { label: 'NON-HALAL', cls: 'status-non-halal', icon: <AlertCircle size={11} /> },
    doubtful: { label: 'DOUBTFUL', cls: 'status-doubtful',  icon: <HelpCircle size={11} /> },
  };

  const showResults = search.length > 0;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Hero Search Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--text-dark) 0%, #1a2a1a 60%, #0F2B0F 100%)',
        padding: '60px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '40px', padding: '6px 16px', marginBottom: '24px',
          color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px',
        }}>
          <Shield size={13} /> AAOIFI Shariah Screening
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900,
          color: 'white', letterSpacing: '-1px', marginBottom: '12px',
        }}>
          Search for Stock
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
          Search any company on the Nigerian Exchange and instantly see its Shariah compliance status.
        </p>

        {/* ── Big Search Box ── */}
        <div style={{
          maxWidth: '600px', margin: '0 auto',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'var(--bg)',
            borderRadius: '16px',
            padding: '6px 6px 6px 20px',
            boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.4), 0 20px 60px rgba(0,0,0,0.3)' : '0 20px 60px rgba(0,0,0,0.25)',
            transition: 'box-shadow 0.2s',
          }}>
            <BarChart2 size={20} color="var(--text-light)" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search by company name or stock symbol…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '0.92rem', color: 'var(--text-dark)', fontFamily: 'inherit',
                padding: '10px 0',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'var(--bg-section)', border: 'none', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '0.69rem', fontWeight: 600,
              }}>Clear</button>
            )}
            <button
              onClick={() => { if (filtered.length === 1) navigate(`/market/${filtered[0].symbol}`, { state: { stock: filtered[0] } }); }}
              style={{
                background: 'var(--gold-grad)', border: 'none', borderRadius: '12px',
                padding: '12px 24px', color: 'white', fontWeight: 700, fontSize: '0.84rem',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
              }}>
              Search →
            </button>
          </div>
        </div>


      </div>

      {/* ── Results Area ── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '16px' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem' }}>Loading stocks…</p>
          </div>
        ) : !showResults ? (
          /* ── Idle State: show stats + tip ── */
          <div style={{ textAlign: 'center', padding: '20px 0 60px' }}>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
              {[
                { label: 'Total Stocks', value: stocks.length, color: 'var(--primary)' },
                { label: 'Halal', value: stocks.filter(s => getStatus(s) === 'halal').length, color: 'var(--halal)' },
                { label: 'Non-Halal', value: stocks.filter(s => getStatus(s) === 'non-halal').length, color: 'var(--non-halal)' },
                { label: 'Doubtful', value: stocks.filter(s => getStatus(s) === 'doubtful').length, color: 'var(--doubtful)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '16px', padding: '24px 32px', textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ fontSize: '1.94rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <BarChart2 size={40} strokeWidth={1} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', fontWeight: 500 }}>
              Start typing to search for a stock above
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BarChart2 size={48} strokeWidth={1} style={{ color: 'var(--border)', margin: '0 auto 20px' }} />
            <h3 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>No stocks found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try a different name or symbol.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.79rem', fontWeight: 600 }}>
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                {search ? ` for "${search}"` : ''}
              </span>
            </div>
            <div className="market-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '720px', overflowY: 'auto', paddingRight: '8px' }}>
              {filtered.map((company, i) => {
                const price = parseFloat(company.daily_prices?.[0]?.price || company.latest_price || 0);
                const change = parseFloat(company.price_change_pct || 0);
                const isPos = change >= 0;
                const sector = company.sector || 'Equities';
                return (
                  <div
                    key={company.symbol}
                    onClick={() => navigate(`/market/${company.symbol}`, { state: { stock: company } })}
                    className="roll-in-anim"
                    style={{
                      animationDelay: `${(i % 10) * 0.04}s`,
                      display: 'flex', alignItems: 'center', gap: '16px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '16px', padding: '16px 20px',
                      cursor: 'pointer', transition: 'all 0.18s',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Logo */}
                    <CompanyAvatar symbol={company.symbol} size={44} />
                    
                    {/* Name + sector */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--text-dark)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {company.symbol}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {company.name}
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>₦{price.toFixed(2)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '200px' }}>
                        {change !== 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '2px',
                            color: isPos ? 'var(--halal)' : 'var(--non-halal)',
                            fontSize: '0.66rem', fontWeight: 700, marginLeft: '4px'
                          }}>
                            {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {isPos ? '+' : ''}{change.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-light)" style={{ flexShrink: 0, marginLeft: '8px' }} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


/* ─── App Shell ──────────────────────────────────────────── */
function App() {
  const { loading: authLoading } = useAuth();

  // Handle the seamless handoff from the native HTML splash screen
  useEffect(() => {
    const splash = document.getElementById('irshad-splash');
    if (!splash) return;

    if (!authLoading) {
      splash.classList.add('splash-hidden');
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
      setTimeout(() => splash.remove(), 600); // Wait for transition
    }
  }, [authLoading]);

  // Once auth is loaded, we can render the app. The native splash will fade over it.
  if (authLoading) {
    return null; // The native HTML splash is still visible
  }

  return (
    <>
      <ErrorBoundary>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <DocumentTitleUpdater />
            <TopNavbar />
            <StockTicker />
            <main style={{ flex: 1 }}>
              <Suspense fallback={
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary-100)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    <Shield size={24} color="var(--primary)" style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.5px' }}>Loading Irshad...</p>
                </div>
              }>
                <AnimatedRoutes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/shariah" element={<ShariahPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/market/:symbol" element={
                    <DashboardLayout><StockDetails /></DashboardLayout>
                  } />
                  <Route path="/market/:symbol/aaoifi" element={
                    <DashboardLayout><AaoifiScreening /></DashboardLayout>
                  } />
                  <Route path="/dashboard" element={
                    <DashboardLayout><RoleBasedDashboard /></DashboardLayout>
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
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="*" element={<NotFound />} />
                </AnimatedRoutes>
              </Suspense>
            </main>
          </div>
      </ErrorBoundary>
    </>
  );
}

export default App;
