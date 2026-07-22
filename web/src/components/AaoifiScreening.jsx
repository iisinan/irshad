import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, 
  HelpCircle, ShieldCheck, ChevronRight, FileText, Brain, Download
} from 'lucide-react';
import { fetchAaoifiScreening } from '../services/api';

const LOADING_STEPS = [
  "Initializing AAOIFI Screening...",
  "Reading latest financial statements...",
  "Fetching regulatory filings...",
  "Searching latest company news...",
  "Analyzing business activities...",
  "Consulting Gemini AI...",
  "Calculating AAOIFI financial ratios...",
  "Running compliance engine...",
  "Generating transparent report..."
];

const AaoifiScreening = () => {
  const { symbol } = useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  
  const [stepIndex, setStepIndex] = useState(0);
  const [modalData, setModalData] = useState(null);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [denominator, setDenominator] = useState('market_cap');

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setStepIndex(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchAaoifiScreening(symbol);
        if (res.success) {
          setStepIndex(LOADING_STEPS.length - 1);
          setTimeout(() => {
            setReport(res.data);
            setLoading(false);
          }, 800);
        } else {
          throw new Error('Failed to load screening data');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  const formatNumber = (val) => {
    if (!val) return '0';
    const num = parseFloat(val);
    if (isNaN(num)) return '0';
    if (num > 1000000000) return (num / 1000000000).toFixed(2) + ' Billion';
    if (num > 1000000) return (num / 1000000).toFixed(2) + ' Million';
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openModal = (title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal) => {
    setModalData({
      title,
      ratio: parseFloat(ratio) || 0,
      threshold,
      formula,
      numLabel,
      numVal,
      denLabel,
      denVal
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--border-light)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <ShieldCheck size={32} color="var(--primary)" />
          </div>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>Institutional AAOIFI Analysis</h2>
        <div style={{ height: '30px', position: 'relative', overflow: 'hidden' }}>
          <p key={stepIndex} className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {LOADING_STEPS.map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: i === stepIndex ? '12px' : '8px', 
                height: i === stepIndex ? '12px' : '8px', 
                borderRadius: '50%', 
                background: i <= stepIndex ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s ease'
              }} 
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--non-halal)" style={{ margin: '0 auto 16px' }} />
        <h2>Screening Error</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <Link to={`/market/${symbol}`} className="btn-primary" style={{ display: 'inline-block', marginTop: '24px' }}>
          Back to {symbol}
        </Link>
      </div>
    );
  }

  if (!report) return null;
  const fd = report.financial_data_used || {};
  const totalAssets = parseFloat(fd.total_assets) || 0;
  const marketCap = parseFloat(fd.market_cap) || 0;
  const totalDebt = parseFloat(fd.total_debt) || 0;
  const cashAndSecurities = (parseFloat(fd.cash) || 0) + (parseFloat(fd.interest_bearing_securities) || 0);
  const illiquidAssets = parseFloat(fd.illiquid_assets) || 0;

  const denVal = denominator === 'total_assets' ? totalAssets : marketCap;
  const denLabel = denominator === 'total_assets' ? 'Total Assets' : 'Market Cap';

  let debtRatio = null;
  let debtStatus = 'insufficient_data';
  if (denVal > 0) {
    debtRatio = (totalDebt / denVal) * 100;
    debtStatus = debtRatio <= 30 ? 'pass' : (debtRatio <= 33 ? 'warning' : 'fail');
  }

  let cashRatio = null;
  let cashStatus = 'insufficient_data';
  if (denVal > 0) {
    cashRatio = (cashAndSecurities / denVal) * 100;
    cashStatus = cashRatio <= 30 ? 'pass' : (cashRatio <= 33 ? 'warning' : 'fail');
  }

  // Illiquid Assets always uses Total Assets
  let illiquidRatio = null;
  let illiquidStatus = 'insufficient_data';
  if (totalAssets > 0) {
    illiquidRatio = (illiquidAssets / totalAssets) * 100;
    illiquidStatus = illiquidRatio >= 30 ? 'pass' : 'fail';
  }

  const businessStatus = report.business_status || 'insufficient_data';
  const impIncomeStatus = report.impermissible_income_status || 'insufficient_data';

  let finalStatus = 'compliant';
  if (businessStatus === 'fail' || debtStatus === 'fail' || cashStatus === 'fail' || impIncomeStatus === 'fail' || illiquidStatus === 'fail') {
    finalStatus = 'non-compliant';
  } else if (businessStatus === 'warning' || debtStatus === 'warning' || cashStatus === 'warning') {
    finalStatus = 'doubtful';
  } else if (debtStatus === 'insufficient_data' || cashStatus === 'insufficient_data' || illiquidStatus === 'insufficient_data') {
    finalStatus = 'doubtful';
  }

  let statusColor = 'var(--text-muted)';
  let StatusIcon = HelpCircle;
  let bgStatus = 'var(--bg-section)';

  if (finalStatus === 'compliant') {
    statusColor = 'var(--halal)';
    StatusIcon = CheckCircle;
    bgStatus = 'var(--halal-bg)';
  } else if (finalStatus === 'non-compliant') {
    statusColor = 'var(--non-halal)';
    StatusIcon = XCircle;
    bgStatus = 'var(--non-halal-bg)';
  } else if (finalStatus === 'doubtful') {
    statusColor = 'var(--questionable)';
    StatusIcon = AlertTriangle;
    bgStatus = 'var(--questionable-bg)';
  }

  const renderSectionHeader = (title, status) => {
    let color = 'var(--text-muted)';
    let bg = 'var(--bg-section)';
    if (status === 'pass') { color = 'var(--halal)'; bg = 'var(--halal-bg)'; }
    if (status === 'fail') { color = 'var(--non-halal)'; bg = 'var(--non-halal-bg)'; }
    if (status === 'warning') { color = 'var(--questionable)'; bg = 'var(--questionable-bg)'; }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h3>
        <div style={{ padding: '4px 12px', borderRadius: '100px', background: bg, color: color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
          {(status || 'UNKNOWN').toUpperCase()}
        </div>
      </div>
    );
  };

  const renderRatioCard = (title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal) => {
    if (ratio === null) {
      return (
        <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Insufficient data to calculate this ratio.</p>
        </div>
      );
    }
    const ratioVal = parseFloat(ratio) || 0;
    return (
      <div 
        onClick={() => openModal(title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal)}
        style={{ 
          padding: '20px', background: 'var(--bg)', borderRadius: '12px', 
          border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-dark)' }}>{title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Threshold: {threshold}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ratioVal.toFixed(2)}%</div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to={`/market/${symbol}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={18} />
          Back to {symbol}
        </Link>
        <button 
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-dark)' }}
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ 
        padding: '32px 24px', borderRadius: '24px', background: bgStatus, 
        border: `1px solid ${statusColor}`, textAlign: 'center', marginBottom: '24px'
      }}>
        <StatusIcon size={64} color={statusColor} style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: statusColor, margin: '0 0 8px 0' }}>
          {finalStatus.toUpperCase()}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>AAOIFI Compliance Verdict</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>Financial Ratio Denominator:</span>
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <button 
            onClick={() => setDenominator('market_cap')}
            style={{ padding: '8px 16px', background: denominator === 'market_cap' ? 'var(--primary)' : 'transparent', color: denominator === 'market_cap' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
          >
            Market Cap
          </button>
          <button 
            onClick={() => setDenominator('total_assets')}
            style={{ padding: '8px 16px', background: denominator === 'total_assets' ? 'var(--primary)' : 'transparent', color: denominator === 'total_assets' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
          >
            Total Assets
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {renderSectionHeader('1. Business Activity Screening', report.business_status)}
        <div style={{ padding: '24px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Principal Business</span>
            <span style={{ fontWeight: 500 }}>{report.business_reasoning?.principal_business || 'N/A'}</span>
          </div>
          
          {report.business_reasoning?.prohibited_activities?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--non-halal)', fontSize: '0.9rem', marginBottom: '8px' }}>Prohibited Activities Found:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--non-halal)' }}>
                {report.business_reasoning.prohibited_activities.map((act, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Reasoning:</div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-dark)' }}>
              {report.business_reasoning?.reasoning || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {renderSectionHeader('2. Debt Ratio Screening', debtStatus)}
        {renderRatioCard(
          `Debt to ${denLabel}`, debtRatio, '≤ 30%',
          `Total Interest-Bearing Debt / ${denLabel}`,
          'Total Debt', totalDebt,
          denLabel, denVal
        )}
      </div>

      <div style={{ marginBottom: '40px' }}>
        {renderSectionHeader('3. Cash & Securities Screening', cashStatus)}
        {renderRatioCard(
          `Cash to ${denLabel}`, cashRatio, '≤ 30%',
          `Cash & Interest-bearing Securities / ${denLabel}`,
          'Cash & Securities', cashAndSecurities,
          denLabel, denVal
        )}
      </div>

      <div style={{ marginBottom: '40px' }}>
        {renderSectionHeader('4. Illiquid Assets Screening', illiquidStatus)}
        {renderRatioCard(
          'Illiquid Assets to Total Assets', illiquidRatio, '≥ 30%',
          'Illiquid Assets / Total Assets',
          'Illiquid Assets', illiquidAssets,
          'Total Assets', totalAssets
        )}
      </div>

      <div style={{ marginBottom: '48px' }}>
        {renderSectionHeader('5. Impermissible Income', impIncomeStatus)}
        {renderRatioCard(
          'Impure Income to Total Revenue', report.impermissible_income_ratio, '≤ 5%',
          'Interest Income / Total Revenue',
          'Interest Income', report.financial_data_used?.interest_income,
          'Total Revenue', report.financial_data_used?.total_revenue
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
        <button 
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText color="var(--primary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-dark)' }}>Evidence & Traceability</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>View data sources and AI confidence</div>
            </div>
          </div>
          <ChevronRight size={24} color="var(--text-muted)" style={{ transform: evidenceExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {evidenceExpanded && (
          <div style={{ padding: '24px', background: 'var(--bg-section)', borderRadius: '16px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', marginBottom: '24px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} /> AI Confidence Score
              </span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{report.business_reasoning?.confidence_score || 'N/A'}%</span>
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>News Sources Analyzed:</div>
            {report.news_sources?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.news_sources.map((news, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}><FileText size={16} /></div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                      {news.title || 'Unknown Source'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent news sources found for this analysis.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {modalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Calculation Details</h3>
              <button onClick={() => setModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle size={24} /></button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{modalData.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Threshold: {modalData.threshold}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{modalData.numLabel}</span>
                <span style={{ fontWeight: 700 }}>₦{formatNumber(modalData.numVal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{modalData.denLabel}</span>
                <span style={{ fontWeight: 700 }}>₦{formatNumber(modalData.denVal)}</span>
              </div>

              <div style={{ marginTop: '32px', background: 'var(--bg-section)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Formula</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '16px', wordBreak: 'break-all' }}>
                  {modalData.formula}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                  = {modalData.ratio.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AaoifiScreening;
