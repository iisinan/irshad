import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Building2, Upload, FileSpreadsheet, ShieldCheck, AlertTriangle,
  Droplet, FileText, Presentation, Download, Plus, Save, Trash2,
  CheckCircle2, Sparkles, Maximize2, Minimize2, Loader2, FolderOpen, ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchInstitutionDemoPresets,
  screenInstitutionPortfolio,
  fetchInstitutionPortfolios,
  saveInstitutionPortfolio,
  deleteInstitutionPortfolio,
} from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';
import InstitutionalVerdictsTable from './InstitutionalVerdictsTable';
import InstitutionalPurificationPanel from './InstitutionalPurificationPanel';
import InstitutionalFactsheetView from './InstitutionalFactsheetView';
import InstitutionalPresentationDeck from './InstitutionalPresentationDeck';
import {
  LOTUS_FALLBACK_DATA,
  NORRENBERGER_FALLBACK_DATA,
  SAMPLE_UPLOAD_CSV,
  formatNaira,
} from './institutionalFixtures';

const TAB_DEFS = [
  { id: 'screening', label: 'Portfolio Upload & Verdicts', icon: ShieldCheck },
  { id: 'purification', label: 'Purification Engine', icon: Droplet },
  { id: 'factsheet', label: 'Factsheet Studio', icon: FileText },
  { id: 'presentation', label: 'Meeting Presentation Deck', icon: Presentation },
];

export default function InstitutionalDashboard({ demoMode = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const tabRefs = useRef([]);

  const isAuthenticatedInstitution = Boolean(user && ['institution', 'admin'].includes(user.role));

  const getHashTab = () => {
    const raw = (location.hash || '').replace('#', '').trim();
    return TAB_DEFS.some((t) => t.id === raw) ? raw : 'screening';
  };

  const [activeTab, setActiveTab] = useState(getHashTab);
  const [presets, setPresets] = useState(null);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [activePresetId, setActivePresetId] = useState('lotus_etf'); // 'lotus_etf' | 'norrenberger_fund' | 'mixed_institutional_book' | 'uploaded'
  const [customScreened, setCustomScreened] = useState(null);
  const [customFundName, setCustomFundName] = useState('Institutional Equity Mandate');
  const [factsheetMeta, setFactsheetMeta] = useState(null);

  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [presentationFullscreen, setPresentationFullscreen] = useState(false);

  // Manual quick-add row state
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualShares, setManualShares] = useState('50000');

  useEffect(() => {
    setActiveTab(getHashTab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingPresets(true);
      try {
        const res = await fetchInstitutionDemoPresets();
        if (mounted && res?.data) {
          setPresets(res.data);
        }
      } catch (err) {
        console.error('Failed to load institutional demo presets:', err);
      } finally {
        if (mounted) setLoadingPresets(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticatedInstitution) return;
    let mounted = true;
    fetchInstitutionPortfolios()
      .then((res) => {
        if (mounted) setSavedPortfolios(res?.data || []);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [isAuthenticatedInstitution]);

  const activeScreened = useMemo(() => {
    if (activePresetId === 'uploaded' && customScreened) return customScreened;
    if (activePresetId === 'lotus_etf') return presets?.lotus_etf?.screening_result || { holdings: [], summary: {}, sector_allocation: [] };
    if (activePresetId === 'mixed_institutional_book') return presets?.mixed_institutional_book || { holdings: [], summary: {}, sector_allocation: [] };
    if (activePresetId === 'norrenberger_fund') {
      // Norrenberger Islamic Fund is Fixed Income (Sukuk/Mudarabah/Ijarah/Murabaha); show Sukuk/Fixed-Income breakdown or fallback
      return presets?.lotus_etf?.screening_result || { holdings: [], summary: {}, sector_allocation: [] };
    }
    return customScreened || presets?.lotus_etf?.screening_result || { holdings: [], summary: {}, sector_allocation: [] };
  }, [activePresetId, customScreened, presets]);

  const activeTitle = useMemo(() => {
    if (activePresetId === 'lotus_etf') return LOTUS_FALLBACK_DATA.fund_name;
    if (activePresetId === 'norrenberger_fund') return NORRENBERGER_FALLBACK_DATA.fund_name;
    if (activePresetId === 'mixed_institutional_book') return 'Sample Mixed Brokerage Equity Book';
    return customFundName;
  }, [activePresetId, customFundName]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (window.location.pathname === '/institution' || window.location.pathname === '/institution/demo') {
      window.history.replaceState(null, '', `${window.location.pathname}#${tabId}`);
    }
  };

  const handleTabKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight') {
      const next = (idx + 1) % TAB_DEFS.length;
      handleSelectTab(TAB_DEFS[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + TAB_DEFS.length) % TAB_DEFS.length;
      handleSelectTab(TAB_DEFS[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      handleSelectTab(TAB_DEFS[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      handleSelectTab(TAB_DEFS[TAB_DEFS.length - 1].id);
      tabRefs.current[TAB_DEFS.length - 1]?.focus();
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsScreening(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await screenInstitutionPortfolio(formData, isAuthenticatedInstitution);
      if (res?.data) {
        setCustomScreened(res.data);
        setCustomFundName(file.name.replace(/\.(csv|xlsx|xls|pdf|txt)$/i, ''));
        setSelectedSavedId(null);
        setActivePresetId('uploaded');
        setActiveTab('screening');
        toastSuccess(`Screened ${res.data.summary?.holdings_count || 0} holdings from ${file.name}`);
      }
    } catch (err) {
      toastError(err?.response?.data?.message || 'Could not parse uploaded file. Try the sample CSV template.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleAddManualTicker = async (e) => {
    e.preventDefault();
    const sym = manualSymbol.trim().toUpperCase();
    const qty = Number(manualShares) || 0;
    if (!sym || qty <= 0) {
      toastError('Enter a valid NGX symbol and unit quantity.');
      return;
    }

    const baseHoldings = (activeScreened?.holdings || []).map((h) => ({
      symbol: h.symbol,
      shares: h.shares,
      avg_price: h.current_price,
    }));

    const existingIdx = baseHoldings.findIndex((h) => h.symbol === sym);
    if (existingIdx >= 0) {
      baseHoldings[existingIdx].shares = Number(baseHoldings[existingIdx].shares) + qty;
    } else {
      baseHoldings.push({ symbol: sym, shares: qty });
    }

    setIsScreening(true);
    try {
      const res = await screenInstitutionPortfolio({ holdings: baseHoldings }, isAuthenticatedInstitution);
      if (res?.data) {
        setCustomScreened(res.data);
        if (activePresetId !== 'uploaded') {
          setCustomFundName(`${activeTitle} (Modified)`);
        }
        setActivePresetId('uploaded');
        setManualSymbol('');
        toastSuccess(`Added & screened ${sym}`);
      }
    } catch (err) {
      toastError(err?.response?.data?.message || `Failed to screen ${sym}`);
    } finally {
      setIsScreening(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_UPLOAD_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'irshad-institutional-sample-portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCurrentMandate = async () => {
    if (!isAuthenticatedInstitution) {
      toastError('Sign in with an Institutional account to save mandates.');
      return;
    }
    const payloadHoldings = (activeScreened?.holdings || []).map((h) => ({
      symbol: h.symbol,
      shares: h.shares,
      avg_price: h.current_price,
      label: h.name,
      sector: h.sector,
    }));
    if (payloadHoldings.length === 0) return;

    setIsSaving(true);
    try {
      const res = await saveInstitutionPortfolio({
        id: selectedSavedId || undefined,
        name: customFundName || activeTitle,
        holdings_payload: payloadHoldings,
        factsheet_meta: factsheetMeta || undefined,
      });
      const saved = res?.data?.portfolio;
      if (saved) {
        setSelectedSavedId(saved.id);
        setSavedPortfolios((prev) => {
          const rest = prev.filter((p) => p.id !== saved.id);
          return [saved, ...rest];
        });
        toastSuccess('Saved portfolio mandate to your institutional workspace.');
      }
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to save portfolio mandate.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedMandate = async (saved) => {
    setIsScreening(true);
    try {
      const res = await screenInstitutionPortfolio({ holdings: saved.holdings_payload || [] }, isAuthenticatedInstitution);
      if (res?.data) {
        setCustomScreened(res.data);
        setCustomFundName(saved.name);
        setFactsheetMeta(saved.factsheet_meta || null);
        setSelectedSavedId(saved.id);
        setActivePresetId('uploaded');
        toastSuccess(`Loaded "${saved.name}" with live AAOIFI verdicts.`);
      }
    } catch {
      toastError('Failed to refresh saved mandate.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleDeleteSavedMandate = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteInstitutionPortfolio(id);
      setSavedPortfolios((prev) => prev.filter((p) => p.id !== id));
      if (selectedSavedId === id) setSelectedSavedId(null);
      toastSuccess('Removed saved mandate.');
    } catch {
      toastError('Could not delete mandate.');
    }
  };

  const reevaluateHoldings = async (nextHoldings, nextTitleSuffix = '') => {
    if (nextHoldings.length === 0) {
      toastError('Portfolio must contain at least one holding.');
      return;
    }
    setIsScreening(true);
    try {
      const res = await screenInstitutionPortfolio({ holdings: nextHoldings }, isAuthenticatedInstitution);
      if (res?.data) {
        setCustomScreened(res.data);
        if (activePresetId !== 'uploaded' && nextTitleSuffix) {
          setCustomFundName(`${activeTitle} (${nextTitleSuffix})`);
        }
        setActivePresetId('uploaded');
      }
    } catch (err) {
      toastError(err?.response?.data?.message || 'Re-screening failed.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleRemoveHolding = async (symbol) => {
    const nextHoldings = (activeScreened?.holdings || [])
      .filter((h) => h.symbol !== symbol)
      .map((h) => ({ symbol: h.symbol, shares: h.shares, avg_price: h.current_price }));
    await reevaluateHoldings(nextHoldings, 'Rebalanced');
    toastSuccess(`Simulated divestment of ${symbol}`);
  };

  const handleSwapHolding = async (sourceSymbol, replacement) => {
    const nextHoldings = [];
    let swapped = false;
    (activeScreened?.holdings || []).forEach((h) => {
      if (h.symbol === sourceSymbol) {
        swapped = true;
        if (replacement.estimated_units > 0) {
          nextHoldings.push({
            symbol: replacement.symbol,
            shares: replacement.estimated_units,
            avg_price: replacement.latest_price,
          });
        }
      } else {
        nextHoldings.push({ symbol: h.symbol, shares: h.shares, avg_price: h.current_price });
      }
    });
    if (!swapped) return;
    await reevaluateHoldings(nextHoldings, 'Shariah Rebalanced');
    toastSuccess(`Swapped ${sourceSymbol} → ${replacement.symbol} (${replacement.estimated_units.toLocaleString()} units)`);
  };

  const summary = activeScreened?.summary || {};
  const isNorrenbergerActive = activePresetId === 'norrenberger_fund';
  const institutionLabel = user?.institution_name || (activePresetId === 'lotus_etf' ? 'Lotus Capital Limited (Demo)' : activePresetId === 'norrenberger_fund' ? 'Norrenberger Asset Management (Demo)' : 'Irshad Institutional Desk');

  return (
    <div
      className="institutional-portal-shell"
      style={{
        maxWidth: presentationFullscreen ? '100%' : 1380,
        margin: '0 auto',
        padding: presentationFullscreen ? '20px 28px' : '24px 24px 48px',
        ...(presentationFullscreen ? {
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'var(--body-bg)',
          overflowY: 'auto',
        } : {}),
      }}
    >
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .institutional-factsheet-sheet, .institutional-factsheet-sheet * { visibility: visible !important; }
          .institutional-factsheet-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 12px !important;
          }
          .no-print { display: none !important; }
        }
        .inst-tab-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
        }
        .inst-tab-btn[aria-selected="true"] {
          color: var(--primary);
        }
        .inst-tab-btn[aria-selected="true"]::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          border-block-end: 3px solid var(--primary);
        }
      `}</style>

      {/* Top Executive Header */}
      <header className="no-print" style={{
        background: 'var(--bg)',
        borderRadius: 22,
        padding: '22px 24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #297D66 0%, #45A58A 100%)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-purple)', flexShrink: 0,
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                  padding: '3px 9px', borderRadius: 999,
                  background: 'var(--primary-50)', color: 'var(--primary)', border: '1px solid var(--primary-100)',
                }}>
                  {demoMode || !isAuthenticatedInstitution ? 'Institutional Demo & Presentation' : 'Institutional Role Workspace'}
                </span>
                {user?.institution_type && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    • {user.institution_type}
                  </span>
                )}
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
                {institutionLabel}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {!user && (
              <Link
                to="/register"
                style={{
                  padding: '9px 15px', borderRadius: 11,
                  border: '1px solid var(--primary)', background: 'var(--primary-50)',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none',
                }}
              >
                Create Institution Account
              </Link>
            )}
            {isAuthenticatedInstitution && (
              <button
                type="button"
                onClick={handleSaveCurrentMandate}
                disabled={isSaving || (activeScreened?.holdings || []).length === 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 15px', borderRadius: 11,
                  border: '1px solid var(--border)', background: 'var(--bg-section)',
                  color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                Save Mandate
              </button>
            )}
            <button
              type="button"
              onClick={() => setPresentationFullscreen((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 15px', borderRadius: 11,
                border: 'none', background: '#111827',
                color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              {presentationFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {presentationFullscreen ? 'Exit Fullscreen' : 'Presentation Mode'}
            </button>
          </div>
        </div>

        {/* Institutional Benchmark / Preset Switcher */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginRight: 4 }}>
            Active Portfolio / Showcase:
          </span>
          {[
            { id: 'lotus_etf', label: 'Lotus Halal Equity ETF (13 Stocks)' },
            { id: 'norrenberger_fund', label: 'Norrenberger Islamic Fund (Oct 2026)' },
            { id: 'mixed_institutional_book', label: 'Sample Mixed Bank/Broker Book' },
            ...(customScreened ? [{ id: 'uploaded', label: `Uploaded: ${customFundName}` }] : []),
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePresetId(p.id);
                if (p.id === 'norrenberger_fund' && activeTab === 'screening') {
                  // Let user stay or view allocation cleanly
                }
              }}
              style={{
                padding: '7px 13px',
                borderRadius: 999,
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: `1.5px solid ${activePresetId === p.id ? 'var(--primary)' : 'var(--border)'}`,
                background: activePresetId === p.id ? 'var(--primary)' : 'var(--bg-section)',
                color: activePresetId === p.id ? '#fff' : 'var(--text-dark)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}

          {savedPortfolios.map((sp) => (
            <div key={sp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => handleLoadSavedMandate(sp)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${selectedSavedId === sp.id && activePresetId === 'uploaded' ? 'var(--gold)' : 'var(--border)'}`,
                  background: selectedSavedId === sp.id && activePresetId === 'uploaded' ? 'var(--gold-50)' : 'var(--bg-section)',
                  color: 'var(--text-dark)',
                }}
              >
                <FolderOpen size={12} /> {sp.name}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteSavedMandate(sp.id, e)}
                aria-label={`Delete ${sp.name}`}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </header>

      {/* Executive KPI Strip */}
      <section className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: '18px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {isNorrenbergerActive ? 'Norrenberger Fund Size' : 'Screened Equity AUM'}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: 6 }}>
            {isNorrenbergerActive ? '₦6.81bn' : (loadingPresets ? '...' : formatNaira(summary.total_aum, true))}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {isNorrenbergerActive ? 'Unit Price: ₦108.27 · YTD Yield: 17.72%' : `${summary.holdings_count || 0} constituent positions evaluated`}
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: '18px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Shariah Compliance Rate
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--halal)', marginTop: 6 }}>
            {isNorrenbergerActive ? '100.0%' : `${Number(summary.compliant_pct || 0).toFixed(1)}%`}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {isNorrenbergerActive ? '5/5 Sukuk & Islamic Money Market Contracts' : `${summary.compliant_count || 0} compliant holdings`}
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: '18px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {isNorrenbergerActive ? 'Mandate Drift Alert' : 'Non-Compliant Exposure'}
          </div>
          <div style={{
            fontSize: '1.65rem', fontWeight: 900, marginTop: 6,
            color: isNorrenbergerActive ? '#b45309' : (Number(summary.non_compliant_aum || 0) > 0 ? 'var(--non-compliant)' : 'var(--halal)'),
          }}>
            {isNorrenbergerActive ? '1 Band Watch' : formatNaira(summary.non_compliant_aum || 0, true)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {isNorrenbergerActive
              ? 'FGN Sukuk at 21.79% vs 30%-100% target'
              : (Number(summary.non_compliant_count || 0) > 0
                  ? `${summary.non_compliant_count} holding(s) flagged for divestment`
                  : 'Zero AAOIFI compliance breaches')}
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: '18px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Purification Liability
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b45309', marginTop: 6 }}>
            {activePresetId === 'lotus_etf' ? '₦0.46 / unit' : formatNaira(summary.total_purification_due || 0, true)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {activePresetId === 'lotus_etf'
              ? `Live constituent calc: ${formatNaira(summary.total_purification_due || 0, true)}`
              : `${summary.purify_required_count || 0} holdings require dividend cleansing`}
          </div>
        </div>
      </section>

      {/* Accessible Tabs Navigation */}
      <div className="no-print" style={{
        background: 'var(--bg)',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)',
        borderBottom: '1px solid var(--border-strong)',
        padding: '0 12px',
        marginBottom: 20,
      }}>
        <div
          role="tablist"
          aria-label="Institutional Workspace Views"
          style={{ display: 'flex', overflowX: 'auto', gap: 4 }}
        >
          {TAB_DEFS.map((t, idx) => {
            const Icon = t.icon;
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                id={`inst-tab-${t.id}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleSelectTab(t.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className="inst-tab-btn"
              >
                <Icon size={16} aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PORTFOLIO UPLOAD & SHARIAH VERDICTS */}
      <div role="tabpanel" aria-labelledby="inst-tab-screening" hidden={activeTab !== 'screening'}>
        {activeTab === 'screening' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Upload Dropzone + Manual Add */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                style={{
                  background: isDragging ? 'var(--primary-50)' : 'var(--bg)',
                  borderRadius: 20,
                  padding: 22,
                  border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--primary-50)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isScreening ? <Loader2 size={22} /> : <Upload size={22} />}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Upload Institutional Portfolio / Statement
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Drop a <strong>.CSV, .XLSX, or Broker .PDF</strong> file containing tickers &amp; units. Irshad resolves NGX aliases (e.g., WAPCO → HBMNG) and runs live AAOIFI verdicts &amp; purification.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = '';
                  }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    type="button"
                    disabled={isScreening}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px', borderRadius: 12,
                      background: 'var(--primary)', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >
                    <FileSpreadsheet size={15} /> {isScreening ? 'Screening...' : 'Choose Portfolio File'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '10px 14px', borderRadius: 12,
                      background: 'var(--bg-section)', color: 'var(--text-dark)',
                      border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    <Download size={14} /> Sample CSV Template
                  </button>
                </div>
              </div>

              {/* Manual Quick Ticker Add */}
              <div style={{
                background: 'var(--bg)',
                borderRadius: 20,
                padding: 22,
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="var(--gold)" /> Quick-Add Position to Screener
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Test adding any NGX stock (e.g. <code>SEPLAT</code>, <code>NASCON</code>, <code>ZENITHBANK</code>, <code>AIRTELAFRI</code>) into the active book to see live verdict &amp; purification impact.
                  </p>
                </div>

                <form onSubmit={handleAddManualTicker} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input
                    type="text"
                    value={manualSymbol}
                    onChange={(e) => setManualSymbol(e.target.value)}
                    placeholder="NGX Ticker (e.g. SEPLAT)"
                    aria-label="NGX Ticker Symbol"
                    style={{
                      flex: '1 1 140px', padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                      color: 'var(--text-dark)', fontSize: '0.82rem', fontWeight: 700,
                    }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={manualShares}
                    onChange={(e) => setManualShares(e.target.value)}
                    placeholder="Units"
                    aria-label="Number of units"
                    style={{
                      width: 120, padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                      color: 'var(--text-dark)', fontSize: '0.82rem', fontWeight: 700,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isScreening}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10,
                      background: '#111827', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Screen &amp; Add
                  </button>
                </form>
              </div>
            </div>

            {/* Norrenberger Fixed Income Mandate Table when Norrenberger is selected */}
            {isNorrenbergerActive && (
              <div style={{
                background: 'var(--bg)', borderRadius: 20, padding: '20px 22px',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.98rem', color: '#B91C1C' }}>
                      <CheckCircle2 size={18} /> Norrenberger Islamic Fund — Fixed Income &amp; Sukuk Mandate Audit (₦6.81bn)
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      October 2026 contract-level holdings screened against prospectus Shariah bands &amp; 3-Year FGN Sukuk moving-average benchmark.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('factsheet')}
                    style={{
                      padding: '9px 15px', borderRadius: 11, background: '#DC2626', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    Open Norrenberger Factsheet →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border-strong)' }}>
                        {['Instrument Class', 'Shariah Contract', 'Current %', 'Est. AUM (₦)', 'Target Band', 'Mandate Status'].map((col, idx) => (
                          <th key={col} style={{ padding: '10px 12px', textAlign: idx >= 2 && idx <= 4 ? 'right' : (idx === 5 ? 'center' : 'left'), fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(presets?.norrenberger_fund?.allocation || NORRENBERGER_FALLBACK_DATA.allocation).map((row) => {
                        const outOfBand = row.current < row.target_min || row.current > row.target_max;
                        const estVal = (row.current / 100) * 6810000000;
                        return (
                          <tr key={row.security} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '11px 12px', fontWeight: 800, color: 'var(--text-dark)' }}>{row.security}</td>
                            <td style={{ padding: '11px 12px', color: 'var(--text-body)' }}>{row.shariah_contract}</td>
                            <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800 }}>{row.current.toFixed(2)}%</td>
                            <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700 }}>{formatNaira(estVal, true)}</td>
                            <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{row.target_label}</td>
                            <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800,
                                background: outOfBand ? 'rgba(245, 158, 11, 0.14)' : 'var(--halal-bg)',
                                color: outOfBand ? '#b45309' : 'var(--halal)',
                              }}>
                                {outOfBand ? 'Below Target Band' : 'Compliant · In Band'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Flagged Non-Compliant Alert + Rebalancing Replacement Advisor */}
            {Number(summary.non_compliant_count || 0) > 0 && !isNorrenbergerActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  padding: '14px 18px', borderRadius: 14,
                  background: 'var(--non-compliant-bg)', border: '1px solid var(--non-compliant-border)',
                  color: 'var(--non-compliant)', display: 'flex', alignItems: 'center', gap: 12,
                  fontSize: '0.84rem', fontWeight: 700,
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    Compliance Breach Alert: {summary.non_compliant_count} position(s) totaling {formatNaira(summary.non_compliant_aum)} ({Number(summary.non_compliant_pct || 0).toFixed(2)}% of AUM) failed AAOIFI screening and require divestment or rebalancing.
                  </span>
                </div>

                {(activeScreened?.rebalancing_suggestions || []).length > 0 && (
                  <div style={{
                    background: 'var(--bg)', borderRadius: 18, padding: '18px 20px',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)', marginBottom: 12 }}>
                      <ArrowLeftRight size={16} color="var(--primary)" /> Irshad Shariah Rebalancing &amp; Compliant Replacement Simulator
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
                      {activeScreened.rebalancing_suggestions.map((sug) => (
                        <div key={sug.source_symbol} style={{ padding: 14, borderRadius: 14, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div>
                              <span style={{ fontWeight: 900, fontSize: '0.84rem', color: 'var(--non-compliant)' }}>{sug.source_symbol}</span>
                              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: 6 }}>({formatNaira(sug.source_market_value, true)})</span>
                            </div>
                            <button
                              type="button"
                              disabled={isScreening}
                              onClick={() => handleRemoveHolding(sug.source_symbol)}
                              style={{
                                padding: '4px 9px', borderRadius: 8, border: '1px solid var(--non-compliant-border)',
                                background: 'var(--non-compliant-bg)', color: 'var(--non-compliant)',
                                fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              Divest
                            </button>
                          </div>
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                            Suggested Halal Sector Replacements ({sug.source_sector}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sug.replacements.map((rep) => (
                              <button
                                key={rep.symbol}
                                type="button"
                                disabled={isScreening}
                                onClick={() => handleSwapHolding(sug.source_symbol, rep)}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                                  padding: '7px 10px', borderRadius: 9,
                                  border: '1px solid var(--halal-border)', background: 'var(--halal-bg)',
                                  color: 'var(--halal)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                                }}
                              >
                                <span>Swap → <strong>{rep.symbol}</strong> ({rep.estimated_units.toLocaleString()} u)</span>
                                <span>₦{Number(rep.latest_price).toFixed(2)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <InstitutionalVerdictsTable
              holdings={activeScreened?.holdings || []}
              title={isNorrenbergerActive ? 'NGX Shariah-Compliant Equity Universe Reference (Lotus/Irshad Benchmark)' : `${activeTitle} — AAOIFI Screening Verdicts`}
              onRemoveHolding={!isNorrenbergerActive ? handleRemoveHolding : undefined}
            />
          </div>
        )}
      </div>

      {/* TAB 2: PURIFICATION ENGINE */}
      <div role="tabpanel" aria-labelledby="inst-tab-purification" hidden={activeTab !== 'purification'}>
        {activeTab === 'purification' && (
          <InstitutionalPurificationPanel
            screened={activeScreened}
            activePresetId={activePresetId}
            fundName={activeTitle}
          />
        )}
      </div>

      {/* TAB 3: FACTSHEET STUDIO */}
      <div role="tabpanel" aria-labelledby="inst-tab-factsheet" hidden={activeTab !== 'factsheet'}>
        {activeTab === 'factsheet' && (
          <InstitutionalFactsheetView
            key={activePresetId}
            lotusData={presets?.lotus_etf}
            norrenbergerData={presets?.norrenberger_fund}
            screened={activeScreened}
            activePresetId={activePresetId}
            customFundName={activeTitle}
            institutionName={user?.institution_name || 'Irshad Institutional Services'}
            factsheetMeta={factsheetMeta}
            onChangeFactsheetMeta={setFactsheetMeta}
          />
        )}
      </div>

      {/* TAB 4: MEETING PRESENTATION DECK */}
      <div role="tabpanel" aria-labelledby="inst-tab-presentation" hidden={activeTab !== 'presentation'}>
        {activeTab === 'presentation' && (
          <InstitutionalPresentationDeck
            lotusData={presets?.lotus_etf}
            mixedData={presets?.mixed_institutional_book}
            onJumpToTab={handleSelectTab}
            onSelectPreset={setActivePresetId}
          />
        )}
      </div>
    </div>
  );
}
