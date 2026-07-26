import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Search as SearchIcon, FileText, Globe, FileDigit, ChevronRight, Sparkles, TrendingUp, ArrowUpRight, CheckCircle, Lock, Zap, BarChart2 } from 'lucide-react';
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
  const map = {
    halal:     { label: 'Halal',     bg: 'var(--halal-bg)',     color: 'var(--halal)',     border: 'var(--halal-border)'     },
    non_halal: { label: 'Non-Halal', bg: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'var(--non-halal-border)' },
    doubtful:  { label: 'Doubtful',  bg: 'var(--doubtful-bg)',  color: 'var(--doubtful)',  border: 'var(--doubtful-border)'  },
  };
  const s = map[verdict?.toLowerCase()] || map.doubtful;
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
  const [reports, setReports] = useState([]);
  const [news, setNews]       = useState([]);
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

  const statItems = stats ? [
    { label: 'Equities Screened',    value: stats.total_companies ?? stats.companies ?? 'Many', icon: BarChart2  },
    { label: 'Annual Reports Parsed', value: stats.total_reports  ?? stats.reports   ?? 'Many', icon: FileText   },
    { label: 'News Articles',         value: stats.total_news     ?? stats.news      ?? 'Many', icon: Globe      },
  ] : [];

  const features = [
    { icon: Shield,      title: 'AAOIFI Std. 21',  desc: 'Every screening strictly follows the globally recognised Islamic finance standard — no shortcuts, no approximations.' },
    { icon: Zap,         title: 'AI-Powered',       desc: 'Deep-learning models extract financial ratios from raw annual report PDFs in seconds, fully automatically.' },
    { icon: Lock,        title: 'Audit-Ready',      desc: 'Full methodology transparency with downloadable compliance records for institutional and retail investors alike.' },
    { icon: CheckCircle, title: 'Live Coverage',    desc: 'Nigerian equity market covered in real time, with re-screening triggered on every new regulatory filing.' },
  ];

  const pipeline = [
    { n: '01', title: 'Data Ingestion',    desc: 'Audited financial statements fetched from regulatory filings',        icon: Globe      },
    { n: '02', title: 'AI Extraction',     desc: 'Machine learning parses balance sheets and income statements',        icon: FileDigit  },
    { n: '03', title: 'AAOIFI Rules',      desc: 'Three-ratio test applied per AAOIFI Shariah Standard No. 21',        icon: Shield     },
    { n: '04', title: 'Verdict Published', desc: 'Halal / Doubtful / Non-Halal with a full, auditable trail',           icon: Sparkles   },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

      {/* ── HERO ────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(96px,14vw,152px) 20px clamp(80px,10vw,120px)', overflow: 'hidden' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15,82,87,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '5%', right: '2%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.055) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(32px)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,82,87,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--border-strong) 25%, var(--border-strong) 75%, transparent 100%)' }} />

        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          {/* Eyebrow badge */}
          <div className="animate-slide-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.22)', padding: '5px 16px', borderRadius: 40, color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2.5s infinite' }} />
            AAOIFI-Certified Shariah Screening
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up stagger-1" style={{ fontSize: 'clamp(2.5rem, 6.5vw, 5.2rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', color: 'var(--text-dark)', marginBottom: 24 }}>
            The Intelligent Platform<br />
            for{' '}
            <span style={{ background: 'linear-gradient(120deg, var(--primary) 10%, #22c5b0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Islamic Investing
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-slide-up stagger-2" style={{ fontSize: 'clamp(1rem, 1.9vw, 1.18rem)', color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: 580, margin: '0 auto 48px', fontWeight: 400 }}>
            Irshad screens Nigerian equities against rigorous AAOIFI standards using AI — so you know exactly what you own, and whether it is permissible.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up stagger-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link to="/market" className="btn-primary hover-lift" style={{ padding: '15px 36px', fontSize: '0.95rem', borderRadius: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 28px rgba(15,82,87,0.22)', textDecoration: 'none' }}>
              Explore Equities <ArrowRight size={17} />
            </Link>
            <Link to="/shariah" style={{ padding: '15px 36px', fontSize: '0.95rem', borderRadius: 13, fontWeight: 600, color: 'var(--text-body)', border: '1px solid var(--border-strong)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.25s, color 0.25s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-body)'; }}>
              Our Methodology
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-slide-up stagger-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: Shield,      text: 'AAOIFI Std. 21' },
              { icon: CheckCircle, text: 'Halal Verified'  },
              { icon: Lock,        text: 'Fully Auditable'  },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <b.icon size={13} color="var(--primary)" />
                {b.text}
                {i < 2 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-strong)', marginLeft: 24 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEARCH ────────────────────────────── */}
      <div style={{ padding: '0 20px', marginTop: 'clamp(32px,5vw,48px)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: '7px 7px 7px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'box-shadow 0.3s, border-color 0.3s' }}
            onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,82,87,0.1), 0 4px 20px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlurCapture={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
            <SearchIcon size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ticker or company name…"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 500, padding: '10px 0', minWidth: 0 }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 26px', borderRadius: 11, fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                Analyse
              </button>
            </form>
          </div>
          {/* Quick picks */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.5px' }}>Popular:</span>
            {['DANGCEM', 'ZENITHBANK', 'MTNN', 'GTCO', 'AIRTELAFRI'].map(t => (
              <button key={t} onClick={() => navigate(`/market/${t}`)} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ───────────────────────── */}
      <div style={{ padding: 'clamp(40px,7vw,72px) 20px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
          {loading
            ? [0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 108 }} />)
            : statItems.map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ padding: '28px 32px', background: 'var(--bg)', borderRight: i < statItems.length - 1 ? '1px solid var(--border-strong)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 10 }}>
                    <s.icon size={13} /> {s.label}
                  </div>
                  <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1.5px' }}>
                    <AnimatedNumber value={s.value} />
                    <span style={{ fontSize: '1.2rem', color: 'var(--primary)', marginLeft: 2, fontWeight: 700 }}>+</span>
                  </div>
                </div>
              </Reveal>
            ))}
        </div>
      </div>

      {/* ── MAIN ──────────────────────────────── */}
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: 'clamp(56px,9vw,96px) 20px clamp(72px,12vw,120px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(56px,9vw,96px)' }}>

        {/* Live Data Grid */}
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>

            {/* Live Screenings */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 22, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.25s, border-color 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(15,82,87,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--halal)', boxShadow: '0 0 0 3px var(--halal-bg)', animation: 'pulse 3s infinite' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>Live Screenings</span>
                </div>
                <Link to="/market" style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', transition: 'gap 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.gap = '6px'}
                  onMouseLeave={e => e.currentTarget.style.gap = '3px'}>
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>
              <div>
                {loading
                  ? [0,1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 60, margin: '8px 14px', borderRadius: 9 }} />)
                  : recent.slice(0, 6).map((co, i) => (
                    <Link key={co.id} to={`/market/${co.symbol}`} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 24px', borderBottom: i < Math.min(recent.length, 6) - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'background 0.15s', background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <CompanyAvatar symbol={co.symbol} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-dark)', letterSpacing: '-0.1px' }}>{co.symbol}</div>
                        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{co.name}</div>
                      </div>
                      <StatusPill verdict={co.verdict} />
                      <ChevronRight size={12} color="var(--text-light)" style={{ flexShrink: 0, marginLeft: 4 }} />
                    </Link>
                  ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Reports */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 22 }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <FileText size={15} color="var(--gold)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Audited Reports</span>
                </div>
                <div>
                  {loading
                    ? [0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 54, margin: '8px 14px', borderRadius: 9 }} />)
                    : reports.slice(0, 4).map((rep, i) => (
                      <div key={rep.id} style={{ padding: '13px 26px', borderBottom: i < Math.min(reports.length, 4) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{rep.type}</div>
                        </div>
                        <span style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--gold)', background: 'var(--gold-50)', border: '1px solid var(--gold-border)', padding: '3px 9px', borderRadius: 7, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          FY {rep.year}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* News */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 22 }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <TrendingUp size={15} color="var(--review)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Market Intelligence</span>
                </div>
                <div>
                  {loading
                    ? [0,1].map(i => <div key={i} className="skeleton" style={{ height: 78, margin: '8px 14px', borderRadius: 9 }} />)
                    : news.slice(0, 3).map((item, i) => (
                      <div key={item.id} style={{ padding: '14px 26px', borderBottom: i < Math.min(news.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-50)', padding: '2px 8px', borderRadius: 5 }}>{item.symbol}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.headline}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Features Grid */}
        <Reveal delay={0.05}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'clamp(48px,8vw,72px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>Why Irshad</div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.8px', lineHeight: 1.15, maxWidth: 500, margin: 0 }}>
                  Built for the serious<br />Muslim investor
                </h2>
              </div>
              <Link to="/market" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', textDecoration: 'none', transition: 'gap 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.gap = '8px'}
                onMouseLeave={e => e.currentTarget.style.gap = '5px'}>
                Start for free <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', border: '1px solid var(--border-strong)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {features.map((f, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div style={{
                    padding: '36px 30px',
                    background: 'var(--bg)',
                    borderRight: i % 2 === 0 ? '1px solid var(--border-strong)' : 'none',
                    borderBottom: i < 2 ? '1px solid var(--border-strong)' : 'none',
                    transition: 'background 0.22s',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 20, border: '1px solid var(--primary-100)' }}>
                      <f.icon size={19} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)', marginBottom: 9, letterSpacing: '-0.2px' }}>{f.title}</div>
                    <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Pipeline */}
        <Reveal delay={0.05}>
          <div style={{ background: 'var(--bg-section)', borderRadius: 26, padding: 'clamp(36px,6vw,60px)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 10 }}>Methodology</div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.7px', lineHeight: 1.2, margin: 0 }}>
                  How the screening works
                </h2>
              </div>
              <Link to="/shariah" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', textDecoration: 'none' }}>
                Full methodology <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 14 }}>
              {pipeline.map((s, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 17, padding: '26px 22px', border: '1px solid var(--border-strong)' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '1px', marginBottom: 14 }}>{s.n}</div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary) 0%, #22c5b0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 14, boxShadow: '0 5px 14px rgba(15,82,87,0.22)' }}>
                    <s.icon size={17} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-dark)', marginBottom: 7 }}>{s.title}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* CTA Banner */}
        <Reveal delay={0.04}>
          <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'linear-gradient(130deg, #0A3236 0%, #0F5257 50%, #0C4449 100%)', padding: 'clamp(44px,7vw,76px)', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 24px 48px rgba(15,82,87,0.18)' }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', right: -80, top: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: -60, bottom: -100, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Radial spotlight */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', maxWidth: 540 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(212,175,55,0.9)', border: '1px solid rgba(212,175,55,0.2)', padding: '4px 13px', borderRadius: 20, marginBottom: 18 }}>
                <Shield size={11} />
                AAOIFI Standard No. 21
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 900, color: 'white', letterSpacing: '-1.2px', lineHeight: 1.12, marginBottom: 16 }}>
                Invest with conviction.<br />Screen with precision.
              </h2>
              <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.72, margin: 0, maxWidth: 440 }}>
                Every ratio. Every ruling. Every company — rigorously checked so you never have to guess.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', minWidth: 200 }}>
              <Link to="/market" className="hover-lift" style={{ padding: '14px 32px', background: 'white', color: 'var(--primary)', fontWeight: 800, fontSize: '0.92rem', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', textDecoration: 'none' }}>
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
