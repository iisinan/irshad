import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, 
  HelpCircle, ShieldCheck, ChevronRight, FileText, Brain, Download, Activity, Trash2, Droplets
} from 'lucide-react';
import { fetchAaoifiScreening, updateAaoifiData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAppJustification } from '../utils/screeningFormatter';

const LOADING_STEPS = [
  "Initializing AAOIFI Screening...",
  "Reading latest financial statements...",
  "Fetching regulatory filings...",
  "Searching latest company news...",
  "Analyzing business activities...",
  "Consulting Irshad Engine...",
  "Calculating AAOIFI financial ratios...",
  "Running compliance engine...",
  "Generating transparent report..."
];

const AaoifiScreening = () => {
  const { symbol } = useParams();
  
  const { data: res, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['aaoifi', symbol],
    queryFn: () => fetchAaoifiScreening(symbol),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 10000 : false,
  });

  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [modalData, setModalData] = useState(null);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [denominator, setDenominator] = useState('market_cap');
  const { user } = useAuth();
  
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    total_debt: '',
    cash: '',
    interest_income: '',
    total_assets: '',
    market_cap: '',
    total_revenue: '',
    evidence_links: ['']
  });
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  // UI theater: simulate loading steps
  useEffect(() => {
    let timer;
    if (simulatedLoading) {
      timer = setInterval(() => {
        setStepIndex(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [simulatedLoading]);

  // Synchronize query state with UI theater
  useEffect(() => {
    if (!queryLoading && res?.status === 'success') {
      setStepIndex(LOADING_STEPS.length - 1);
      const t = setTimeout(() => {
        setSimulatedLoading(false);
      }, 800);
      return () => clearTimeout(t);
    } else if (!queryLoading && queryError) {
      setSimulatedLoading(false);
    }
  }, [queryLoading, res, queryError]);

  const loading = queryLoading || simulatedLoading;
  const report = res?.data;
  const error = queryError ? (queryError.response?.data?.message || queryError.message || 'An error occurred') : null;

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

  const handleOpenOverrideModal = () => {
    const fd = report?.financial_data_used || {};
    let evLinks = report?.evidence_link ? report.evidence_link : [];
    if (typeof evLinks === 'string') {
      try {
        const parsed = JSON.parse(evLinks);
        evLinks = Array.isArray(parsed) ? parsed : [evLinks];
      } catch {
        evLinks = [evLinks];
      }
    }
    if (!Array.isArray(evLinks) || evLinks.length === 0) {
      evLinks = [''];
    }

    setOverrideData({
      total_debt: fd.total_debt || '',
      cash: fd.cash_and_equivalents || fd.cash || '',
      interest_income: fd.interest_income || '',
      total_assets: fd.total_assets || '',
      market_cap: fd.market_cap || '',
      total_revenue: fd.total_revenue || '',
      evidence_links: evLinks
    });
    setShowOverrideModal(true);
  };

  const submitOverride = async (e) => {
    e.preventDefault();
    setOverrideLoading(true);
    setOverrideError('');
    try {
      await updateAaoifiData(symbol, overrideData);
      setShowOverrideModal(false);
      window.location.reload();
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to update AAOIFI data');
    } finally {
      setOverrideLoading(false);
    }
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
        <h2 style={{ fontSize: '1.32rem', fontWeight: 800, marginBottom: '16px' }}>Institutional AAOIFI Analysis</h2>
        <div style={{ height: '30px', position: 'relative', overflow: 'hidden' }}>
          <p key={stepIndex} className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '0.97rem', fontWeight: 500 }}>
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
        <h2 style={{ fontSize: '1.54rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-dark)' }}>Screening Error</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
        <Link 
          to={`/market/${symbol}`} 
          className="hover-card"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', color: 'var(--text-dark)', fontWeight: 700, textDecoration: 'none', borderRadius: '100px', border: '1px solid var(--border)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
        >
          <ArrowLeft size={18} /> Return to {symbol} Overview
        </Link>
      </div>
    );
  }

  if (!report) return null;
  const isNonHalalReport = report.final_status === 'non-halal' || report.stage1?.status === 'non-halal' || report.business_status === 'fail';
  const cleanStatusReason = formatAppJustification(report.status_reason, isNonHalalReport);
  const cleanStage1Reason = formatAppJustification(report.stage1?.reason || report.business_reasoning, isNonHalalReport);
  const fd = report.financial_data_used || {};
  const totalAssets = parseFloat(fd.total_assets) || 0;
  const marketCap = parseFloat(fd.market_cap) || 0;
  const totalDebt = parseFloat(fd.total_debt) || 0;
  const cashAndSecurities = (parseFloat(fd.cash) || 0) + (parseFloat(fd.interest_bearing_securities) || 0);

  const denVal = denominator === 'total_assets' ? totalAssets : marketCap;
  const denLabel = denominator === 'total_assets' ? 'Total Assets' : 'Market Cap';

  let debtRatio = null;
  if (denVal > 0) {
    debtRatio = (totalDebt / denVal) * 100;
  }

  let cashRatio = null;
  if (denVal > 0) {
    cashRatio = (cashAndSecurities / denVal) * 100;
  }

  // Ensure we use the exact final status calculated by the backend which respects the database ground truth
  // and admin manual overrides, instead of re-calculating it blindly on the frontend.
  let finalStatus = report.final_status || 'doubtful';

  // Purification detection
  const hasPurification = finalStatus === 'halal' && !!report.stage1?.purification_required;
  const purificationPercent = parseFloat(report.stage1?.haram_revenue_percent) || 0;

  let statusColor = 'var(--text-muted)';
  let StatusIcon = HelpCircle;
  let bgStatus = 'var(--bg-section)';

  if (finalStatus === 'halal') {
    statusColor = hasPurification ? 'var(--halal)' : 'var(--halal)';
    StatusIcon = hasPurification ? Droplets : CheckCircle;
    bgStatus = hasPurification
      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)'
      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)';
  } else if (finalStatus === 'non-halal') {
    statusColor = 'var(--non-halal)';
    StatusIcon = XCircle;
    bgStatus = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)';
  } else if (finalStatus === 'doubtful') {
    statusColor = 'var(--questionable)';
    StatusIcon = AlertTriangle;
    bgStatus = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)';
  }


  const renderRatioProgressBar = (title, subtitle, ratio, threshold, numLabel, numVal, denLabel, denVal, formula, isMinimum = false) => {
    if (ratio === null || ratio === undefined || isNaN(ratio)) {
      return (
        <div className="ratio-progress-row unavailable hover-card">
          <div className="ratio-col-label">
            <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.88rem', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
          
          <div className="ratio-col-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>DATA UNAVAILABLE</span>
          </div>
          
          <div className="ratio-col-value">
            <div style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-muted)' }}>N/A</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Insufficient data</div>
          </div>
        </div>
      );
    }

    const ratioVal = parseFloat(ratio) || 0;
    const thresholdNum = parseFloat(threshold);
    const isPassing = isMinimum ? ratioVal >= thresholdNum : ratioVal <= thresholdNum;
    
    const diff = Math.abs(thresholdNum - ratioVal).toFixed(1);
    const headroomDisplay = isPassing ? `${diff}pp headroom` : (isMinimum ? `${diff}pp shortfall` : `${diff}pp excess`);
    const color = isPassing ? 'var(--halal)' : 'var(--non-halal)';
    
    const maxVisual = Math.max(thresholdNum / 0.7, ratioVal / 0.9, 1);
    const fillPercent = (ratioVal / maxVisual) * 100;
    const thresholdPercent = (thresholdNum / maxVisual) * 100;

    const numValParsed = parseFloat(numVal) || 0;
    const isClickable = numValParsed !== 0;

    return (
      <div 
        onClick={isClickable ? () => openModal(title, ratio, isMinimum ? `≥ ${threshold}%` : `≤ ${threshold}%`, formula, numLabel, numVal, denLabel, denVal) : undefined}
        className={`ratio-progress-row ${isClickable ? 'hover-card' : ''}`}
        style={isClickable ? {} : { cursor: 'default' }}
      >
        <div className="ratio-col-label">
          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.88rem', marginBottom: '4px' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
        
        <div className="ratio-col-bar">
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', 
            width: `${Math.min(fillPercent, 100)}%`, 
            background: color, 
            borderRadius: '10px',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          <div style={{
            position: 'absolute', top: '-6px', bottom: '-6px', 
            left: `${thresholdPercent}%`, width: '2px', 
            background: 'var(--non-halal)',
            zIndex: 10
          }} />
          <div style={{
            position: 'absolute', top: '22px', left: `calc(${thresholdPercent}% - 30px)`,
            fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, width: '60px', textAlign: 'center'
          }}>
            limit {threshold}%
          </div>
        </div>
        
        <div className="ratio-col-value">
          <div style={{ fontSize: '1.32rem', fontWeight: 900, color }}>{ratioVal.toFixed(1)}%</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color, marginTop: '4px' }}>{headroomDisplay}</div>
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
            <h1 style={{ margin: 0, fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)' }}>{symbol} Screening</h1>
            <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AAOIFI Standard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
        {user?.role === 'admin' && (
          <button 
            onClick={handleOpenOverrideModal}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', border: 'none', borderRadius: '12px', 
              cursor: 'pointer', fontWeight: 800, color: '#ffffff', fontSize: '0.88rem', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 20px rgba(6, 78, 59, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(6, 78, 59, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(6, 78, 59, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
          >
            <ShieldCheck size={18} /> Edit Data
          </button>
        )}
        <button 
          onClick={() => window.print()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
            background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', border: '1px solid var(--border)', borderRadius: '12px', 
            cursor: 'pointer', fontWeight: 800, color: 'var(--text-dark)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-dark)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
          }}
        >
          <Download size={18} /> Export Report
        </button>
        </div>
      </div>

      <div className="detail-header" style={{ 
        padding: hasPurification ? '48px 36px 0 36px' : '56px 36px', borderRadius: '32px', background: bgStatus, 
        border: hasPurification ? '2px solid rgba(245,158,11,0.45)' : `2px solid ${statusColor}40`, textAlign: 'center', marginBottom: '40px',
        boxShadow: hasPurification
          ? '0 32px 64px -16px rgba(16,185,129,0.2), inset 0 2px 20px rgba(245,158,11,0.08)'
          : `0 32px 64px -16px ${statusColor}25, inset 0 2px 20px ${statusColor}10`,
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Background ambient orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '280px', height: '280px', background: `radial-gradient(circle, ${statusColor}15 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 20s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '320px', height: '320px', background: `radial-gradient(circle, ${statusColor}10 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 25s ease-in-out infinite alternate-reverse' }} />
        {hasPurification && (
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        )}
        
        {/* Top status bar — green for halal, amber for purification */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, height: '8px', 
          background: hasPurification
            ? 'linear-gradient(90deg, var(--halal) 0%, var(--questionable) 100%)'
            : statusColor,
          boxShadow: hasPurification
            ? '0 0 20px rgba(245,158,11,0.6)'
            : `0 0 20px ${statusColor}`
        }} />

        <div style={{ position: 'relative', zIndex: 1, animation: 'pulse 3s infinite alternate' }}>
          <StatusIcon size={96} color={hasPurification ? 'var(--halal)' : statusColor} style={{ margin: '0 auto 24px', filter: `drop-shadow(0 12px 32px ${hasPurification ? 'rgba(16,185,129,0.7)' : statusColor + '70'})` }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.86rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: hasPurification ? 'var(--halal)' : statusColor, marginBottom: '12px', textShadow: `0 2px 10px ${statusColor}30` }}>AAOIFI COMPLIANCE VERDICT</div>

        <h1 style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, color: hasPurification ? 'var(--halal)' : statusColor, margin: '0 0 8px 0', letterSpacing: '-1.5px', textShadow: `0 4px 20px ${statusColor}40`, lineHeight: 1.1 }}>
          {finalStatus === 'halal'
            ? (hasPurification ? 'HALAL' : 'HALAL')
            : finalStatus === 'non-halal' ? 'NON-HALAL' : 'DOUBTFUL'}
        </h1>

        {hasPurification && (
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '8px' }}>
            <span style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--questionable)', letterSpacing: '1px', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(245,158,11,0.3)' }}>
              WITH PURIFICATION
            </span>
          </div>
        )}

        <p style={{ position: 'relative', zIndex: 1, color: 'var(--text-dark)', margin: '0 auto', fontWeight: 600, fontSize: '1.0rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: hasPurification ? '36px' : '0' }}>
          {cleanStatusReason || 'Screened in accordance with AAOIFI Shariah Standard No. 21 (Financial & Business Activity Rules).'}
        </p>

        {/* Purification strip — only shown when purification is required */}
        {hasPurification && (
          <div style={{
            position: 'relative', zIndex: 1,
            width: 'calc(100% + 72px)', marginLeft: '-36px', marginRight: '-36px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.10) 100%)',
            borderTop: '1.5px solid rgba(245,158,11,0.35)',
            padding: '24px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap'
          }}>
            {/* Icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(245,158,11,0.2)', border: '1.5px solid rgba(245,158,11,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Droplets size={20} color="var(--questionable)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--questionable)', marginBottom: '2px' }}>Dividend Purification Required</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500, lineHeight: 1.4 }}>
                  Purify <strong style={{ color: 'var(--questionable)' }}>{purificationPercent}%</strong> of any dividends received from this stock
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '40px', background: 'rgba(245,158,11,0.3)' }} />

            {/* Big stat */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--questionable)', lineHeight: 1, letterSpacing: '-1px' }}>
                {purificationPercent}%
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Of Dividends To Purify</div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '40px', background: 'rgba(245,158,11,0.3)' }} />

            {/* Explanation */}
            <div style={{ maxWidth: '260px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 500, lineHeight: 1.5 }}>
                The company earns <strong style={{ color: 'var(--questionable)' }}>{purificationPercent}%</strong> from non-compliant sources. Donate this portion of any dividends or returns to charity.
              </div>
            </div>
          </div>
        )}
      </div>



      <div className="hover-card" style={{ background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: '48px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '0.79rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>STAGE 1: BUSINESS ACTIVITY SCREENING</h2>
            <p style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)', margin: '8px 0 0 0' }}>Core operations & Revenue</p>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: '100px', background: report.stage1?.status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: report.stage1?.status === 'halal' ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {report.stage1?.status === 'halal' ? 'PASS' : report.stage1?.status === 'non-halal' ? 'FAIL' : 'UNKNOWN'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {report.stage1?.purification_required && finalStatus === 'halal' && (
            <div className="hover-card" style={{ background: 'var(--questionable-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--questionable)', transition: 'transform 0.2s' }}>
              <div style={{ fontWeight: 800, color: 'var(--questionable)', fontSize: '0.84rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Dividend Purification Required
              </div>
              <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.6 }}>
                This company passes Stage 1, but has <strong>{report.stage1?.haram_revenue_percent}%</strong> revenue from non-compliant sources. You must purify this portion of your dividends.
              </p>
            </div>
          )}

          {report.stage1?.status === 'non-halal' && (
            <div className="hover-card" style={{ background: 'var(--non-halal-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--non-halal)', transition: 'transform 0.2s' }}>
              <div style={{ fontWeight: 800, color: 'var(--non-halal)', fontSize: '0.84rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Prohibited Activities Exceed Limits
              </div>
              <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.6 }}>
                This company fails Stage 1 because its non-compliant revenue ({report.stage1?.haram_revenue_percent}%) exceeds the 5% tolerance, or it is primarily engaged in prohibited activities.
              </p>
            </div>
          )}
          
          <div style={{ paddingTop: '24px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} color="var(--primary)" /> Stage 1 Screening Reasoning
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-dark)', padding: '20px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              {cleanStage1Reason || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {!['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(symbol) && (finalStatus === 'halal' || report.business_status === 'pass') && (debtRatio !== null || report.impermissible_income_ratio != null || cashRatio !== null) && (
      <div className="hover-card" style={{ background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: '48px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '0.79rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>STAGE 2: QUANTITATIVE FINANCIAL RATIO SCREENING</h2>
            <p style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)', margin: '8px 0 0 0' }}>The Three AAOIFI Financial Metrics</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-section)', borderRadius: '100px', border: '1px solid var(--border)', fontSize: '0.75rem', overflow: 'hidden' }}>
            <span style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>Denominator</span>
            <select 
              value={denominator}
              onChange={e => setDenominator(e.target.value)}
              style={{ background: 'var(--bg)', border: 'none', borderLeft: '1px solid var(--border)', padding: '6px 12px', fontWeight: 700, cursor: 'pointer', outline: 'none', color: 'var(--text-dark)' }}
            >
              <option value="market_cap">Market cap</option>
              <option value="total_assets">Total Assets</option>
            </select>
          </div>
        </div>


        
        <div style={{ marginTop: '16px' }}>
          {renderRatioProgressBar(
            '1. Debt ratio', 'Total debt / Market cap × 100', 
            debtRatio, 30, 
            'Total Debt', totalDebt, denLabel, denVal, `Total Debt / ${denLabel} × 100`
          )}
          {renderRatioProgressBar(
            '2. Cash ratio', '(Cash + security) / Market cap × 100', 
            cashRatio, 30, 
            'Cash & Securities', cashAndSecurities, denLabel, denVal, `(Cash + Security) / ${denLabel} × 100`
          )}
          {renderRatioProgressBar(
            '3. Impure revenue', 'Impure income / Total revenue × 100', 
            report.impermissible_income_ratio, 5, 
            'Impure Income', report.financial_data_used?.interest_income, 'Total Revenue', report.financial_data_used?.total_revenue, 'Impure Income / Total Revenue × 100'
          )}
        </div>
      </div>
      )}

      <div className="hover-card" style={{ background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: '48px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button 
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '0.79rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>TRANSPARENCY & EVIDENCE</h2>
            <p style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)', margin: '8px 0 0 0' }}>Data sources & Irshad Confidence</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.79rem', fontWeight: 600 }}>
            {evidenceExpanded ? 'Hide details' : 'View details'}
            <ChevronRight size={24} color="var(--text-muted)" style={{ transform: evidenceExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </button>

        {evidenceExpanded && (
          <div className="animate-fade-in" style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>

            {(report.financial_data_used?.source_links?.length > 0 || report.financial_data_used?.source || report.financial_data_used?.source_url) && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.97rem', marginBottom: '12px' }}>Extracted Financial Data Sources</div>
                
                {report.financial_data_used?.source_links?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {report.financial_data_used.source_links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}>
                        <div style={{ color: 'var(--primary)', background: 'var(--primary-bg)', padding: '10px', borderRadius: '12px' }}><FileText size={20} /></div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>{link.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{link.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span style={{ fontWeight: 700 }}>Published:</span> {link.published_date || report.published_date || 'Unknown Date'}
                          </div>
                          {(link.financial_year || report.financial_year || link.report_quarter) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span style={{ fontWeight: 700 }}>Reporting Period:</span> {link.report_quarter || 'Annual Report'} (FY {link.financial_year || report.financial_year || 'Unknown'})
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {report.financial_data_used?.source_url && !report.financial_data_used?.source_links?.length && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                      <a href={report.financial_data_used.source_url} target="_blank" rel="noopener noreferrer" className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}>
                        <div style={{ color: 'var(--primary)', background: 'var(--primary-bg)', padding: '10px', borderRadius: '12px' }}><FileText size={20} /></div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Nigerian Exchange Group (NGX)</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official corporate filings and pricing</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span style={{ fontWeight: 700 }}>Published:</span> {report.financial_data_used.published_date || 'Unknown Date'}
                          </div>
                          {(report.financial_data_used.financial_year || report.financial_data_used.reporting_period) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span style={{ fontWeight: 700 }}>Reporting Period:</span> {report.financial_data_used.reporting_period || 'Annual Report'} (FY {report.financial_data_used.financial_year || 'Unknown'})
                            </div>
                          )}
                        </div>
                      </a>
                  </div>
                )}

                {report.financial_data_used?.source && !report.financial_data_used?.source_links?.length && !report.financial_data_used?.source_url && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-section)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--primary)', background: 'var(--primary-bg)', padding: '8px', borderRadius: '10px' }}><FileText size={18} /></div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: 1.5 }}>
                      {report.financial_data_used.source}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Referenced Financial Data Used for Screening */}
            <div style={{ borderTop: `1px solid var(--border)`, paddingTop: '28px', margin: '32px 0 0 0', textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
                <Activity size={16} color="var(--primary)" /> Business Activity & Referenced Financial Data For AAOIFI Screening
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Market Capitalization</span>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-dark)', fontWeight: 800, marginTop: '4px' }}>{marketCap ? `₦${(marketCap/1000000000).toFixed(2)}B` : 'N/A'}</span>
                </div>
                <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Interest Debt</span>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-dark)', fontWeight: 800, marginTop: '4px' }}>{totalDebt ? `₦${(totalDebt/1000000000).toFixed(2)}B` : '₦0'}</span>
                </div>
                <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Cash & Securities</span>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-dark)', fontWeight: 800, marginTop: '4px' }}>{cashAndSecurities ? `₦${(cashAndSecurities/1000000000).toFixed(2)}B` : '₦0'}</span>
                </div>
                <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Assets</span>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-dark)', fontWeight: 800, marginTop: '4px' }}>{totalAssets ? `₦${(totalAssets/1000000000).toFixed(2)}B` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {/* Modal Overlay */}
      {modalData && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px', opacity: 1, transition: 'opacity 0.3s' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '32px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 0 0 1px var(--border)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Calculation Details</h3>
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
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-dark)' }}>{modalData.title}</div>
                <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--bg-section)', borderRadius: '100px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                  Threshold: {modalData.threshold}
                </div>
              </div>

              <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Formula</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-dark)', fontWeight: 600, fontFamily: 'monospace' }}>{modalData.formula}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{modalData.numLabel}</span>
                <span style={{ fontWeight: 800, fontSize: '0.97rem' }}>₦{formatNumber(modalData.numVal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{modalData.denLabel}</span>
                <span style={{ fontWeight: 800, fontSize: '0.97rem' }}>₦{formatNumber(modalData.denVal)}</span>
              </div>

              <div style={{ marginTop: '32px', background: 'var(--bg-section)', padding: '24px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Result</div>
                <div style={{ fontSize: '2.64rem', fontWeight: 900, color: modalData.ratio <= parseFloat(modalData.threshold.replace(/[^0-9.]/g, '')) ? 'var(--halal)' : 'var(--non-halal)', lineHeight: 1 }}>
                  {modalData.ratio.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Override Modal */}
      {showOverrideModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Admin Data Override</h3>
              <button 
                onClick={() => setShowOverrideModal(false)} 
                style={{ background: 'var(--bg-section)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={submitOverride} style={{ padding: '24px', overflowY: 'auto' }}>
              {overrideError && <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '20px' }}>{overrideError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Assets</label>
                  <input required type="number" step="any" value={overrideData.total_assets} onChange={e => setOverrideData({...overrideData, total_assets: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Revenue</label>
                  <input required type="number" step="any" value={overrideData.total_revenue} onChange={e => setOverrideData({...overrideData, total_revenue: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Market Cap</label>
                  <input required type="number" step="any" value={overrideData.market_cap} onChange={e => setOverrideData({...overrideData, market_cap: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Debt</label>
                  <input required type="number" step="any" value={overrideData.total_debt} onChange={e => setOverrideData({...overrideData, total_debt: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Cash & Equivalents</label>
                  <input required type="number" step="any" value={overrideData.cash} onChange={e => setOverrideData({...overrideData, cash: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Interest / Non-Permissible Income</label>
                <input required type="number" step="any" value={overrideData.interest_income} onChange={e => setOverrideData({...overrideData, interest_income: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Evidence / Reference Links (Required)</label>
                  <button type="button" onClick={() => setOverrideData({...overrideData, evidence_links: [...overrideData.evidence_links, '']})} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>+ Add Link</button>
                </div>
                {overrideData.evidence_links.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input required type="url" placeholder="https://..." value={link} onChange={e => {
                      const newLinks = [...overrideData.evidence_links];
                      newLinks[idx] = e.target.value;
                      setOverrideData({...overrideData, evidence_links: newLinks});
                    }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                    {overrideData.evidence_links.length > 1 && (
                      <button type="button" onClick={() => {
                        const newLinks = overrideData.evidence_links.filter((_, i) => i !== idx);
                        setOverrideData({...overrideData, evidence_links: newLinks});
                      }} style={{ padding: '0 16px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Provide links to the financial report or announcement justifying this override.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowOverrideModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={overrideLoading} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: overrideLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {overrideLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AaoifiScreening;
