import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle, Shield, BarChart2, ChevronRight, Smartphone, Apple, Play } from 'lucide-react';
import { fetchNgxStocks } from './services/api';
import StockDetails from './components/StockDetails';
import Portfolio from './components/Portfolio';
import AboutPage from './components/About';
import NewsPage from './components/News';
import ShariahPage from './components/Shariah';
import { LoginPage, RegisterPage } from './components/AuthPages';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import './index.css';

/* ─── Navbar ──────────────────────────────────────────────── */
const TopNavbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className="top-navbar" style={{ boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.07)' : 'none' }}>
      <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
        <img
          src="/logo-horizontal.jpg"
          alt="Irshad – Guidance & Growth"
          style={{
            height: '46px',
            width: 'auto',
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
        <Link to="/news" className={`nav-link ${location.pathname === '/news' ? 'active' : ''}`}>News</Link>
        <Link to="/market" className={`nav-link ${location.pathname.startsWith('/market') ? 'active' : ''}`}>Market</Link>
        <Link to="/portfolio" className={`nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}>Portfolio</Link>
        {(user?.role === 'admin' || user?.role === 'scholar') && (
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} style={{ color: 'var(--primary-green)' }}>Admin</Link>
        )}
        <div className="nav-divider" />
        
        {!loading && (
          user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                {user.first_name || user.name || 'User'}
              </span>
              <button 
                onClick={logout} 
                className="nav-link" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
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
    </nav>
  );
};

/* ─── Ticker ──────────────────────────────────────────────── */
const StockTicker = () => {
  const [stocks, setStocks] = useState([]);

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

          return (
            <div key={`${stock.symbol}-${i}`} className="ticker-item">
              <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{stock.symbol}</span>
              <span style={{ margin: '0 8px', color: 'var(--border-strong)' }}>|</span>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', color }}>{statusStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Stock Card ─────────────────────────────────────────── */
const StockCard = ({ company }) => {
  const priceChange = company.price_change ?? 0;
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

  return (
    <Link to={`/market/${company.symbol}`} className="stock-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stock-symbol">{company.symbol}</div>
          <div className="stock-name">{company.name}</div>
        </div>
        <span className={`status-badge ${badgeClass}`}>{statusStr}</span>
      </div>
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stock-price">₦ {(company.latest_price ?? 0).toFixed(2)}</span>
        <div className={isPositive ? 'stock-change-pos' : 'stock-change-neg'}>
          {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          {(company.price_change_pct ?? 0).toFixed(2)}%
        </div>
      </div>
    </Link>
  );
};

/* ─── Footer ─────────────────────────────────────────────── */
const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div>
        <div className="footer-logo-area" style={{ marginBottom: '20px' }}>
          <img
            src="/logo-horizontal.jpg"
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
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/news">Latest News</Link></li>
          <li><Link to="/contact">Contact</Link></li>
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
      <section className="hero animate-fade-in">
        <div className="hero-tag">
          <CheckCircle size={13} />
          AAOIFI-Certified · Market Listed
        </div>

        {/* Logo mark in hero */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="Irshad – Guidance & Growth"
            style={{
              height: '160px',
              width: 'auto',
              filter: 'drop-shadow(0 12px 32px rgba(26,92,53,0.18))',
              animation: 'fadeIn 0.8s ease-out forwards',
            }}
          />
        </div>

        <h1>
          Invest with <span className="highlight">Confidence</span>{' '}
          and Faith
        </h1>
        <p>
          Automated Shariah screening for every stock on the Nigerian Exchange. Know what's halal, what's not, and exactly how much to purify — in seconds.
        </p>
        <div className="hero-cta">
          <Link to="/market" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Explore the Market <ArrowRight size={18} />
          </Link>
          <Link to="/about" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Learn How It Works
          </Link>
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
        <section style={{ padding: '100px 0' }}>
          <div className="main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <div className="section-label">Live Market</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Market Snapshot</h2>
              </div>
              <Link to="/market" className="btn-ghost">View All Stocks <ChevronRight size={16} /></Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {stocks.map(s => <StockCard key={s.symbol} company={s} />)}
            </div>
          </div>
        </section>
      )}

      {/* About Strip */}
      <section style={{ padding: '100px 0', background: 'var(--bg-section)' }}>
        <div className="main-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
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

      {/* News Section */}
      <section style={{ padding: '100px 0' }}>
        <div className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <div className="section-label">Insights</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Latest News & Analysis</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                Market updates, Islamic finance insights, and platform news.
              </p>
            </div>
            <Link to="/news" className="btn-secondary">View All Articles</Link>
          </div>

          <div className="news-grid">
            {[
              {
                tag: 'Market Update',
                date: 'Jul 9, 2026',
                gradient: 'linear-gradient(135deg, #0f4c31 0%, #1a7a4f 100%)',
                title: 'Market records positive trading week amidst new Central Bank regulations',
                excerpt: 'The Nigerian equities market closed on a positive note as investors reacted favorably to the CBN\'s revised compliance directives...',
              },
              {
                tag: 'Islamic Finance',
                date: 'Jul 2, 2026',
                gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                title: 'Understanding AAOIFI Standards for Retail Investors in 2026',
                excerpt: 'A deep dive into how AAOIFI\'s updated 2024 standards affect stock screening methodology and what it means for Nigerian investors...',
              },
              {
                tag: 'Company News',
                date: 'Jun 25, 2026',
                gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                title: 'MTN Nigeria announces green bond initiative and sustainability targets',
                excerpt: 'Following their Q2 earnings report, MTN Nigeria unveiled a sweeping new environmental initiative aimed at reducing carbon emissions...',
              },
            ].map((article, i) => (
              <div className="news-card" key={i}>
                <div className="news-thumb-placeholder" style={{ background: article.gradient }} />
                <div className="news-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="news-tag">{article.tag}</span>
                    <span className="news-date">{article.date}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p style={{ marginTop: '10px' }}>{article.excerpt}</p>
                  <Link to="/news" className="btn-ghost" style={{ marginTop: '16px', fontSize: '0.9rem' }}>
                    Read more <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section style={{ padding: '80px 0', background: 'var(--primary-50)' }}>
        <div className="main-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <div className="section-label">Get the App</div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 24px', color: 'var(--text-dark)' }}>
                Your Halal Portfolio in Your Pocket
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '32px' }}>
                Download the Irshad mobile app for iOS and Android to track your investments, calculate your Zakat, and receive real-time halal screening alerts directly on your phone.
              </p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
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
                  boxShadow: '0 24px 64px rgba(26,92,53,0.15)',
                  transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)'
                }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, var(--primary) 0%, #1d6b3d 60%, #25A35A 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '72px 80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '40px',
          boxShadow: '0 16px 48px rgba(26,92,53,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
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
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
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
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNgxStocks()
      .then(r => { if (r.data) setStocks(r.data); })
      .catch(err => setError(err?.message || 'Failed to load stocks. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filtered.map(stock => <StockCard key={stock.symbol} company={stock} />)}
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
            <Route path="/news" element={<NewsPage />} />
            <Route path="/shariah" element={<ShariahPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/:symbol" element={<StockDetails />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
