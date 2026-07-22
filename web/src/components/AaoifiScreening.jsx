import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
        if (res.status === 'success') {
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
            <div style={{ position: 'absolute', inset: -10, background: 'var(--primary)', opacity: 0.1, borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--border)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }} />
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
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '48px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '32px', border: '1px solid var(--non-halal-bg)', boxShadow: '0 32px 64px -16px rgba(239,68,68,0.1)' }}>
        <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'var(--non-halal-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={40} color="var(--non-halal)" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-dark)' }}>Screening Error</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
        <Link 
          to={`/market/${symbol}`} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--bg)', color: 'var(--text-dark)', fontWeight: 700, textDecoration: 'none', borderRadius: '100px', border: '1px solid var(--border)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--text-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <ArrowLeft size={18} /> Return to {symbol} Overview
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
  const accountsReceivable = parseFloat(fd.accounts_receivable) || 0;

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
  let illiquidStatus = report.illiquid_status || 'insufficient_data';
  if (totalAssets > 0) {
    illiquidRatio = report.illiquid_ratio;
  }

  // Receivables always uses Total Assets
  let receivablesRatio = null;
  let receivablesStatus = report.receivables_status || 'insufficient_data';
  if (totalAssets > 0) {
    receivablesRatio = report.receivables_ratio;
  }

  const businessStatus = report.business_status || 'insufficient_data';
  const impIncomeStatus = report.impermissible_income_status || 'insufficient_data';

  let finalStatus = 'compliant';
  if (businessStatus === 'fail' || debtStatus === 'fail' || cashStatus === 'fail' || impIncomeStatus === 'fail' || illiquidStatus === 'fail' || receivablesStatus === 'fail') {
    finalStatus = 'non-compliant';
  } else if (businessStatus === 'warning' || debtStatus === 'warning' || cashStatus === 'warning') {
    finalStatus = 'doubtful';
  } else if (debtStatus === 'insufficient_data' || cashStatus === 'insufficient_data' || illiquidStatus === 'insufficient_data' || receivablesStatus === 'insufficient_data') {
    finalStatus = 'doubtful';
  }

  let statusColor = 'var(--text-muted)';
  let StatusIcon = HelpCircle;
  let bgStatus = 'var(--bg-section)';

  if (finalStatus === 'compliant') {
    statusColor = 'var(--halal)';
    StatusIcon = CheckCircle;
    bgStatus = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)';
  } else if (finalStatus === 'non-compliant') {
    statusColor = 'var(--non-halal)';
    StatusIcon = XCircle;
    bgStatus = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)';
  } else if (finalStatus === 'doubtful') {
    statusColor = 'var(--questionable)';
    StatusIcon = AlertTriangle;
    bgStatus = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)';
  }

  const renderSectionHeader = (title, status) => {
    let color = 'var(--text-muted)';
    let bg = 'var(--bg-section)';
    if (status === 'pass') { color = 'var(--halal)'; bg = 'var(--halal-bg)'; }
    if (status === 'fail') { color = 'var(--non-halal)'; bg = 'var(--non-halal-bg)'; }
    if (status === 'warning') { color = 'var(--questionable)'; bg = 'var(--questionable-bg)'; }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>{title}</h3>
        <div style={{ padding: '6px 14px', borderRadius: '100px', background: bg, color: color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', boxShadow: `0 2px 4px ${color}20` }}>
          {(status || 'UNKNOWN').toUpperCase()}
        </div>
      </div>
    );
  };

  const renderRatioCard = (title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal) => {
    if (ratio === null) {
      return (
        <div style={{ padding: '20px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> Insufficient data to calculate this ratio.
          </p>
        </div>
      );
    }
    const ratioVal = parseFloat(ratio) || 0;
    const thresholdNum = parseFloat(threshold.replace(/[^0-9.]/g, ''));
    const isPassing = ratioVal <= thresholdNum;
    
    return (
      <div 
        onClick={() => openModal(title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal)}
        style={{ 
          padding: '24px', background: 'var(--bg)', borderRadius: '16px', 
          border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = isPassing ? 'var(--halal)' : 'var(--non-halal)';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.08)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {title}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', display: 'inline-block', padding: '4px 10px', background: 'var(--bg-section)', borderRadius: '100px', fontWeight: 600 }}>
            Threshold: {threshold}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isPassing ? 'var(--halal)' : 'var(--non-halal)' }}>
            {ratioVal.toFixed(2)}%
          </div>
          <div style={{ padding: '8px', background: 'var(--bg-section)', borderRadius: '50%', display: 'flex', color: 'var(--text-muted)' }}>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link 
            to={`/market/${symbol}`} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '50%', color: 'var(--text-dark)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)' }}>{symbol} Screening</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AAOIFI Standard • Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', 
            cursor: 'pointer', fontWeight: 700, color: 'var(--text-dark)', transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = 'var(--text-dark)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
          }}
        >
          <Download size={18} /> Export Report
        </button>
      </div>

      <div style={{ 
        padding: '48px 24px', borderRadius: '32px', background: bgStatus, 
        border: `1px solid ${statusColor}40`, textAlign: 'center', marginBottom: '32px',
        boxShadow: `0 24px 48px -12px ${statusColor}20`,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: statusColor }} />
        <StatusIcon size={80} color={statusColor} style={{ margin: '0 auto 20px', filter: `drop-shadow(0 8px 16px ${statusColor}40)` }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: statusColor, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          {finalStatus.toUpperCase()}
        </h1>
        <p style={{ color: 'var(--text-dark)', margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>AAOIFI Compliance Verdict</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>Financial Ratio Denominator:</span>
        <div style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)', position: 'relative' }}>
          <button 
            onClick={() => setDenominator('market_cap')}
            style={{ 
              position: 'relative', zIndex: 1, padding: '8px 20px', 
              background: denominator === 'market_cap' ? 'var(--bg)' : 'transparent', 
              color: denominator === 'market_cap' ? 'var(--text-dark)' : 'var(--text-muted)', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: denominator === 'market_cap' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Market Cap
          </button>
          <button 
            onClick={() => setDenominator('total_assets')}
            style={{ 
              position: 'relative', zIndex: 1, padding: '8px 20px', 
              background: denominator === 'total_assets' ? 'var(--bg)' : 'transparent', 
              color: denominator === 'total_assets' ? 'var(--text-dark)' : 'var(--text-muted)', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: denominator === 'total_assets' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Total Assets
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {renderSectionHeader('1. Business Activity Screening', report.business_status)}
        <div style={{ padding: '32px', background: 'linear-gradient(180deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 8px 16px -8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '24px', alignItems: 'start' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--primary)" /> Principal
              </span>
              <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                {report.business_reasoning?.principal_business || 'N/A'}
              </span>
            </div>
            
            {report.business_reasoning?.prohibited_activities?.length > 0 && (
              <div style={{ background: 'var(--non-halal-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--non-halal)' }}>
                <div style={{ fontWeight: 800, color: 'var(--non-halal)', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> Prohibited Activities Found:
                </div>
                <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--non-halal)', fontWeight: 500, lineHeight: 1.6 }}>
                  {report.business_reasoning.prohibited_activities.map((act, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ paddingTop: '24px', borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} color="var(--primary)" /> AI Analysis Reasoning
              </div>
              <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-dark)', padding: '20px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                {report.business_reasoning?.reasoning || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '48px' }}>
        {debtRatio !== null && (
          <div>
            {renderSectionHeader('2. Debt Ratio Screening', debtStatus)}
            {renderRatioCard(
              `Debt to ${denLabel}`, debtRatio, '≤ 30%',
              `Total Interest-Bearing Debt / ${denLabel}`,
              'Total Debt', totalDebt,
              denLabel, denVal
            )}
          </div>
        )}

        {cashRatio !== null && (
          <div>
            {renderSectionHeader('3. Cash & Securities Screening', cashStatus)}
            {renderRatioCard(
              `Cash to ${denLabel}`, cashRatio, '≤ 30%',
              `Cash & Interest-bearing Securities / ${denLabel}`,
              'Cash & Securities', cashAndSecurities,
              denLabel, denVal
            )}
          </div>
        )}

        {illiquidRatio !== null && (
          <div>
            {renderSectionHeader('4. Illiquid Assets Screening', illiquidStatus)}
            {renderRatioCard(
              'Illiquid Assets to Total Assets', illiquidRatio, '≥ 30%',
              'Illiquid Assets / Total Assets',
              'Illiquid Assets', illiquidAssets,
              'Total Assets', totalAssets
            )}
          </div>
        )}

        {receivablesRatio !== null && (
          <div>
            {renderSectionHeader('5. Accounts Receivable Screening', receivablesStatus)}
            {renderRatioCard(
              'Accounts Receivable to Total Assets', receivablesRatio, '≤ 45%',
              'Accounts Receivable / Total Assets',
              'Accounts Receivable', accountsReceivable,
              'Total Assets', totalAssets
            )}
          </div>
        )}

        {report.impermissible_income_ratio !== null && report.impermissible_income_ratio !== undefined && (
          <div style={{ gridColumn: '1 / -1' }}>
            {renderSectionHeader('6. Impermissible Income', impIncomeStatus)}
            {renderRatioCard(
              'Impure Income to Total Revenue', report.impermissible_income_ratio, '≤ 5%',
              'Interest Income / Total Revenue',
              'Interest Income', report.financial_data_used?.interest_income,
              'Total Revenue', report.financial_data_used?.total_revenue
            )}
          </div>
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
          <div className="animate-fade-in" style={{ padding: '32px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', marginTop: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '12px 24px', background: 'var(--bg)', borderRadius: '100px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Brain size={20} color="var(--primary)" /> 
              <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '1rem' }}>AI Confidence Score</span>
              <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
              <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem' }}>{report.business_reasoning?.confidence_score || 'N/A'}%</span>
            </div>

            <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.1rem', marginBottom: '20px' }}>News Sources Analyzed</div>
            {report.news_sources?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {report.news_sources.map((news, i) => (
                  <a key={i} href={news.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ color: 'var(--primary)', background: 'var(--primary-bg)', padding: '8px', borderRadius: '10px' }}><FileText size={18} /></div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: 1.4, marginBottom: '8px' }}>
                          {news.title || 'Unknown Source'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {news.source || 'News'} • {new Date(news.published_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>No recent news sources found for this analysis.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {/* Modal Overlay */}
      {modalData && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px', opacity: 1, transition: 'opacity 0.3s' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '32px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 0 0 1px var(--border)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Calculation Details</h3>
              <button 
                onClick={() => setModalData(null)} 
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text-dark)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-dark)' }}>{modalData.title}</div>
                <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--bg-section)', borderRadius: '100px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Threshold: {modalData.threshold}
                </div>
              </div>

              <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Formula</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 600, fontFamily: 'monospace' }}>{modalData.formula}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{modalData.numLabel}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₦{formatNumber(modalData.numVal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{modalData.denLabel}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₦{formatNumber(modalData.denVal)}</span>
              </div>

              <div style={{ marginTop: '32px', background: 'var(--bg-section)', padding: '24px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Result</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: modalData.ratio <= parseFloat(modalData.threshold.replace(/[^0-9.]/g, '')) ? 'var(--halal)' : 'var(--non-halal)', lineHeight: 1 }}>
                  {modalData.ratio.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AaoifiScreening;
