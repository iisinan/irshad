import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Search, FileText, Globe, Activity, FileDigit, BarChart, ChevronRight, Sparkles, TrendingUp, Search as SearchIcon, ArrowUpRight } from 'lucide-react';
import { fetchOverviewStats, fetchRecentScreenings, fetchLatestReports, fetchBusinessNewsOverview } from '../services/api';
import Footer from './Footer';

// Company Avatar helper
const CompanyAvatar = ({ symbol, size = 40 }) => {
  const [error, setError] = useState(false);
  const letter = (symbol || '').substring(0, 2).toUpperCase();
  const radius = size * 0.25;

  if (error || !symbol) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: 'var(--primary-50)', color: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.4, border: '1px solid var(--primary-100)'
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
      style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'contain', background: 'white', border: '1px solid var(--border)'
      }}
    />
  );
};

const RevealOnScroll = ({ children, delay = 0, style = {} }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={domRef} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
};

const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const endValue = typeof value === 'string' && !isNaN(parseInt(value)) ? parseInt(value) : (typeof value === 'number' ? value : null);
    if (endValue === null) {
      setCount(value);
      return;
    }
    const duration = 1500;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * endValue));
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(value);
    };
    window.requestAnimationFrame(step);
  }, [value, isVisible]);

  return <span ref={domRef}>{count}</span>;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [reports, setReports] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, recentRes, reportsRes, newsRes] = await Promise.all([
          fetchOverviewStats(),
          fetchRecentScreenings(),
          fetchLatestReports(),
          fetchBusinessNewsOverview()
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data);
        setReports(reportsRes.data);
        setNews(newsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate('/market', { state: { query: search.trim() } });
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* 1. Hero Section - Deep Rich Aesthetics */}
      <section style={{ 
        position: 'relative', 
        padding: '160px 20px 140px', 
        textAlign: 'center',
        background: 'radial-gradient(100% 120% at 50% 0%, rgba(15,82,87,0.08) 0%, var(--bg) 100%)',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)', animation: 'pulse 8s infinite alternate'
        }} />
        <div style={{
          position: 'absolute', top: '20%', left: '20%',
          width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(30px)', animation: 'float 12s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'linear-gradient(var(--text-dark) 1px, transparent 1px), linear-gradient(90deg, var(--text-dark) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <div className="animate-slide-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(212,175,55,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.3)', padding: '8px 20px', borderRadius: '40px', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '0.5px' }}>
            <Sparkles size={16} /> The Gold Standard in Islamic Finance
          </div>
          
          <h1 className="animate-slide-up stagger-1" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: '28px' }}>
            Wealth Creation, <br />
            <span style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #2DD4BF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontStyle: 'italic', paddingRight: '8px'
            }}>Purified.</span>
          </h1>
          
          <p className="animate-slide-up stagger-2" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto 48px', fontWeight: 500 }}>
            Harness the power of AI to screen Nigerian equities against rigorous AAOIFI Shariah standards. Precision analytics for the discerning Muslim investor.
          </p>
          
          <div className="animate-slide-up stagger-3" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/market" className="btn-primary hover-lift" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '16px', boxShadow: '0 8px 32px rgba(15,82,87,0.25)' }}>
              Explore the Market <ArrowRight size={20} />
            </Link>
            <Link to="/shariah" className="btn-secondary hover-lift" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)' }}>
              Our Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Glassmorphic Search Section */}
      <section className="animate-slide-up stagger-4" style={{ padding: '0 20px', transform: 'translateY(-50px)', position: 'relative', zIndex: 10 }}>
        <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', borderRadius: '24px', padding: '12px 12px 12px 28px', display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'box-shadow 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 60px rgba(15,82,87,0.15)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)'}>
          <SearchIcon size={28} color="var(--primary)" style={{ marginRight: '16px', opacity: 0.8 }} />
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company name or ticker symbol..."
              style={{ flex: 1, minWidth: '200px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-dark)', fontWeight: 500, padding: '10px 0' }}
            />
            <button type="submit" className="btn-primary hover-lift" style={{ padding: '14px 32px', borderRadius: '16px', fontSize: '1rem', background: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
              Analyze
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '40px 20px 100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '80px' }}>
        
        {/* 3. Market Overview Cards */}
        <RevealOnScroll>
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { title: 'Equities Tracked', value: stats?.totalTracked || 156, icon: Activity, gradient: 'linear-gradient(135deg, #0F5257 0%, #14B8A6 100%)' },
              { title: 'Financials Audited', value: stats?.annualReportsProcessed || 142, icon: FileText, gradient: 'linear-gradient(135deg, #D4AF37 0%, #F0DB9A 100%)' },
              { title: 'News Signals', value: stats?.newsAnalyzed || 384, icon: Globe, gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)' },
              { title: 'Compliance Standard', value: 'AAOIFI 21', icon: Shield, gradient: 'linear-gradient(135deg, #0B1521 0%, #334155 100%)' }
            ].map((stat, i) => (
              <div key={i} className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: stat.gradient, opacity: 0.05, borderRadius: '50%', transform: 'translate(30%, -30%)' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <stat.icon size={24} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.title}</span>
                </div>
                {loading ? (
                  <div className="skeleton" style={{ height: '48px', width: '60%', borderRadius: '12px' }} />
                ) : (
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1px' }}>
                    <AnimatedNumber value={stat.value} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        </RevealOnScroll>

        {/* 4. Dashboard Grid: Recent & Reports */}
        <RevealOnScroll delay={0.1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '40px' }}>
          
          {/* Recently Screened */}
          <section className="glass-panel" style={{ borderRadius: '32px', padding: '40px', border: '1px solid var(--border-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}><TrendingUp size={24} /></div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>Live Screenings</h2>
              </div>
              <Link to="/market" className="hover-link" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                View Market <ArrowUpRight size={16} />
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '20px' }} />)
              ) : (
                recent.map(company => (
                  <Link key={company.id} to={`/market/${company.symbol}`} className="hover-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <CompanyAvatar symbol={company.symbol} size={50} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.1rem', marginBottom: '4px' }}>{company.symbol}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', fontWeight: 500 }}>{company.name}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, background: 'var(--bg-alt)', padding: '6px 12px', borderRadius: '20px', letterSpacing: '0.5px' }}>AAOIFI</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Latest Annual Reports */}
            <section className="glass-panel" style={{ borderRadius: '32px', padding: '40px', border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(212,175,55,0.1)', padding: '12px', borderRadius: '16px', color: 'var(--gold)' }}><FileText size={24} /></div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>Audited Reports</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '20px' }} />)
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="hover-lift" style={{ padding: '20px', background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem' }}>{report.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 800, background: 'rgba(212,175,55,0.1)', padding: '4px 10px', borderRadius: '8px' }}>FY {report.year}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{report.type}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Analyzed {new Date(report.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Impactful News */}
            <section className="glass-panel" style={{ borderRadius: '32px', padding: '40px', border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '16px', color: '#3b82f6' }}><Globe size={24} /></div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>Market Intelligence</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {loading ? (
                  Array(2).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '20px' }} />)
                ) : (
                  news.map(item => (
                    <div key={item.id} className="hover-lift" style={{ background: 'var(--bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 12px', borderRadius: '8px' }}>{item.symbol}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.source} • {new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px', lineHeight: 1.4 }}>{item.headline}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
        </RevealOnScroll>

        {/* 5. Process Section */}
        <RevealOnScroll delay={0.2}>
        <section style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(15,82,87,0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
            How It Works
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', letterSpacing: '-1px' }}>The Intelligence Pipeline</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 60px', lineHeight: 1.6 }}>From raw financial data to verified Shariah compliance, fully automated and strictly adhering to AAOIFI guidelines.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '24px' }}>
            {[
              { step: '1', title: 'Data Ingestion', desc: 'Fetching audited statements & activities', icon: Globe },
              { step: '2', title: 'AI Extraction', desc: 'Deep parsing of debt & assets', icon: FileDigit },
              { step: '3', title: 'AAOIFI Rules', desc: 'Applying strict compliance ratios', icon: Shield },
              { step: '4', title: 'Final Verdict', desc: 'Publishing actionable insights', icon: Sparkles }
            ].map((s, i) => (
              <div key={s.step} className="glass-panel hover-lift" style={{ borderRadius: '24px', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '4rem', fontWeight: 900, color: 'var(--bg-section)', opacity: 0.5, lineHeight: 1, zIndex: 0 }}>
                  {s.step}
                </div>
                <div style={{ position: 'relative', zIndex: 1, width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary) 0%, #2DD4BF 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 12px 24px rgba(15,82,87,0.25)' }}>
                  <s.icon size={28} />
                </div>
                <h4 style={{ position: 'relative', zIndex: 1, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>{s.title}</h4>
                <p style={{ position: 'relative', zIndex: 1, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
        </RevealOnScroll>

        {/* 6. AAOIFI Banner */}
        <RevealOnScroll delay={0.3}>
        <section className="glass-panel hover-lift" style={{ 
          background: 'linear-gradient(135deg, rgba(15,82,87,0.95) 0%, rgba(10,63,67,0.95) 100%)', 
          borderRadius: '32px', padding: 'clamp(32px, 6vw, 64px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px',
          boxShadow: '0 24px 48px rgba(15,82,87,0.2)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ position: 'absolute', right: '-5%', top: '-30%', opacity: 0.08, transform: 'scale(1.5)', pointerEvents: 'none' }}>
            <Shield size={500} color="white" />
          </div>
          
          <div style={{ flex: '1 1 500px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-block', background: 'rgba(212,175,55,0.2)', color: '#F0DB9A', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
              AAOIFI Standard No. 21
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '24px', letterSpacing: '-1px', lineHeight: 1.2 }}>Uncompromising Integrity.</h2>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '40px' }}>
              The Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) sets the global standard. Irshad ensures every equity analysis strictly abides by these rules.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link to="/shariah" className="btn-primary hover-lift" style={{ background: 'white', color: 'var(--primary)', padding: '16px 32px', fontSize: '1.05rem', borderRadius: '16px' }}>Explore Standards</Link>
            </div>
          </div>
        </section>
        </RevealOnScroll>

      </div>
      
      <Footer />
    </div>
  );
}
