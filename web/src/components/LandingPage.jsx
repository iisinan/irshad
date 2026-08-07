import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Search as SearchIcon, FileText, Globe, FileDigit, Sparkles, CheckCircle, Lock, Zap, BarChart2, Smartphone } from 'lucide-react';
import { fetchOverviewStats, fetchRecentScreenings, fetchLatestReports, fetchBusinessNewsOverview } from '../services/api';
import Footer from './Footer';

// ─── Helpers ─────────────────────────────────────────────────

const CompanyAvatar = ({ symbol, size = 40 }) => {
  const [error, setError] = useState(false);
  const letter = (symbol || '').substring(0, 2).toUpperCase();
  const radius = size * 0.22;
  if (error || !symbol) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: 'var(--primary-50)', color: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.38, border: '1px solid var(--primary-100)',
        flexShrink: 0,
      }}>
        {letter}
      </div>
    );
  }
  return (
    <img
      src={`https://s3-symbol-logo.tradingview.com/${symbol.toLowerCase()}--big.svg`}
      alt={symbol}
      onError={() => setError(true)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'contain', background: 'white', border: '1px solid var(--border)', flexShrink: 0 }}
    />
  );
};

const useReveal = (threshold = 0.1) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

const Reveal = ({ children, delay = 0, y = 22, style: sx = {} }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : `translateY(${y}px)`,
      transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      ...sx,
    }}>
      {children}
    </div>
  );
};

const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    const end = parseInt(value) || 0;
    if (!end) { setCount(value); return; }
    let start = null;
    const run = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(run);
      else setCount(value);
    };
    requestAnimationFrame(run);
  }, [value, visible]);
  return <span ref={ref}>{count}</span>;
};

const StatusPill = ({ verdict }) => {
  const v = typeof verdict === 'object' ? verdict?.status : verdict;
  const purif = typeof verdict === 'object' ? verdict?.purification_required : false;

  const map = {
    halal:     { label: purif ? 'Halal w/ Purify' : 'Halal',     bg: purif ? 'rgba(245, 158, 11, 0.15)' : 'var(--halal-bg)',     color: purif ? '#f59e0b' : 'var(--halal)',     border: purif ? 'rgba(245, 158, 11, 0.4)' : 'var(--halal-border)'     },
    compliant: { label: purif ? 'Halal w/ Purify' : 'Halal',     bg: purif ? 'rgba(245, 158, 11, 0.15)' : 'var(--halal-bg)',     color: purif ? '#f59e0b' : 'var(--halal)',     border: purif ? 'rgba(245, 158, 11, 0.4)' : 'var(--halal-border)'     },
    non_halal: { label: 'Non-Halal', bg: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'var(--non-halal-border)' },
    'non-halal': { label: 'Non-Halal', bg: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'var(--non-halal-border)' },
    doubtful:  { label: 'Doubtful',  bg: 'var(--doubtful-bg)',  color: 'var(--doubtful)',  border: 'var(--doubtful-border)'  },
  };
  const s = map[v?.toLowerCase()] || map.doubtful;
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {s.label}
    </span>
  );
};

// ─── Main ─────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [reports, setReports]   = useState([]);
  const [news, setNews]         = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, rep, n] = await Promise.all([
          fetchOverviewStats(), fetchRecentScreenings(), fetchLatestReports(), fetchBusinessNewsOverview()
        ]);
        setStats(s.data);
        setRecent(r.data);
        setReports(rep.data);
        setNews(n.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) navigate('/market', { state: { query: search.trim() } });
  };

  const statItems = [
    { label: 'Equities Screened',     value: stats?.total_companies  ?? stats?.companies ?? 0,  suffix: '+',  icon: BarChart2,   color: 'var(--primary)'  },
    { label: 'Reports Processed',     value: stats?.total_reports    ?? stats?.reports   ?? 0,  suffix: '+',  icon: FileText,    color: '#059669'         },
    { label: 'News Articles',         value: stats?.total_news       ?? stats?.news      ?? 0, suffix: '+',  icon: Globe,       color: 'var(--gold)'     },
    { label: 'Shariah Compliant',     value: stats?.halal_count      ?? stats?.halal     ?? 0,   suffix: '',   icon: CheckCircle, color: 'var(--primary)'  },
  ];

  const features = [
    { icon: Shield,      title: 'AAOIFI Standard 21', desc: 'Screening built on the gold standard for Islamic equity trading — strictly enforcing 30% debt, 30% cash, and 5% impure revenue limits.' },
    { icon: Sparkles,    title: 'Dividend Purification', desc: 'Automatic calculation of non-halal income fractions down to 2 decimal places so you can cleanse your dividends with precision.' },
    { icon: Lock,        title: 'NGX Filing Evidence', desc: 'Zero black-box ratings. Every verdict links to official, timestamped regulatory reports from NGX Pulse.' },
    { icon: CheckCircle, title: 'Continuous Monitoring', desc: 'Quarterly and annual financial statements trigger immediate recalculations and watchlist compliance alerts.' },
  ];

  const pipeline = [
    { n: '01', title: 'Regulatory Ingestion',  desc: 'Audited filings & quarterly reports fetched from NGX Pulse',          icon: Globe      },
    { n: '02', title: 'Business Purity Screen',desc: 'Rule 3/4/1 exclusion of conventional banking, alcohol & vice sectors',icon: Shield     },
    { n: '03', title: '30% / 5% Ratio Testing', desc: 'Strict quantitative assessment against live Market Capitalisation',   icon: FileDigit  },
    { n: '04', title: 'Purification & Verdict', desc: 'Instant Halal / Non-Halal verdict with automated dividend cleansing', icon: Sparkles   },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

      {/* ── HERO ────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(96px,14vw,152px) 20px clamp(80px,10vw,120px)', overflow: 'hidden' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% -15%, rgba(0,109,100,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(56px)' }} />
        <div style={{ position: 'absolute', top: '15%', left: '-8%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,109,100,0.09) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(36px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--border-strong) 25%, var(--border-strong) 75%, transparent 100%)' }} />

        <div style={{ position: 'relative', maxWidth: 1260, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 'clamp(40px, 8vw, 80px)', alignItems: 'center' }}>
          
          {/* Left: Copy */}
          <div>
            {/* Eyebrow badge */}
            <div className="animate-slide-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '6px 16px', borderRadius: 40, color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: 28 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2.5s infinite' }} />
              AAOIFI-Certified Shariah Screening · NGX
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up stagger-1" style={{ fontSize: 'clamp(2.6rem, 5.2vw, 4.6rem)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-2.5px', color: 'var(--text-dark)', marginBottom: 22 }}>
              The Intelligent Platform<br />
              for{' '}
              <span style={{ background: 'linear-gradient(130deg, var(--primary) 0%, #22c5b0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Islamic Investing
              </span>
            </h1>

            {/* Subheading */}
            <p className="animate-slide-up stagger-2" style={{ fontSize: 'clamp(1rem, 1.3vw, 1.12rem)', color: 'var(--text-muted)', lineHeight: 1.82, maxWidth: 520, marginBottom: 40, fontWeight: 400 }}>
              Irshad screens Nigerian equities against rigorous AAOIFI standards — so you know exactly what you own, and whether it is permissible.
            </p>

            {/* CTAs */}
            <div className="animate-slide-up stagger-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/portfolio" className="btn-primary hover-lift" style={{ padding: '15px 36px', fontSize: '0.95rem', borderRadius: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 28px rgba(0,109,100,0.24)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Explore Equities <ArrowRight size={17} />
              </Link>
              <Link to="/shariah" style={{ padding: '15px 36px', fontSize: '0.95rem', borderRadius: 13, fontWeight: 600, color: 'var(--text-body)', border: '1.5px solid var(--border-strong)', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'border-color 0.22s, color 0.22s', textDecoration: 'none', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-body)'; }}>
                Our Methodology
              </Link>
            </div>

            {/* Trust badges */}
            <div className="animate-slide-up stagger-4" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 10, columnGap: 0 }}>
              {[
                { icon: Shield,      text: 'AAOIFI Std. 21' },
                { icon: CheckCircle, text: 'Halal Verified'  },
                { icon: Lock,        text: 'Fully Auditable'  },
              ].map((b, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <b.icon size={13} color="var(--primary)" />
                    {b.text}
                  </div>
                  {i < 2 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-strong)', margin: '0 16px' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Store badges */}
            <div className="animate-slide-up stagger-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 11, background: '#111', color: 'white', padding: '11px 20px', borderRadius: 13, textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.26)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div style={{ lineHeight: 1 }}>
                  <div style={{ fontSize: '0.58rem', opacity: 0.65, marginBottom: 3, fontWeight: 500, letterSpacing: '0.2px' }}>Download on the</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.3px' }}>App Store</div>
                </div>
              </a>

              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 11, background: '#111', color: 'white', padding: '11px 20px', borderRadius: 13, textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.26)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3.18 23.76c.3.17.64.24.99.19L14.54 12 3.18.05C2.83.0 2.49.07 2.19.24 1.6.57 1.25 1.22 1.25 2v20c0 .78.35 1.43.93 1.76z" fill="#EA4335"/>
                  <path d="M22.45 10.29l-3.23-1.85L15.72 12l3.5 3.56 3.24-1.86c.93-.53.93-2.88-.01-3.41z" fill="#FBBC04"/>
                  <path d="M3.18.05l11.36 11.96L18.1 8.44 5.11.34A2.04 2.04 0 003.18.05z" fill="#4285F4"/>
                  <path d="M3.18 23.95c.6.36 1.35.32 1.93-.04l13-8.1-3.57-3.81L3.18 23.95z" fill="#34A853"/>
                </svg>
                <div style={{ lineHeight: 1 }}>
                  <div style={{ fontSize: '0.58rem', opacity: 0.65, marginBottom: 3, fontWeight: 500, letterSpacing: '0.2px' }}>Get it on</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>

          
          {/* Right: Phone Visual */}
          <div className="animate-slide-up stagger-2" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,109,100,0.13) 0%, transparent 70%)', filter: 'blur(44px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', width: 'min(290px, 100%)', aspectRatio: '9/16.5' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', borderRadius: 40, border: '1.5px solid var(--border-strong)', boxShadow: '0 40px 80px rgba(0,0,0,0.14), 0 0 0 6px var(--bg), 0 0 0 7.5px var(--border-strong)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--text-dark)' }}>9:41</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                    {[4,6,8,10].map((h,i) => <div key={i} style={{ width: 3, height: h, background: 'var(--text-dark)', borderRadius: 1, opacity: 0.35 + i * 0.18 }} />)}
                    <Smartphone size={10} color="var(--text-dark)" style={{ marginLeft: 3, opacity: 0.7 }} />
                  </div>
                </div>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Irshad</span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={13} color="white" /></div>
                  </div>
                  <div style={{ background: 'var(--primary-50)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <SearchIcon size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: 500 }}>Search equities…</span>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {[
                    { sym: 'DANGCEM',    name: 'Dangote Cement',  verdict: 'halal'     },
                    { sym: 'ZENITHBANK', name: 'Zenith Bank',      verdict: 'doubtful'  },
                    { sym: 'MTNN',       name: 'MTN Nigeria',      verdict: 'halal'     },
                    { sym: 'GTCO',       name: 'Guaranty Trust',   verdict: 'halal'     },
                  ].map((co, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.6rem', color: 'var(--primary)', flexShrink: 0, border: '1px solid var(--primary-100)' }}>{co.sym.substring(0,2)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dark)' }}>{co.sym}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 0 18px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-around', flexShrink: 0 }}>
                  {[{icon:BarChart2,label:'Market',active:true},{icon:FileText,label:'Reports',active:false},{icon:Shield,label:'Screening',active:false},{icon:Globe,label:'News',active:false}].map((tab,i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <tab.icon size={16} color={tab.active ? 'var(--primary)' : 'var(--text-light)'} />
                      <span style={{ fontSize: '0.53rem', fontWeight: 600, color: tab.active ? 'var(--primary)' : 'var(--text-light)' }}>{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH & LIVE DATA ────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,7vw,64px) 20px clamp(56px,9vw,96px)', display: 'flex', flexDirection: 'column', gap: 'clamp(36px,6vw,52px)', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Stats strip */}
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1.5px solid var(--border-strong)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,109,100,0.05)' }}>
            {statItems.map((s, i) => (
              <div key={i} style={{ background: 'var(--bg)', padding: '20px 22px', borderRight: i < statItems.length - 1 ? '1px solid var(--border-strong)' : 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,109,100,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <s.icon size={13} color={s.color} style={{ opacity: 0.8 }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.9rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.8px', lineHeight: 1 }}>
                  <AnimatedNumber value={s.value} />{s.suffix}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Search bar */}
        <Reveal delay={0.06}>
          <div style={{ position: 'relative' }}>
            <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border-strong)', borderRadius: 100, padding: '10px 10px 10px 26px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', transition: 'box-shadow 0.3s, border-color 0.3s' }}
              onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,109,100,0.1), 0 4px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlurCapture={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
              <SearchIcon size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by ticker or company name…"
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.97rem', color: 'var(--text-dark)', fontWeight: 500, padding: '8px 0', minWidth: 0, fontFamily: 'inherit' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '12px 32px', borderRadius: 100, fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Analyse
                </button>
              </form>
            </div>
          </div>
        </Reveal>

        {/* Live Screenings */}
        <Reveal delay={0.08}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--halal)', animation: 'pulse 3s infinite', boxShadow: '0 0 0 2px rgba(5,150,105,0.2)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Recently Screened</span>
              </div>
              <Link to="/market" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'gap 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.gap = '7px'}
                onMouseLeave={e => e.currentTarget.style.gap = '4px'}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {loading
                ? [0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)
                : recent.slice(0, 4).map((co) => (
                  <Link key={co.id} to={`/market/${co.symbol}`} style={{ padding: '16px', background: 'var(--bg)', border: '1.5px solid var(--border-strong)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14, textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,109,100,0.35)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,109,100,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <CompanyAvatar symbol={co.symbol} size={42} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.symbol}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.name}</div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── MAIN ──────────────────────────────── */}
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '0 20px clamp(72px,12vw,120px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(56px,9vw,96px)' }}>

        {/* Features Grid */}
        <Reveal delay={0.05}>
          <div>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ height: 1, width: 28, background: 'var(--primary)', opacity: 0.5 }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--primary)' }}>Why Irshad</span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1.2px', lineHeight: 1.1, maxWidth: 460, margin: 0 }}>
                  Built for the serious<br />Muslim investor
                </h2>
              </div>
              <Link to="/portfolio" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', textDecoration: 'none', transition: 'gap 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.gap = '9px'}
                onMouseLeave={e => e.currentTarget.style.gap = '5px'}>
                Start for free <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 0, border: '1.5px solid var(--border-strong)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,109,100,0.07)' }}>
              {features.map((f, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div style={{
                    padding: '36px 32px 40px',
                    background: 'var(--bg)',
                    borderRight: i % 2 === 0 ? '1px solid var(--border-strong)' : 'none',
                    borderBottom: i < 2 ? '1px solid var(--border-strong)' : 'none',
                    transition: 'background 0.25s, box-shadow 0.25s',
                    height: '100%', boxSizing: 'border-box',
                    position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(160deg, rgba(0,109,100,0.04) 0%, rgba(0,109,100,0.01) 100%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}>
                    {/* Subtle step number */}
                    <div style={{ position: 'absolute', top: 20, right: 24, fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '1px', opacity: 0.5 }}>0{i + 1}</div>
                    {/* Icon */}
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary) 0%, #22c5b0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 22, boxShadow: '0 6px 18px rgba(0,109,100,0.25)' }}>
                      <f.icon size={21} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--text-dark)', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</div>
                    <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Pipeline */}
        <Reveal delay={0.05}>
          <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', border: '1.5px solid var(--border-strong)', boxShadow: '0 8px 32px rgba(0,109,100,0.06)' }}>
            {/* Header strip */}
            <div style={{ padding: 'clamp(32px,5vw,52px) clamp(28px,5vw,52px) 0', background: 'linear-gradient(160deg, rgba(0,109,100,0.05) 0%, rgba(0,109,100,0.01) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ height: 1, width: 28, background: 'var(--primary)', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--primary)' }}>Methodology</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px', lineHeight: 1.15, margin: 0 }}>
                    How the screening works
                  </h2>
                </div>
                <Link to="/shariah" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', textDecoration: 'none', transition: 'gap 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.gap = '9px'}
                  onMouseLeave={e => e.currentTarget.style.gap = '5px'}>
                  Full methodology <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 0, background: 'var(--border-strong)' }}>
              {pipeline.map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div style={{ background: 'var(--bg)', padding: '32px 28px 36px', borderRight: i < pipeline.length - 1 ? '1px solid var(--border-strong)' : 'none', height: '100%', boxSizing: 'border-box', transition: 'background 0.25s', position: 'relative' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,109,100,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                    {/* Step number — large background accent */}
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.07, lineHeight: 1, marginBottom: -16, letterSpacing: '-3px', userSelect: 'none' }}>{s.n}</div>
                    {/* Icon */}
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, var(--primary) 0%, #22c5b0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 18, boxShadow: '0 6px 18px rgba(0,109,100,0.25)' }}>
                      <s.icon size={19} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)', marginBottom: 9, letterSpacing: '-0.2px' }}>{s.title}</div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                    {/* Connector arrow (except last) */}
                    {i < pipeline.length - 1 && (
                      <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, background: 'var(--bg)', border: '1.5px solid var(--border-strong)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <ArrowRight size={9} color="var(--primary)" />
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* CTA Banner */}
        <Reveal delay={0.04}>
          <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #3C2D3E 100%)', padding: 'clamp(44px,7vw,76px)', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', border: '1px solid rgba(201, 149, 42, 0.2)' }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', right: -80, top: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,198,81,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: -60, bottom: -100, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,198,81,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Radial spotlight */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', maxWidth: 540 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)', border: '1px solid rgba(243,198,81,0.3)', padding: '4px 13px', borderRadius: 20, marginBottom: 18, background: 'rgba(243,198,81,0.08)' }}>
                <Shield size={11} />
                AAOIFI Standard No. 21
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 900, color: 'white', letterSpacing: '-1.2px', lineHeight: 1.12, marginBottom: 16 }}>
                Invest with conviction.<br />Screen with precision.
              </h2>
              <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.72, margin: 0, maxWidth: 440 }}>
                Every ratio. Every ruling. Every company — rigorously checked so you never have to guess.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', minWidth: 200 }}>
              <Link to="/portfolio" className="hover-lift" style={{ padding: '14px 32px', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '0.92rem', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(118,88,122,0.28)', textDecoration: 'none' }}>
                Start Screening <ArrowRight size={15} />
              </Link>
              <Link to="/shariah" style={{ padding: '13px 32px', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.82)', fontWeight: 600, fontSize: '0.9rem', borderRadius: 13, textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s', textAlign: 'center', display: 'block' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.42)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}>
                Read the Methodology
              </Link>
            </div>
          </div>
        </Reveal>

      </div>
      <Footer />
    </div>
  );
}
