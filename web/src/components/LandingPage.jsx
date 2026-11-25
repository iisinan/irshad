import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  Calculator,
  CheckCircle2,
  FileDigit,
  FileText,
  Globe,
  Lock,
  Search as SearchIcon,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  fetchBusinessNewsOverview,
  fetchLatestReports,
  fetchOverviewStats,
  fetchRecentScreenings,
  searchStocks,
} from '../services/api';
import Footer from './Footer';
import LaunchCountdown from './LaunchCountdown';
import './LandingPage.css';

// ─── Helpers ──────────────────────────────────────────────────

const QUICK_TICKERS = ['DANGCEM', 'MTNN', 'BUACEMENT', 'SEPLAT', 'ARADEL'];

const HERO_RULES = [
  { threshold: '≤ 30%', label: 'Debt / Mkt Cap' },
  { threshold: '≤ 30%', label: 'Interest Cash / Mkt Cap' },
  { threshold: '≤ 5%', label: 'Impure Revenue' },
];

const CompanyAvatar = ({ symbol, logoUrl, size = 40 }) => {
  const [error, setError] = useState(false);
  const letter = (symbol || '').substring(0, 2).toUpperCase();
  const radius = Math.round(size * 0.24);

  if (error || !logoUrl) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: 'var(--primary-50)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: size * 0.36,
          border: '1px solid var(--primary-100)',
          flexShrink: 0,
        }}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt=""
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'contain',
        background: '#FFFFFF',
        border: '1px solid var(--lp-hairline)',
        flexShrink: 0,
      }}
    />
  );
};

const StatusPill = ({ verdict }) => {
  const rawStatus = typeof verdict === 'object' ? verdict?.status : verdict;
  const purif = typeof verdict === 'object' ? verdict?.purification_required : false;
  const key = (rawStatus || 'doubtful').toLowerCase();

  const map = {
    halal: {
      label: purif ? 'Compliant · Purify' : 'Halal',
      bg: purif ? 'rgba(245, 158, 11, 0.14)' : 'var(--halal-bg)',
      color: purif ? '#D97706' : 'var(--halal)',
      border: purif ? 'rgba(245, 158, 11, 0.35)' : 'var(--halal-border)',
    },
    compliant: {
      label: purif ? 'Compliant · Purify' : 'Halal',
      bg: purif ? 'rgba(245, 158, 11, 0.14)' : 'var(--halal-bg)',
      color: purif ? '#D97706' : 'var(--halal)',
      border: purif ? 'rgba(245, 158, 11, 0.35)' : 'var(--halal-border)',
    },
    non_compliant: {
      label: 'Non-Compliant',
      bg: 'var(--non-compliant-bg)',
      color: 'var(--non-compliant)',
      border: 'var(--non-compliant-border)',
    },
    'non-compliant': {
      label: 'Non-Compliant',
      bg: 'var(--non-compliant-bg)',
      color: 'var(--non-compliant)',
      border: 'var(--non-compliant-border)',
    },
    doubtful: {
      label: 'Doubtful',
      bg: 'var(--doubtful-bg)',
      color: 'var(--doubtful)',
      border: 'var(--doubtful-border)',
    },
  };

  const s = map[key] || map.doubtful;

  return (
    <span
      className="lp-status-pill"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
};

const useReveal = (threshold = 0.08) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
};

const Reveal = ({ children, delay = 0, className = '', style }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`lp-reveal ${className}`.trim()}
      data-reveal={visible ? 'visible' : 'hidden'}
      style={{ '--reveal-delay': `${delay}s`, ...style }}
    >
      {children}
    </div>
  );
};

const AnimatedNumber = ({ value }) => {
  const target = parseInt(value, 10) || 0;
  const [count, setCount] = useState(target);
  const [ref, visible] = useReveal();

  useEffect(() => {
    if (!visible) return undefined;
    if (!target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return undefined;
    }

    let rafId = 0;
    let start = null;
    const duration = 900;

    const tick = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, visible]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// ─── Main Landing Page ────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const searchInputId = useId();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [reports, setReports] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, rep, n] = await Promise.allSettled([
          fetchOverviewStats(),
          fetchRecentScreenings(),
          fetchLatestReports(),
          fetchBusinessNewsOverview(),
        ]);
        if (cancelled) return;
        if (s.status === 'fulfilled') setStats(s.value.data);
        if (r.status === 'fulfilled' && Array.isArray(r.value.data)) setRecent(r.value.data);
        if (rep.status === 'fulfilled' && Array.isArray(rep.value.data)) setReports(rep.value.data);
        if (n.status === 'fulfilled' && Array.isArray(n.value.data)) setNews(n.value.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchStocks(trimmed);
        const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setSearchResults(list.slice(0, 5));
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;

    const exact = searchResults.find(
      (item) => item.symbol?.toLowerCase() === trimmed.toLowerCase(),
    );
    const targetSymbol = exact?.symbol || searchResults[0]?.symbol;

    if (targetSymbol) {
      navigate(`/market/${encodeURIComponent(targetSymbol)}/aaoifi`);
      return;
    }

    if (/^[A-Za-z0-9.-]{2,12}$/.test(trimmed)) {
      navigate(`/market/${encodeURIComponent(trimmed.toUpperCase())}/aaoifi`);
      return;
    }

    navigate('/portfolio');
  };

  const uniqueRecent = Array.from(
    new Map(
      recent
        .filter((item) => item?.symbol)
        .map((item) => [item.symbol.toUpperCase(), item]),
    ).values(),
  );

  const statItems = [
    {
      label: 'Equities Screened',
      value: stats?.total_companies ?? stats?.companies ?? 0,
      suffix: '+',
      icon: BarChart2,
      color: 'var(--primary)',
    },
    {
      label: 'Halal Compliant',
      value: stats?.halal_count ?? 0,
      suffix: '',
      icon: CheckCircle2,
      color: 'var(--halal)',
    },
    {
      label: 'Filings Processed',
      value: stats?.total_reports ?? stats?.reports ?? 0,
      suffix: '+',
      icon: FileText,
      color: '#0D9488',
    },
    {
      label: 'Market Updates',
      value: stats?.total_news ?? stats?.news ?? 0,
      suffix: '+',
      icon: Globe,
      color: 'var(--gold)',
    },
  ];

  const pillars = [
    {
      icon: Shield,
      title: 'AAOIFI Standard 21 Engine',
      desc: 'Deterministic screening enforcing 30% interest debt, 30% interest cash, and 5% non-compliant revenue thresholds against live market capitalization.',
      linkLabel: 'Explore methodology',
      to: '/shariah',
    },
    {
      icon: Sparkles,
      title: 'Purification & Zakat Math',
      desc: 'Automatically isolate non-compliant income fractions for dividend cleansing and compute annual equity Zakat without spreadsheet guesswork.',
      linkLabel: 'Open portfolio tools',
      to: '/portfolio',
    },
    {
      icon: TrendingUp,
      title: 'Monthly Rizq Planner',
      desc: 'Model disciplined monthly NGX equity investing, reinvestment compounding, and Shariah-aligned wealth milestones in one workspace.',
      linkLabel: 'Try Rizq Planner',
      to: '/rizq-planner',
    },
    {
      icon: Lock,
      title: 'Auditable NGX Evidence',
      desc: 'Zero black-box verdicts. Every compliance status traces directly back to regulatory filings and quarterly statements from NGX Pulse.',
      linkLabel: 'View pricing & tiers',
      to: '/pricing',
    },
  ];

  const pipeline = [
    {
      n: '01',
      title: 'Regulatory Ingestion',
      desc: 'Audited annual reports and quarterly financial statements synced from NGX Pulse.',
      icon: Globe,
    },
    {
      n: '02',
      title: 'Business Purity Screen',
      desc: 'Sector and revenue screening excluding conventional interest banking, alcohol, and prohibited lines.',
      icon: Shield,
    },
    {
      n: '03',
      title: '30% / 5% Ratio Testing',
      desc: 'Strict quantitative checks dividing debt and interest cash against trailing market cap.',
      icon: FileDigit,
    },
    {
      n: '04',
      title: 'Verdict & Purification',
      desc: 'Instant Halal, Doubtful, or Non-Compliant verdict paired with dividend cleansing ratio.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="lp-page">
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-grid-bg" aria-hidden="true" />
        <div className="lp-container">
          <div className="lp-hero-grid">
            {/* Left: Narrative, Launch Countdown & Actions */}
            <div>
              <div className="lp-eyebrow">
                <span className="lp-live-dot" aria-hidden="true" />
                AAOIFI Standard 21 · Nigerian Exchange (NGX)
              </div>

              <h1 className="lp-hero-title">
                Clarity for every{' '}
                <span className="lp-hero-title-accent">Islamic investment</span>{' '}
                on the NGX.
              </h1>

              <p className="lp-hero-lead">
                Irshad screens Nigerian equities against rigorous AAOIFI rules, calculates exact
                dividend purification &amp; Zakat, and gives conscious Muslim investors source-backed
                certainty.
              </p>

              <div className="lp-countdown-slot">
                <LaunchCountdown variant="hero" />
              </div>

              <div className="lp-cta-row">
                <Link to="/portfolio" className="lp-btn lp-btn-primary">
                  Start Screening <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link to="/shariah" className="lp-btn lp-btn-secondary">
                  Shariah Methodology
                </Link>
              </div>

              <ul className="lp-trust-list">
                <li className="lp-trust-item">
                  <Shield size={15} aria-hidden="true" /> AAOIFI Standard 21
                </li>
                <li className="lp-trust-item">
                  <CheckCircle2 size={15} aria-hidden="true" /> Audited NGX Filings
                </li>
                <li className="lp-trust-item">
                  <Calculator size={15} aria-hidden="true" /> Purification &amp; Zakat
                </li>
              </ul>

              <div className="lp-store-row">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-store-badge"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div>
                    <div className="lp-store-caption">Download on the</div>
                    <div className="lp-store-name">App Store</div>
                  </div>
                </a>

                <a
                  href="https://play.google.com/store/apps/details?id=com.irshad.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-store-badge"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3.18 23.76c.3.17.64.24.99.19L14.54 12 3.18.05C2.83.0 2.49.07 2.19.24 1.6.57 1.25 1.22 1.25 2v20c0 .78.35 1.43.93 1.76z" fill="#EA4335" />
                    <path d="M22.45 10.29l-3.23-1.85L15.72 12l3.5 3.56 3.24-1.86c.93-.53.93-2.88-.01-3.41z" fill="#FBBC04" />
                    <path d="M3.18.05l11.36 11.96L18.1 8.44 5.11.34A2.04 2.04 0 003.18.05z" fill="#4285F4" />
                    <path d="M3.18 23.95c.6.36 1.35.32 1.93-.04l13-8.1-3.57-3.81L3.18 23.95z" fill="#34A853" />
                  </svg>
                  <div>
                    <div className="lp-store-caption">Get it on</div>
                    <div className="lp-store-name">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Live Screening Intelligence Terminal */}
            <div className="lp-hero-showcase">
              <div className="lp-terminal-card">
                <div className="lp-terminal-header">
                  <div className="lp-terminal-title-wrap">
                    <div className="lp-terminal-mark" aria-hidden="true">
                      <Shield size={18} />
                    </div>
                    <div style={{ minInlineSize: 0 }}>
                      <div className="lp-terminal-kicker">NGX Screening Feed</div>
                      <h2 className="lp-terminal-title">Live Shariah Verdicts</h2>
                    </div>
                  </div>
                  <span className="lp-terminal-pill">
                    <span className="lp-live-dot" aria-hidden="true" /> Rule 3/4/1
                  </span>
                </div>

                {/* Rule 3/4/1 Quantitative Thresholds */}
                <div className="lp-rule-strip" aria-label="AAOIFI quantitative screening thresholds">
                  {HERO_RULES.map((rule) => (
                    <div key={rule.label} className="lp-rule-box">
                      <div className="lp-rule-value">{rule.threshold}</div>
                      <div className="lp-rule-label">{rule.label}</div>
                    </div>
                  ))}
                </div>

                {/* Live API Recent Screenings */}
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="skeleton" style={{ height: 52, borderRadius: 12 }} />
                    ))}
                  </div>
                ) : uniqueRecent.length > 0 ? (
                  <ul className="lp-terminal-list">
                    {uniqueRecent.slice(0, 4).map((co) => (
                      <li key={co.id || co.symbol}>
                        <Link to={`/market/${co.symbol}/aaoifi`} className="lp-terminal-row">
                          <div className="lp-terminal-row-left">
                            <CompanyAvatar symbol={co.symbol} logoUrl={co.logo_url} size={34} />
                            <div style={{ minInlineSize: 0 }}>
                              <div className="lp-terminal-sym">{co.symbol}</div>
                              <div className="lp-terminal-name">{co.name}</div>
                            </div>
                          </div>
                          <StatusPill verdict={co.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1.25rem', borderRadius: 12, background: 'var(--lp-surface-subtle)', textAlign: 'center', color: 'var(--lp-muted)', fontSize: '0.84rem', marginBottom: '1rem' }}>
                    Search any NGX ticker below to inspect its AAOIFI screening breakdown.
                  </div>
                )}

                <div className="lp-terminal-footer">
                  <span>Click any equity for full ratio audit</span>
                  <Link to="/portfolio" className="lp-text-link">
                    All equities <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TELEMETRY, LIVE SEARCH & MARKET INTELLIGENCE ─────── */}
      <section className="lp-band">
        <div className="lp-container lp-band-stack">
          {/* 4-column Live Telemetry Strip */}
          <Reveal>
            <div className="lp-stats-bar">
              {statItems.map((s) => (
                <div key={s.label} className="lp-stat-cell">
                  <div className="lp-stat-head">
                    <s.icon size={15} color={s.color} aria-hidden="true" />
                    <span>{s.label}</span>
                  </div>
                  <div className="lp-stat-value">
                    <AnimatedNumber value={s.value} />
                    {s.suffix}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Instant Equity Search */}
          <Reveal delay={0.05}>
            <div className="lp-search-wrap">
              <div className="lp-search-shell">
                <SearchIcon size={19} color="var(--lp-muted)" aria-hidden="true" style={{ flexShrink: 0 }} />
                <form onSubmit={handleSearch} className="lp-search-form" role="search" aria-label="Screen an NGX stock">
                  <label htmlFor={searchInputId} className="visually-hidden">
                    Search by NGX ticker or company name
                  </label>
                  <input
                    id={searchInputId}
                    type="search"
                    className="lp-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Check compliance for any NGX stock (e.g. DANGCEM, MTNN)…"
                    autoComplete="off"
                  />
                  <button type="submit" className="lp-search-submit">
                    Screen Stock
                  </button>
                </form>
              </div>

              {(searching || searchResults.length > 0) && (
                <div className="lp-search-dropdown" aria-live="polite">
                  {searching && searchResults.length === 0 ? (
                    <div style={{ padding: '0.75rem 1rem', fontSize: '0.84rem', color: 'var(--lp-muted)' }}>
                      Searching NGX equities…
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <Link
                        key={item.id || item.symbol}
                        to={`/market/${encodeURIComponent(item.symbol)}/aaoifi`}
                        className="lp-search-result"
                      >
                        <div className="lp-terminal-row-left">
                          <CompanyAvatar symbol={item.symbol} size={32} />
                          <div style={{ minInlineSize: 0 }}>
                            <div className="lp-terminal-sym">{item.symbol}</div>
                            <div className="lp-terminal-name">
                              {item.name}
                              {item.sector ? ` · ${item.sector}` : ''}
                            </div>
                          </div>
                        </div>
                        <StatusPill verdict={item.status || item.current_status} />
                      </Link>
                    ))
                  )}
                </div>
              )}

              <div className="lp-search-chips">
                <span className="lp-search-chip-label">Popular:</span>
                {QUICK_TICKERS.map((ticker) => (
                  <Link
                    key={ticker}
                    to={`/market/${ticker}/aaoifi`}
                    className="lp-chip-link"
                  >
                    {ticker}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Recently Screened Cards + Latest Filings & Activity Pulse */}
          <Reveal delay={0.07}>
            <div>
              <div className="lp-section-head">
                <div>
                  <div className="lp-section-kicker">Market Pulse</div>
                  <h2 className="lp-section-title">Recently screened &amp; filings feed</h2>
                </div>
                <Link to="/portfolio" className="lp-text-link">
                  Open full screener <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <div className="lp-live-grid">
                {loading
                  ? [0, 1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ height: 112, borderRadius: 16 }} />
                    ))
                  : uniqueRecent.slice(0, 4).map((co) => (
                      <Link
                        key={co.id || co.symbol}
                        to={`/market/${co.symbol}/aaoifi`}
                        className="lp-equity-card"
                      >
                        <div className="lp-equity-top">
                          <CompanyAvatar symbol={co.symbol} logoUrl={co.logo_url} size={42} />
                          <StatusPill verdict={co.status} />
                        </div>
                        <div style={{ minInlineSize: 0 }}>
                          <div className="lp-equity-symbol">{co.symbol}</div>
                          <div className="lp-equity-name">{co.name}</div>
                        </div>
                      </Link>
                    ))}
              </div>

              {(reports.length > 0 || news.length > 0) && (
                <div className="lp-pulse-split">
                  {reports.length > 0 && (
                    <div className="lp-feed-panel">
                      <h3 className="lp-feed-title">
                        <FileText size={14} aria-hidden="true" /> Latest Audited Filings
                      </h3>
                      <ul className="lp-feed-list">
                        {reports.slice(0, 3).map((rep) => (
                          <li key={rep.id}>
                            <Link
                              to={
                                rep.company?.symbol
                                  ? `/market/${rep.company.symbol}/aaoifi`
                                  : '/portfolio'
                              }
                              className="lp-feed-item"
                            >
                              <div style={{ minInlineSize: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                  {rep.company?.symbol || 'NGX'}{' '}
                                  <span style={{ fontWeight: 500, color: 'var(--lp-muted)' }}>
                                    — {rep.company?.name || 'Filing Update'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--lp-muted)', marginTop: 2 }}>
                                  {rep.reporting_period || 'Audited Statement'}
                                </div>
                              </div>
                              <ArrowRight size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 4 }} aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {news.length > 0 && (
                    <div className="lp-feed-panel">
                      <h3 className="lp-feed-title">
                        <Globe size={14} aria-hidden="true" /> Corporate Disclosures
                      </h3>
                      <ul className="lp-feed-list">
                        {news.slice(0, 3).map((item) => (
                          <li key={item.id}>
                            <Link
                              to={
                                item.company?.symbol
                                  ? `/market/${item.company.symbol}/aaoifi`
                                  : '/resources'
                              }
                              className="lp-feed-item"
                            >
                              <div style={{ minInlineSize: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                  {item.company?.symbol || 'NGX'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--lp-muted)', lineHeight: 1.45, marginTop: 2 }}>
                                  {item.summary || item.activity_type || 'Business activity disclosure tracked.'}
                                </div>
                              </div>
                              <ArrowRight size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 4 }} aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHY IRSHAD: 4 CORE PILLARS ──────────────────────── */}
      <section className="lp-band" style={{ paddingBlockStart: 0 }}>
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div>
                <div className="lp-section-kicker">Why Irshad</div>
                <h2 className="lp-section-title">Built for serious Islamic investing</h2>
                <p className="lp-section-desc">
                  Automated AAOIFI compliance, dividend purification, and planning tools designed
                  around Nigerian equities.
                </p>
              </div>
              <Link to="/register" className="lp-text-link">
                Create free account <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div className="lp-bento-grid">
              {pillars.map((pillar, i) => (
                <article key={pillar.title} className="lp-feature-card">
                  <div className="lp-feature-top">
                    <div className="lp-icon-badge" aria-hidden="true">
                      <pillar.icon size={20} />
                    </div>
                    <span className="lp-step-num">0{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="lp-feature-title">{pillar.title}</h3>
                    <p className="lp-feature-desc">{pillar.desc}</p>
                  </div>
                  <Link to={pillar.to} className="lp-text-link" style={{ fontSize: '0.84rem' }}>
                    {pillar.linkLabel} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PORTFOLIO & PLANNING WORKSPACES ────────────────── */}
      <section className="lp-band" style={{ paddingBlockStart: 0 }}>
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div>
                <div className="lp-section-kicker">Wealth Tools</div>
                <h2 className="lp-section-title">Everything you need to invest halal</h2>
              </div>
            </div>

            <div className="lp-audience-grid">
              <div className="lp-audience-card">
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                    <Shield size={15} aria-hidden="true" /> Portfolio &amp; Purification
                  </div>
                  <h3 className="lp-feature-title" style={{ fontSize: '1.3rem' }}>
                    Screen, track, and cleanse your holdings
                  </h3>
                  <ul className="lp-audience-list">
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Track NGX holdings, curated Halal thematic baskets, and dividend cleansing.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Automated annual equity Zakat calculation built into your portfolio dashboard.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Receive watchlist alerts whenever a quarterly filing changes compliance status.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Link to="/portfolio" className="lp-btn lp-btn-primary">
                    Launch Portfolio <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/pricing" className="lp-btn lp-btn-secondary">
                    Compare Plans
                  </Link>
                </div>
              </div>

              <div className="lp-audience-card lp-audience-card--inst">
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                    <TrendingUp size={15} aria-hidden="true" /> Monthly Rizq Planner
                  </div>
                  <h3 className="lp-feature-title" style={{ fontSize: '1.3rem' }}>
                    Compound halal wealth on autopilot
                  </h3>
                  <ul className="lp-audience-list">
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Plan recurring monthly NGX contributions anchored to Shariah-compliant equities.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Compare dividend reinvestment schedules and long-term compounding milestones.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Invest alongside curated halal baskets with transparent AAOIFI screening backing.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Link to="/rizq-planner" className="lp-btn lp-btn-gold">
                    Open Rizq Planner <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── METHODOLOGY PIPELINE ────────────────────────────── */}
      <section className="lp-band" style={{ paddingBlockStart: 0 }}>
        <div className="lp-container">
          <Reveal>
            <div className="lp-pipeline-shell">
              <div className="lp-pipeline-head">
                <div className="lp-section-head" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="lp-section-kicker">Methodology</div>
                    <h2 className="lp-section-title">How every verdict is produced</h2>
                  </div>
                  <Link to="/shariah" className="lp-text-link">
                    Read AAOIFI Std. 21 rules <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <ol className="lp-pipeline-list">
                {pipeline.map((step) => (
                  <li key={step.n} className="lp-pipeline-step">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="lp-icon-badge" aria-hidden="true">
                        <step.icon size={19} />
                      </div>
                      <span className="lp-pipeline-index" aria-hidden="true">{step.n}</span>
                    </div>
                    <h3 className="lp-feature-title" style={{ marginTop: '0.35rem' }}>{step.title}</h3>
                    <p className="lp-feature-desc">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HIGH-CONTRAST EMERALD CTA BANNER ────────────────── */}
      <section className="lp-band" style={{ paddingBlockStart: 0 }}>
        <div className="lp-container">
          <Reveal>
            <div className="lp-cta-banner">
              <div>
                <div className="lp-cta-kicker">
                  <Shield size={13} aria-hidden="true" />
                  Public Launch · December 1, 2026
                </div>
                <h2 className="lp-cta-title">
                  Invest with conviction.
                  <br />
                  Screen with precision.
                </h2>
                <p className="lp-cta-copy">
                  Every ratio, every ruling, and every filing verified so you can compound halal
                  wealth across Nigerian markets with peace of mind.
                </p>
              </div>

              <div className="lp-cta-actions">
                <Link to="/register" className="lp-btn lp-btn-primary">
                  Get Started Free <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/shariah" className="lp-btn lp-cta-btn-outline">
                  Read Methodology
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
