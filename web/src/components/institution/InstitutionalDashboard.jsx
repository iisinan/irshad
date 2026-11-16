import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Building2, Upload, FileSpreadsheet, ShieldCheck, AlertTriangle,
  Droplet, FileText, Presentation, Download, Plus, Save, Trash2,
  CheckCircle2, Maximize2, Minimize2, Loader2, ArrowLeftRight, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchInstitutionDemoPresets,
  fetchInstitutionWorkspace,
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
import InstitutionalApiPanel from './InstitutionalApiPanel';
import {
  LOTUS_FALLBACK_DATA,
  NORRENBERGER_FALLBACK_DATA,
  SAMPLE_UPLOAD_CSV,
  formatNaira,
} from './institutionalFixtures';

const TAB_DEFS = [
  { id: 'screening', label: 'Portfolio & Verdicts', icon: ShieldCheck },
  { id: 'purification', label: 'Purification', icon: Droplet },
  { id: 'factsheet', label: 'Factsheet', icon: FileText },
  { id: 'api', label: 'API & Guardrails', icon: Key },
  { id: 'presentation', label: 'Presentation Deck', icon: Presentation },
];

export default function InstitutionalDashboard({ demoMode = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const tabRefs = useRef([]);

  const isAuthenticatedInstitution = Boolean(user && ['institution', 'admin'].includes(user.role));
  const isPrivatePortal = !demoMode && user?.role === 'institution';
  const showDemoFeatures = !isPrivatePortal;

  const visibleTabs = useMemo(
    () => (showDemoFeatures ? TAB_DEFS : TAB_DEFS.filter((t) => t.id !== 'presentation')),
    [showDemoFeatures]
  );

  const getHashTab = () => {
    const raw = (location.hash || '').replace('#', '').trim();
    const allowed = showDemoFeatures ? TAB_DEFS : TAB_DEFS.filter((t) => t.id !== 'presentation');
    return allowed.some((t) => t.id === raw) ? raw : 'screening';
  };

  const [activeTab, setActiveTab] = useState(getHashTab);
  const [presets, setPresets] = useState(null);
  const [tenantKey, setTenantKey] = useState(isPrivatePortal ? 'custom' : 'admin');
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [activePresetId, setActivePresetId] = useState(isPrivatePortal ? 'loading' : 'lotus_etf');
  const [customScreened, setCustomScreened] = useState(null);
  const [customFundName, setCustomFundName] = useState('Institutional Equity Mandate');
  const [factsheetMeta, setFactsheetMeta] = useState(null);

  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [presentationFullscreen, setPresentationFullscreen] = useState(false);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);

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
        if (isPrivatePortal) {
          const res = await fetchInstitutionWorkspace();
          if (mounted && res?.data) {
            const ws = res.data;
            setTenantKey(ws.tenant_key || 'custom');
            setPresets({
              lotus_etf: ws.lotus_etf || null,
              norrenberger_fund: ws.norrenberger_fund || null,
            });
            const saved = ws.saved_portfolios || [];
            setSavedPortfolios(saved);

            if (ws.tenant_key === 'lotus' && ws.lotus_etf) {
              setActivePresetId('lotus_etf');
            } else if (ws.tenant_key === 'norrenberger' && ws.norrenberger_fund) {
              setActivePresetId('norrenberger_fund');
            } else if (saved.length > 0) {
              setCustomScreened(saved[0].screened);
              setCustomFundName(saved[0].name);
              setFactsheetMeta(saved[0].factsheet_meta || null);
              setSelectedSavedId(saved[0].id);
              setActivePresetId('uploaded');
            } else {
              setActivePresetId('uploaded');
            }
          }
        } else {
          const res = await fetchInstitutionDemoPresets();
          if (mounted && res?.data) {
            setPresets(res.data);
            setTenantKey('admin');
            setActivePresetId('lotus_etf');
          }
          if (isAuthenticatedInstitution) {
            fetchInstitutionPortfolios()
              .then((pRes) => {
                if (mounted) setSavedPortfolios(pRes?.data || []);
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to load institutional workspace:', err);
      } finally {
        if (mounted) setLoadingPresets(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isPrivatePortal, isAuthenticatedInstitution]);

  const activeScreened = useMemo(() => {
    if (activePresetId === 'uploaded') return customScreened || { holdings: [], summary: {}, sector_allocation: [] };
    if (activePresetId === 'lotus_etf') return presets?.lotus_etf?.screening_result || { holdings: [], summary: {}, sector_allocation: [] };
    if (activePresetId === 'mixed_institutional_book' && showDemoFeatures) {
      return presets?.mixed_institutional_book || { holdings: [], summary: {}, sector_allocation: [] };
    }
    if (activePresetId === 'norrenberger_fund') {
      return { holdings: [], summary: {}, sector_allocation: [] };
    }
    return customScreened || { holdings: [], summary: {}, sector_allocation: [] };
  }, [activePresetId, customScreened, presets, showDemoFeatures]);

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
      const next = (idx + 1) % visibleTabs.length;
      handleSelectTab(visibleTabs[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + visibleTabs.length) % visibleTabs.length;
      handleSelectTab(visibleTabs[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      handleSelectTab(visibleTabs[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      handleSelectTab(visibleTabs[visibleTabs.length - 1].id);
      tabRefs.current[visibleTabs.length - 1]?.focus();
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
        setShowUploadDrawer(false);
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
        toastSuccess('Saved portfolio mandate.');
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
      }
    } catch {
      toastError('Failed to refresh saved mandate.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleDeleteSavedMandate = async (id) => {
    try {
      await deleteInstitutionPortfolio(id);
      const remaining = savedPortfolios.filter((p) => p.id !== id);
      setSavedPortfolios(remaining);
      if (selectedSavedId === id) {
        setSelectedSavedId(null);
        setCustomScreened(null);
        if (tenantKey === 'lotus') setActivePresetId('lotus_etf');
        else if (tenantKey === 'norrenberger') setActivePresetId('norrenberger_fund');
      }
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
    toastSuccess(`Swapped ${sourceSymbol} → ${replacement.symbol}`);
  };

  const summary = activeScreened?.summary || {};
  const isNorrenbergerActive = activePresetId === 'norrenberger_fund';
  const hasHoldings = (activeScreened?.holdings || []).length > 0;
  const nearThresholdHoldings = useMemo(
    () => (activeScreened?.holdings || []).filter((h) => h.is_near_threshold),
    [activeScreened?.holdings]
  );

  const allowedFactsheetTemplates = useMemo(() => {
    if (showDemoFeatures) return ['lotus', 'norrenberger', 'custom'];
    if (tenantKey === 'lotus') return ['lotus', 'custom'];
    if (tenantKey === 'norrenberger') return ['norrenberger', 'custom'];
    return ['custom'];
  }, [showDemoFeatures, tenantKey]);

  const institutionLabel = isPrivatePortal
    ? (user?.institution_name || user?.name || 'Institutional Desk')
    : (user?.institution_name || (activePresetId === 'lotus_etf' ? 'Lotus Capital Limited (Demo)' : activePresetId === 'norrenberger_fund' ? 'Norrenberger Asset Management (Demo)' : 'Irshad Institutional Demo'));

  const mandateOptions = useMemo(() => {
    const opts = [];
    if (showDemoFeatures) {
      opts.push({ value: 'preset:lotus_etf', label: 'Lotus Halal Equity ETF (13 Stocks)' });
      opts.push({ value: 'preset:norrenberger_fund', label: 'Norrenberger Islamic Fund (Oct 2026)' });
      opts.push({ value: 'preset:mixed_institutional_book', label: 'Sample Mixed Broker Book' });
    } else {
      if (tenantKey === 'lotus' && presets?.lotus_etf) {
        opts.push({ value: 'preset:lotus_etf', label: 'Lotus Halal Equity ETF (LOTUSHAL15)' });
      }
      if (tenantKey === 'norrenberger' && presets?.norrenberger_fund) {
        opts.push({ value: 'preset:norrenberger_fund', label: 'Norrenberger Islamic Fund' });
      }
    }
    savedPortfolios.forEach((sp) => {
      opts.push({ value: `saved:${sp.id}`, label: sp.name });
    });
    if (customScreened && !selectedSavedId) {
      opts.push({ value: 'preset:uploaded', label: `${customFundName} (Unsaved)` });
    }
    return opts;
  }, [showDemoFeatures, tenantKey, presets, savedPortfolios, customScreened, selectedSavedId, customFundName]);

  const selectedMandateValue = selectedSavedId && activePresetId === 'uploaded'
    ? `saved:${selectedSavedId}`
    : `preset:${activePresetId}`;

  const handleMandateChange = (val) => {
    if (val.startsWith('saved:')) {
      const id = Number(val.replace('saved:', ''));
      const found = savedPortfolios.find((s) => s.id === id);
      if (found) handleLoadSavedMandate(found);
      return;
    }
    const presetKey = val.replace('preset:', '');
    setSelectedSavedId(null);
    setActivePresetId(presetKey);
  };

  return (
    <div
      className="institutional-portal-shell"
      style={{
        maxWidth: presentationFullscreen ? '100%' : 1280,
        margin: '0 auto',
        padding: presentationFullscreen ? '20px 28px' : '20px 24px 48px',
        ...(presentationFullscreen ? {
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'var(--body-bg)',
          overflowY: 'auto',
        } : {}),
      }}
    >
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

      {/* Hidden File Input (always mounted for header/action buttons) */}
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

      {/* Clean Single-Row Institutional Header */}
      <header className="no-print" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #297D66 0%, #45A58A 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
              {institutionLabel}
            </h1>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {user?.institution_type || 'Institutional Desk'} · AAOIFI Shariah Compliance
            </div>
          </div>
        </div>

        {/* Right Controls: Clean Mandate Dropdown + Primary Action */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {mandateOptions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                aria-label="Select portfolio or mandate"
                value={selectedMandateValue}
                onChange={(e) => handleMandateChange(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text-dark)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  maxWidth: 280,
                }}
              >
                {mandateOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {selectedSavedId && (
                <button
                  type="button"
                  onClick={() => handleDeleteSavedMandate(selectedSavedId)}
                  title="Delete selected mandate"
                  aria-label="Delete selected mandate"
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {isAuthenticatedInstitution && hasHoldings && (
            <button
              type="button"
              onClick={handleSaveCurrentMandate}
              disabled={isSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                border: '1px solid var(--border-strong)', background: 'var(--bg)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              {isSaving ? <Loader2 size={14} /> : <Save size={14} />}
              Save
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'screening') handleSelectTab('screening');
              setShowUploadDrawer((v) => !v);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 15px', borderRadius: 10,
              border: 'none', background: 'var(--primary)',
              color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <Upload size={14} /> Screen Portfolio
          </button>

          {!user && (
            <Link
              to="/login"
              style={{
                padding: '9px 14px', borderRadius: 10,
                border: '1px solid var(--border-strong)', background: 'var(--bg)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          )}

          {showDemoFeatures && (
            <button
              type="button"
              onClick={() => setPresentationFullscreen((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                border: 'none', background: '#111827',
                color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              {presentationFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {presentationFullscreen ? 'Exit' : 'Present'}
            </button>
          )}
        </div>
      </header>

      {/* 3 Clean KPI Cards */}
      {(isNorrenbergerActive || hasHoldings || loadingPresets) && (
        <section className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 18 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {isNorrenbergerActive ? 'Fund Size (Oct 2026)' : 'Portfolio Value'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: 4 }}>
              {isNorrenbergerActive ? '₦6.81bn' : (loadingPresets ? '...' : formatNaira(summary.total_aum, true))}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {isNorrenbergerActive ? 'Unit Price: ₦108.27 · YTD Yield: 17.72%' : `${summary.holdings_count || 0} holdings screened`}
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Shariah Compliance
            </div>
            <div style={{
              fontSize: '1.6rem', fontWeight: 900, marginTop: 4,
              color: !isNorrenbergerActive && Number(summary.non_compliant_count || 0) > 0 ? '#b45309' : 'var(--halal)',
            }}>
              {isNorrenbergerActive ? '100.0%' : `${Number(summary.compliant_pct || 0).toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {isNorrenbergerActive
                ? '5/5 Islamic fixed-income sleeves'
                : (Number(summary.non_compliant_count || 0) > 0
                    ? `${summary.non_compliant_count} flagged (${formatNaira(summary.non_compliant_aum, true)})`
                    : `${summary.compliant_count || 0} compliant · 0 breaches`)}
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {isNorrenbergerActive ? 'Mandate Watch' : 'Purification Due'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>
              {isNorrenbergerActive
                ? '1 Band Watch'
                : (activePresetId === 'lotus_etf' ? '₦0.46 / unit' : formatNaira(summary.total_purification_due || 0, true))}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {isNorrenbergerActive
                ? 'FGN Sukuk at 21.79% vs 30%-100% band'
                : (activePresetId === 'lotus_etf'
                    ? `FY25 ETF rate · Live total: ${formatNaira(summary.total_purification_due || 0, true)}`
                    : `${summary.purify_required_count || 0} holdings need dividend cleansing`)}
            </div>
          </div>
        </section>
      )}

      {/* Simple Single-Row Tabs */}
      <div className="no-print" style={{
        background: 'var(--bg)',
        borderRadius: '14px 14px 0 0',
        border: '1px solid var(--border)',
        borderBottom: '1px solid var(--border-strong)',
        padding: '0 10px',
        marginBottom: 18,
      }}>
        <div
          role="tablist"
          aria-label="Institutional Workspace Views"
          style={{ display: 'flex', overflowX: 'auto', gap: 4 }}
        >
          {visibleTabs.map((t, idx) => {
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
                <Icon size={15} aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PORTFOLIO & VERDICTS */}
      <div role="tabpanel" aria-labelledby="inst-tab-screening" hidden={activeTab !== 'screening'}>
        {activeTab === 'screening' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toggleable Upload Drawer (OR automatic centered onboarding when no holdings exist) */}
            {(showUploadDrawer || (!hasHoldings && !isNorrenbergerActive && !loadingPresets)) && (
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
                  borderRadius: 18,
                  padding: '24px',
                  border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 18,
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Upload Portfolio or Broker Statement
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Drop a <strong>.CSV, .XLSX, or Broker .PDF</strong> to generate live AAOIFI verdicts, purification calculations, and a factsheet.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                    <button
                      type="button"
                      disabled={isScreening}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 10, border: 'none',
                        background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                      }}
                    >
                      <FileSpreadsheet size={15} /> {isScreening ? 'Screening...' : 'Choose File'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 14px', borderRadius: 10,
                        border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                        color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                      }}
                    >
                      <Download size={14} /> Sample CSV
                    </button>
                  </div>
                </div>

                {/* Inline Quick-Add Ticker */}
                <form onSubmit={handleAddManualTicker} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: '1 1 300px', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    value={manualSymbol}
                    onChange={(e) => setManualSymbol(e.target.value)}
                    placeholder="Add NGX ticker (e.g. SEPLAT)"
                    aria-label="NGX Ticker Symbol"
                    style={{
                      flex: '1 1 150px', maxWidth: 210, padding: '9px 12px', borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                      color: 'var(--text-dark)', fontSize: '0.8rem', fontWeight: 700,
                    }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={manualShares}
                    onChange={(e) => setManualShares(e.target.value)}
                    placeholder="Units"
                    aria-label="Units"
                    style={{
                      width: 100, padding: '9px 10px', borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                      color: 'var(--text-dark)', fontSize: '0.8rem', fontWeight: 700,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isScreening}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '9px 14px', borderRadius: 10, border: 'none',
                      background: '#111827', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </form>
              </div>
            )}

            {/* Norrenberger Fixed Income Mandate Table */}
            {isNorrenbergerActive && (
              <div style={{
                background: 'var(--bg)', borderRadius: 18, padding: '18px 20px',
                border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.96rem', color: '#B91C1C' }}>
                      <CheckCircle2 size={17} /> Fixed Income &amp; Sukuk Mandate Audit (₦6.81bn)
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.79rem', color: 'var(--text-muted)' }}>
                      Contract allocation vs prospectus Shariah mandate bands (October 2026).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('factsheet')}
                    style={{
                      padding: '8px 14px', borderRadius: 10, background: '#DC2626', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    View Factsheet →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border-strong)' }}>
                        {['Instrument Class', 'Shariah Contract', 'Current %', 'Est. AUM', 'Target Band', 'Status'].map((col, idx) => (
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
                                {outOfBand ? 'Below Band' : 'Compliant'}
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

            {/* Near-Threshold Drift Watch Alert */}
            {!isNorrenbergerActive && nearThresholdHoldings.length > 0 && (
              <div style={{
                padding: '11px 16px', borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.28)',
                color: '#92400e', fontSize: '0.8rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Drift Watch: <strong>{nearThresholdHoldings.map((h) => h.symbol).join(', ')}</strong> {nearThresholdHoldings.length === 1 ? 'is' : 'are'} approaching AAOIFI quantitative thresholds (Debt/Cash ≥ 25% or Impure Income ≥ 4%).
                </span>
              </div>
            )}

            {/* Flagged Non-Compliant + 1-Click Rebalancing Advisor */}
            {Number(summary.non_compliant_count || 0) > 0 && !isNorrenbergerActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: 'var(--non-compliant-bg)', border: '1px solid var(--non-compliant-border)',
                  color: 'var(--non-compliant)', display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.82rem', fontWeight: 700,
                }}>
                  <AlertTriangle size={17} style={{ flexShrink: 0 }} />
                  <span>
                    {summary.non_compliant_count} position(s) totaling {formatNaira(summary.non_compliant_aum)} ({Number(summary.non_compliant_pct || 0).toFixed(1)}% of portfolio) failed AAOIFI screening.
                  </span>
                </div>

                {(activeScreened?.rebalancing_suggestions || []).length > 0 && (
                  <div style={{
                    background: 'var(--bg)', borderRadius: 16, padding: '16px 18px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: 10 }}>
                      <ArrowLeftRight size={15} color="var(--primary)" /> Compliant Rebalancing Suggestions
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {activeScreened.rebalancing_suggestions.map((sug) => (
                        <div key={sug.source_symbol} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 900, fontSize: '0.82rem', color: 'var(--non-compliant)' }}>
                              {sug.source_symbol} <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>({formatNaira(sug.source_market_value, true)})</span>
                            </span>
                            <button
                              type="button"
                              disabled={isScreening}
                              onClick={() => handleRemoveHolding(sug.source_symbol)}
                              style={{
                                padding: '3px 8px', borderRadius: 7, border: '1px solid var(--non-compliant-border)',
                                background: 'var(--non-compliant-bg)', color: 'var(--non-compliant)',
                                fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              Divest
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {sug.replacements.map((rep) => (
                              <button
                                key={rep.symbol}
                                type="button"
                                disabled={isScreening}
                                onClick={() => handleSwapHolding(sug.source_symbol, rep)}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '6px 9px', borderRadius: 8,
                                  border: '1px solid var(--halal-border)', background: 'var(--halal-bg)',
                                  color: 'var(--halal)', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer',
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

            {hasHoldings && (
              <InstitutionalVerdictsTable
                holdings={activeScreened?.holdings || []}
                title={`${activeTitle} — AAOIFI Screening Verdicts`}
                onRemoveHolding={handleRemoveHolding}
              />
            )}
          </div>
        )}
      </div>

      {/* TAB 2: PURIFICATION */}
      <div role="tabpanel" aria-labelledby="inst-tab-purification" hidden={activeTab !== 'purification'}>
        {activeTab === 'purification' && (
          <InstitutionalPurificationPanel
            screened={activeScreened}
            activePresetId={activePresetId}
            fundName={activeTitle}
          />
        )}
      </div>

      {/* TAB 3: FACTSHEET */}
      <div role="tabpanel" aria-labelledby="inst-tab-factsheet" hidden={activeTab !== 'factsheet'}>
        {activeTab === 'factsheet' && (
          <InstitutionalFactsheetView
            key={`${activePresetId}-${tenantKey}`}
            lotusData={presets?.lotus_etf}
            norrenbergerData={presets?.norrenberger_fund}
            screened={activeScreened}
            activePresetId={activePresetId}
            customFundName={activeTitle}
            institutionName={user?.institution_name || 'Irshad Institutional Services'}
            factsheetMeta={factsheetMeta}
            onChangeFactsheetMeta={setFactsheetMeta}
            allowedTemplates={allowedFactsheetTemplates}
          />
        )}
      </div>

      {/* TAB 4: API & GUARDRAILS */}
      <div role="tabpanel" aria-labelledby="inst-tab-api" hidden={activeTab !== 'api'}>
        {activeTab === 'api' && (
          <InstitutionalApiPanel isAuthenticatedInstitution={isAuthenticatedInstitution} />
        )}
      </div>

      {/* TAB 5: MEETING PRESENTATION DECK (Demo / Admin only) */}
      {showDemoFeatures && (
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
      )}
    </div>
  );
}
