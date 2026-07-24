import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Search, CheckCircle2, AlertCircle, HelpCircle, FileText, Globe, Activity, FileDigit, BarChart, ChevronRight } from 'lucide-react';
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

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'halal': return { label: 'Halal', color: 'var(--halal)', bg: 'var(--halal-bg)', icon: <CheckCircle2 size={14} /> };
      case 'non-halal': return { label: 'Non-Halal', color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', icon: <AlertCircle size={14} /> };
      default: return { label: 'Under Review', color: 'var(--doubtful)', bg: 'var(--doubtful-bg)', icon: <HelpCircle size={14} /> };
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '140px 20px 100px', 
        textAlign: 'center',
        background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-section) 100%)',
        overflow: 'hidden'
      }}>
        {/* Subtle animated pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(var(--text-dark) 1px, transparent 1px), linear-gradient(90deg, var(--text-dark) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none', zIndex: 0
        }} />
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', padding: '8px 16px', borderRadius: '40px', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
            <Shield size={14} /> Official AAOIFI Standard Screener
          </div>
          
          <h1 className="fade-in" style={{ animationDelay: '0.1s', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '24px' }}>
            AI-Powered AAOIFI Shariah Stock Screening for Nigerian Stocks
          </h1>
          
          <p className="fade-in" style={{ animationDelay: '0.2s', fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 40px', fontWeight: 500 }}>
            Screen Nigerian listed companies using AI, audited financial statements, business activity analysis, and AAOIFI standards to help investors make informed Islamic investment decisions.
          </p>
          
          <div className="fade-in" style={{ animationDelay: '0.3s', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/market" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1rem', borderRadius: '12px' }}>
              Browse Stocks
            </Link>
            <Link to="/shariah" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1rem', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              Learn Our Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Search Section */}
      <section style={{ padding: '0 20px', transform: 'translateY(-30px)', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--bg)', borderRadius: '20px', padding: '12px 12px 12px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <Search size={22} color="var(--text-light)" style={{ marginRight: '16px' }} />
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex' }}>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company name or ticker (e.g., DANGSUGAR, MTNN)"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', color: 'var(--text-dark)' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', marginLeft: '12px' }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px', width: '100%', display: 'flex', flexDirection: 'column', gap: '60px' }}>
        
        {/* 3. Market Overview Cards */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Total Companies Tracked', value: stats?.totalTracked, icon: Activity, color: 'var(--text-dark)', loading },
              { title: 'Shariah Compliant', value: stats?.shariahCompliant, icon: CheckCircle2, color: 'var(--halal)', loading },
              { title: 'Non-Compliant', value: stats?.nonCompliant, icon: AlertCircle, color: 'var(--non-halal)', loading },
              { title: 'Under Review', value: stats?.underReview, icon: HelpCircle, color: 'var(--doubtful)', loading }
            ].map((stat, i) => (
              <div key={i} className="fade-in" style={{ animationDelay: `${i * 0.1}s`, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--text-muted)' }}>
                  <stat.icon size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stat.title}</span>
                </div>
                {stat.loading ? (
                  <div className="skeleton" style={{ height: '40px', width: '60%', borderRadius: '8px' }} />
                ) : (
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recently Screened Companies & 5. Latest Annual Reports */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          <section style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Recently Screened</h2>
              <Link to="/market" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '16px' }} />)
              ) : (
                recent.map(company => {
                  const status = getStatusConfig(company.status);
                  return (
                    <div key={company.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <CompanyAvatar symbol={company.symbol} size={44} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{company.symbol}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{company.name}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {status.icon} {status.label}
                        </div>
                        <Link to={`/market/${company.symbol}`} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.7rem' }}>View Details</Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--primary-50)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}><FileText size={20} /></div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Latest Annual Reports</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)
                ) : (
                  reports.map(report => (
                    <div key={report.id} style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{report.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FY {report.year}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>{report.type}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{new Date(report.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 6. Business News */}
            <section style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}><Globe size={20} /></div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Impactful Business News</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {loading ? (
                  Array(2).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)
                ) : (
                  news.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dark)', background: 'var(--bg-section)', padding: '2px 8px', borderRadius: '4px' }}>{item.symbol}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.source} • {new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px', lineHeight: 1.4 }}>{item.headline}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{item.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 7. How Irshad Works */}
        <section style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '40px' }}>The Screening Process</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            {[
              { step: '1', title: 'Business Activity', desc: 'Analyzing revenue sources for non-halal activities', icon: BarChart },
              { step: '2', title: 'Audited Financials', desc: 'Fetching official financial statements', icon: FileText },
              { step: '3', title: 'AI Extraction', desc: 'Extracting key debt & asset data', icon: Activity },
              { step: '4', title: 'AAOIFI Ratios', desc: 'Calculating compliance metrics', icon: FileDigit },
              { step: '5', title: 'Final Verdict', desc: 'Publishing Shariah status', icon: Shield }
            ].map((s, i, arr) => (
              <React.Fragment key={s.step}>
                <div style={{ width: '180px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <s.icon size={24} />
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>{s.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</p>
                </div>
                {i < arr.length - 1 && <ChevronRight size={24} color="var(--border)" style={{ opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* 8. About AAOIFI */}
        <section style={{ background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg) 100%)', border: '1px solid var(--primary-50)', borderRadius: '24px', padding: '40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '16px' }}>Driven by AAOIFI Standards</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-dark)', lineHeight: 1.6, marginBottom: '24px', opacity: 0.8 }}>
              The Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) is the leading international body setting Shariah standards for global Islamic finance. Irshad strictly follows AAOIFI standard No. 21 to determine stock compliance.
            </p>
            <Link to="/shariah" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '10px' }}>Read Our Methodology</Link>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
            <Shield size={120} color="var(--primary)" style={{ opacity: 0.2 }} />
          </div>
        </section>

        {/* 9. Platform Statistics */}
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '60px', paddingBottom: '20px' }}>
          <h3 style={{ textAlign: 'center', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '32px' }}>Platform Activity Metrics</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {[
              { label: 'Companies Monitored', val: stats?.totalTracked || 0 },
              { label: 'Annual Reports Processed', val: stats?.annualReportsProcessed || 0 },
              { label: 'News Articles Analyzed', val: stats?.newsAnalyzed || 0 },
              { label: 'Last Data Refresh', val: stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...' }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)' }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
      
      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
