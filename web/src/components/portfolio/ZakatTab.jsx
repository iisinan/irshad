import React, { useState, useEffect } from 'react';
import { Calculator, Download, Coins, Wheat, Bug as Cow, Scale, CheckCircle2, RefreshCw, AlertCircle, Calendar, Bell, Edit2, ChevronDown, ChevronUp, Info, Sliders } from 'lucide-react';
import api, { getSettings } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';

function getCowZakat(n) {
  if (n < 30) return 'None (Below Nisab)';
  
  let bestX = 0, bestY = 0, minRem = n;
  for (let x = Math.floor(n/30); x >= 0; x--) {
    let rem = n - (x * 30);
    let y = Math.floor(rem / 40);
    let finalRem = rem - (y * 40);
    if (finalRem < minRem) {
      minRem = finalRem;
      bestX = x;
      bestY = y;
    }
  }
  let res = [];
  if (bestX > 0) res.push(`${bestX} Yearling(s)`);
  if (bestY > 0) res.push(`${bestY} Two-year-old(s)`);
  return res.join(' & ');
}

function getSheepZakat(n) {
  if (n < 40) return 'None (Below Nisab)';
  if (n <= 120) return '1 Sheep/Goat';
  if (n <= 200) return '2 Sheep/Goats';
  if (n <= 399) return '3 Sheep/Goats';
  return `${Math.floor(n / 100)} Sheep/Goats`;
}

export default function ZakatTab({ data }) {
  // ─── Hawl date from localStorage (set via AddHoldingModal) ───────────────
  const ZAKAT_DATE_KEY = 'irshad_zakat_hawl_date';
  const [hawlDate, setHawlDate] = useState(() => localStorage.getItem(ZAKAT_DATE_KEY) || null);
  const [editingHawl, setEditingHawl] = useState(false);
  const [hawlInput, setHawlInput] = useState(hawlDate || '');

  useEffect(() => {
    const stored = localStorage.getItem(ZAKAT_DATE_KEY);
    if (stored !== hawlDate) {
      setHawlDate(stored);
      setHawlInput(stored || '');
    }
  }, [data, hawlDate]);

  const hawlDueDate = hawlDate ? (() => {
    const d = new Date(hawlDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    while (d < today) {
      d.setDate(d.getDate() + 354);
    }
    return d;
  })() : null;

  const daysUntilDue = hawlDueDate ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = hawlDueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })() : null;

  const saveHawlDate = async () => {
    if (hawlInput) {
      localStorage.setItem(ZAKAT_DATE_KEY, hawlInput);
      setHawlDate(hawlInput);
      setEditingHawl(false);
      try {
        await api.put('/profile', { preferences: { zakat_hawl_date: hawlInput } });
        toastSuccess('Zakat date saved');
      } catch (err) {
        toastError('Failed to save to cloud, but saved locally');
      }
    }
  };

  const clearHawlDate = async () => {
    localStorage.removeItem(ZAKAT_DATE_KEY);
    localStorage.removeItem('irshad_zakat_date_asked');
    setHawlDate(null);
    setHawlInput('');
    setEditingHawl(false);
    try {
      await api.put('/profile', { preferences: { zakat_hawl_date: null } });
      toastSuccess('Zakat date cleared');
    } catch (err) {
      toastError('Failed to clear from cloud');
    }
  };

  const [exchangeRate, setExchangeRate] = useState(1600); // USD to NGN default
  const [goldPrice, setGoldPrice] = useState(150000); // NGN per gram default
  const [silverPrice, setSilverPrice] = useState(2500); // NGN per gram default
  const [nisabStandard, setNisabStandard] = useState('gold'); // gold or silver
  const [showAdvancedAssets, setShowAdvancedAssets] = useState(false);
  const [showNisabSettings, setShowNisabSettings] = useState(false);
  const [isFetchingNisab, setIsFetchingNisab] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [overrideActive, setOverrideActive] = useState(false);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      if (res?.data) {
        let currentRate = 1600;
        if (res.data.zakat_exchange_rate) {
          currentRate = Number(res.data.zakat_exchange_rate);
          setExchangeRate(currentRate);
        }

        // Only use override if it's a real positive number
        const override = Number(res.data.zakat_gold_price_override);
        if (override > 0) {
          setGoldPrice(override);
          setOverrideActive(true);
        } else {
          setOverrideActive(false);
          await fetchLiveNisab(currentRate);
        }
      } else {
        await fetchLiveNisab(exchangeRate);
      }
    } catch (err) {
      console.error('Failed to load Zakat settings:', err);
      await fetchLiveNisab(exchangeRate);
    }
  };

  // Financial State
  const [cash, setCash] = useState('');
  const [goldGrams, setGoldGrams] = useState('');
  const [silverGrams, setSilverGrams] = useState('');
  const portfolioValue = data?.summary?.total_balance || 0;

  // Livestock State
  const [sheepCount, setSheepCount] = useState('');
  const [cowCount, setCowCount] = useState('');

  // Agriculture State
  const [harvestWeight, setHarvestWeight] = useState('');
  const [irrigation, setIrrigation] = useState('natural'); // natural, artificial

  // Financial Calculations
  const activeNisabThreshold = nisabStandard === 'gold' ? 85 : 595;
  const activePricePerGram = nisabStandard === 'gold' ? (goldPrice > 0 ? goldPrice : 150000) : (silverPrice > 0 ? silverPrice : 2500);
  const financialNisab = activePricePerGram * activeNisabThreshold;
  
  const cashNum = Number(cash) || 0;
  const goldNum = (Number(goldGrams) || 0) * goldPrice;
  const silverNum = (Number(silverGrams) || 0) * silverPrice;
  
  const grossWealth = portfolioValue + cashNum + goldNum + silverNum;
  const totalWealth = Math.max(0, grossWealth);
  const financialEligible = totalWealth >= financialNisab;
  const financialZakatDue = financialEligible ? totalWealth * 0.025 : 0;

  // Livestock Calculations
  const sheepNum = Number(sheepCount) || 0;
  const cowNum = Number(cowCount) || 0;
  const sheepZakat = getSheepZakat(sheepNum);
  const cowZakat = getCowZakat(cowNum);

  // Agriculture Calculations
  const harvestNum = Number(harvestWeight) || 0;
  const agriNisab = 653; // 5 Awsuq in kg
  const agriEligible = harvestNum >= agriNisab;
  const agriRate = irrigation === 'natural' ? 0.1 : 0.05;
  const agriZakatDue = agriEligible ? harvestNum * agriRate : 0;

  const fetchLiveNisab = async (rateToUse = exchangeRate) => {
    if (overrideActive) return; // Don't fetch if override is active
    setIsFetchingNisab(true);
    setFetchError('');
    try {
      const resGold = await fetch('https://api.gold-api.com/price/XAU');
      if (!resGold.ok) throw new Error('Failed to fetch gold price');
      const apiData = await resGold.json();
      const pricePerGramUsd = apiData.price / 31.1035; // Troy Ounce to Gram
      setGoldPrice(Math.round(pricePerGramUsd * rateToUse));
      
      try {
        const resSilver = await fetch('https://api.gold-api.com/price/XAG');
        if (resSilver.ok) {
          const silData = await resSilver.json();
          setSilverPrice(Math.round((silData.price / 31.1035) * rateToUse));
        }
      } catch (e) { console.error('Silver fetch failed', e); }
      
    } catch (err) {
      console.error(err);
      setFetchError('Could not fetch live price. Please enter manually.');
    } finally {
      setIsFetchingNisab(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in stagger-1 zakat-print-container" style={{ paddingBottom: '60px' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .zakat-print-container, .zakat-print-container * { visibility: visible; }
          .zakat-print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; margin-bottom: 24px; }
        }
      `}</style>
      
      {/* Official Print Header */}
      <div className="print-only" style={{ marginBottom: '40px', borderBottom: '2px solid black', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Zakat Statement</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>Date: {new Date().toLocaleDateString()}</p>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>Generated by Irshad</p>
      </div>
      
      {/* Hero Banner */}
      <div className="no-print zakat-hero" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'32px 24px', boxShadow:'0 20px 40px rgba(13,27,42,0.2), inset 0 1px 0 rgba(255,255,255,0.1)', border:'none', marginBottom: '36px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 80% 0%, rgba(201,168,76,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 100%, rgba(34,197,176,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%', filter: 'blur(30px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <Scale size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Comprehensive Zakat</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginTop: '8px', margin: 0, fontWeight: 500 }}>A simple, smart calculator for all your asset classes.</p>
          </div>
        </div>
      </div>

      {/* ─── Hawl (Zakat) Date Banner ─── */}
      {hawlDate && !editingHawl ? (
        <div className="no-print" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.04) 100%)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '20px', padding: '24px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={20} color="#d4af37" />
              </div>
              <div>
                <div style={{ fontSize: '0.63rem', fontWeight: 800, color: '#b89326', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Your Zakat (Hawl) Date
                  <div className="fiqh-tooltip">
                    <Info size={12} color="#b89326" />
                    <span className="tooltip-text">A lunar year (354 days). Zakat is only due if your wealth remains above the Nisab threshold for this entire period.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Started:</span> {new Date(hawlDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Due:</span> {hawlDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {daysUntilDue !== null && (
                    <span style={{ padding: '4px 12px', borderRadius: '100px', background: daysUntilDue <= 30 ? 'rgba(239,68,68,0.1)' : daysUntilDue <= 90 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: daysUntilDue <= 30 ? '#dc2626' : daysUntilDue <= 90 ? '#d97706' : '#16a34a', fontSize: '0.72rem', fontWeight: 800 }}>
                      {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : 'Zakat Due Now!'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => { setHawlInput(hawlDate); setEditingHawl(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <Edit2 size={13} /> Edit Date
            </button>
          </div>
          
          {/* Hawl Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(212,175,55,0.15)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, ((354 - Math.max(0, daysUntilDue)) / 354) * 100))}%`, height: '100%', background: daysUntilDue <= 30 ? '#dc2626' : daysUntilDue <= 90 ? '#d97706' : 'linear-gradient(90deg, #d4af37 0%, #b89326 100%)', transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
        </div>
      ) : !hawlDate || editingHawl ? (
        <div className="no-print" style={{ background: 'var(--bg)', border: '2px dashed rgba(212,175,55,0.35)', borderRadius: '20px', padding: '22px 28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: editingHawl ? '16px' : '0', flexWrap: 'wrap' }}>
            <Calendar size={18} color="#d4af37" />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-dark)' }}>Set your Hawl (Zakat start) date</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>— The date you first owned zakatable wealth</span>
          </div>
          {editingHawl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <input type="date" value={hawlInput} max={new Date().toISOString().split('T')[0]} onChange={e => setHawlInput(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.88rem', fontWeight: 700, outline: 'none', color: 'var(--text-dark)', background: 'var(--bg-section)' }} />
              <button onClick={saveHawlDate} disabled={!hawlInput} style={{ padding: '10px 20px', borderRadius: '10px', background: hawlInput ? 'var(--primary)' : 'var(--bg-section)', border: 'none', color: hawlInput ? 'white' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.8rem', cursor: hawlInput ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>Save</button>
              {hawlDate && <button onClick={() => setEditingHawl(false)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>}
              {hawlDate && <button onClick={clearHawlDate} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Clear</button>}
            </div>
          )}
          {!editingHawl && (
            <button onClick={() => setEditingHawl(true)} style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#b89326', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Calendar size={13} /> Set Date
            </button>
          )}
        </div>
      ) : null}

      <div className="zakat-two-col" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Calculators */}
        <div className="zakat-left-col" style={{ flex: '1 1 min(100%, 60%)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Smart Nisab Setup */}
          <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'36px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Smart Nisab Configurations <span style={{ padding: '4px 8px', background: 'var(--primary-10)', color: 'var(--primary)', fontSize: '0.66rem', borderRadius: '8px', fontWeight: 800 }}>LIVE</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>Manage your minimum thresholds for Zakat eligibility.</p>
              </div>
              <button onClick={() => setShowNisabSettings(!showNisabSettings)} className="no-print hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: showNisabSettings ? 'var(--bg-section)' : 'var(--bg-alt)', color: 'var(--text-dark)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <Sliders size={16} />
                {showNisabSettings ? 'Hide Settings' : 'Adjust Settings'}
              </button>
            </div>

            {showNisabSettings && (
              <div className="animate-fade-in" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div className="no-print" style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '14px', padding: '6px', border: '1px solid var(--border)', width: 'fit-content' }}>
                    <button onClick={() => setNisabStandard('gold')} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: nisabStandard === 'gold' ? 'var(--bg)' : 'transparent', color: nisabStandard === 'gold' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: nisabStandard === 'gold' ? 800 : 600, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: nisabStandard === 'gold' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>Gold (85g)</button>
                    <button onClick={() => setNisabStandard('silver')} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: nisabStandard === 'silver' ? 'var(--bg)' : 'transparent', color: nisabStandard === 'silver' ? '#94a3b8' : 'var(--text-muted)', fontWeight: nisabStandard === 'silver' ? 800 : 600, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: nisabStandard === 'silver' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>Silver (595g)</button>
                  </div>
                  <button onClick={() => fetchLiveNisab()} disabled={isFetchingNisab} className="no-print hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-alt)', color: 'var(--text-dark)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.84rem', cursor: isFetchingNisab ? 'not-allowed' : 'pointer', opacity: isFetchingNisab ? 0.7 : 1 }}>
                    <RefreshCw size={14} className={isFetchingNisab ? 'animate-spin' : ''} />
                    {isFetchingNisab ? 'Fetching...' : 'Fetch Live Prices'}
                  </button>
                </div>

                {fetchError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fef2f2', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.79rem', fontWeight: 600 }}>
                    <AlertCircle size={16} /> {fetchError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {/* Financial Wealth Nisab */}
                  <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display:'block', marginBottom:'8px' }}>Financial Wealth Nisab ({nisabStandard === 'gold' ? '85g Gold' : '595g Silver'})</label>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold)' }}>₦{financialNisab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {nisabStandard === 'gold' ? (
                      <div style={{ display:'flex', alignItems: 'center', gap: '4px', marginTop:'8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gold Price (Gram):</span>
                        <input type="number" value={goldPrice} onChange={e => setGoldPrice(Number(e.target.value))} style={{ width:'80px', border:'none', fontSize: '0.85rem', fontWeight:800, color:'var(--text-dark)', outline:'none', background: 'transparent', padding: 0 }} />
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems: 'center', gap: '4px', marginTop:'8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Silver Price (Gram):</span>
                        <input type="number" value={silverPrice} onChange={e => setSilverPrice(Number(e.target.value))} style={{ width:'80px', border:'none', fontSize: '0.85rem', fontWeight:800, color:'var(--text-dark)', outline:'none', background: 'transparent', padding: 0 }} />
                      </div>
                    )}
                  </div>

                  {/* Livestock & Agri Nisabs (Static Info) */}
                  <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display:'block', marginBottom:'8px' }}>Livestock Nisab</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Sheep & Goats: <span style={{ color: 'var(--primary)' }}>40</span></span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Cows & Buffaloes: <span style={{ color: 'var(--primary)' }}>30</span></span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display:'block', marginBottom:'8px' }}>Agriculture Nisab</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Grains & Fruits: <span style={{ color: '#16a34a' }}>653 kg (5 Awsuq)</span></span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Financial data intelligently fetched in real-time from MetalpriceAPI and CBN Exchange Rates</span>
                </div>
              </div>
            )}
          </div>

          {/* Financial Wealth Form */}
          <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'36px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Coins size={20} color="var(--primary)" /> Financial Wealth</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px' }}>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Stock Portfolio Value</label>
                <div style={{ background:'var(--primary-10)', padding:'14px', borderRadius:'12px', border:'1px solid var(--primary-50)', fontSize: '0.97rem', fontWeight:700, color:'var(--primary)' }}>
                  ₦{portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.7rem', color:'var(--text-muted)', marginTop:'6px', display:'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="var(--primary)" /> Synced automatically
                </span>
              </div>
              {/* Cash & Savings */}
              <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display:'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💵 Cash & Savings</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontWeight:800, fontSize: '1rem' }}>₦</span>
                  <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" style={{ width:'100%', padding:'12px 14px 12px 32px', borderRadius:'10px', border:'1.5px solid var(--border)', fontSize: '1.05rem', fontWeight:800, color:'var(--text-dark)', outline:'none', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
                {Number(cash) > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>✓ Entered</span>}
              </div>

              {/* Gold */}
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.14) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display:'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight:700, color:'#b89326', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🥇 Gold Held (Grams)</label>
                <div style={{ position:'relative' }}>
                  <input type="number" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} placeholder="0" style={{ width:'100%', padding:'12px 40px 12px 14px', borderRadius:'10px', border:'1.5px solid rgba(212,175,55,0.3)', fontSize: '1.05rem', fontWeight:800, color:'var(--gold)', outline:'none', background: 'var(--bg)', boxSizing: 'border-box' }} />
                  <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', color:'#b89326', fontWeight:800, fontSize: '0.85rem' }}>g</span>
                </div>
                {goldNum > 0 && (
                  <span style={{ fontSize: '0.75rem', color:'var(--gold)', fontWeight: 700 }}>≈ ₦{goldNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                )}
              </div>

              {/* Silver */}
              <div style={{ background: 'linear-gradient(135deg, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0.14) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(148,163,184,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display:'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight:700, color:'#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🥈 Silver Held (Grams)</label>
                <div style={{ position:'relative' }}>
                  <input type="number" value={silverGrams} onChange={e => setSilverGrams(e.target.value)} placeholder="0" style={{ width:'100%', padding:'12px 40px 12px 14px', borderRadius:'10px', border:'1.5px solid rgba(148,163,184,0.3)', fontSize: '1.05rem', fontWeight:800, color:'#475569', outline:'none', background: 'var(--bg)', boxSizing: 'border-box' }} />
                  <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', color:'#64748b', fontWeight:800, fontSize: '0.85rem' }}>g</span>
                </div>
                {silverNum > 0 && (
                  <span style={{ fontSize: '0.75rem', color:'#64748b', fontWeight: 700 }}>≈ ₦{silverNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                )}
              </div>
            </div>
            {/* Nisab Progress Summary */}
            <div style={{ marginTop: '32px', padding: '28px', background: 'linear-gradient(135deg, var(--bg-section) 0%, rgba(34,197,140,0.03) 100%)', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Nisab Progress</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>Each category is assessed independently</p>
                </div>
                {financialEligible && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                    Zakat Eligible
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                {/* Financial Wealth Bar */}
                {(() => {
                  const pct = Math.min(100, Math.round((totalWealth / financialNisab) * 100));
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>💰 Financial Wealth</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nisab: ₦{financialNisab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: financialEligible ? '#16a34a' : 'var(--gold)', letterSpacing: '-0.5px' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: financialEligible ? 'linear-gradient(90deg, #22c5b0, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '100px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)', boxShadow: financialEligible ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Sheep Bar */}
                {sheepNum > 0 && (() => {
                  const pct = Math.min(100, Math.round((sheepNum / 40) * 100));
                  const met = sheepNum >= 40;
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>🐑 Sheep & Goats</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sheepNum} of 40 head</span>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: met ? '#16a34a' : 'var(--gold)', letterSpacing: '-0.5px' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: met ? 'linear-gradient(90deg, #22c5b0, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '100px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)', boxShadow: met ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Cow Bar */}
                {cowNum > 0 && (() => {
                  const pct = Math.min(100, Math.round((cowNum / 30) * 100));
                  const met = cowNum >= 30;
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>🐄 Cows & Buffaloes</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{cowNum} of 30 head</span>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: met ? '#16a34a' : 'var(--gold)', letterSpacing: '-0.5px' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: met ? 'linear-gradient(90deg, #22c5b0, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '100px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)', boxShadow: met ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Agriculture Bar */}
                {harvestNum > 0 && (() => {
                  const pct = Math.min(100, Math.round((harvestNum / agriNisab) * 100));
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>🌾 Agriculture</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{harvestNum.toLocaleString()} of 653 kg</span>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: agriEligible ? '#16a34a' : 'var(--gold)', letterSpacing: '-0.5px' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: agriEligible ? 'linear-gradient(90deg, #22c5b0, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '100px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)', boxShadow: agriEligible ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }} />
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>

          <div className="no-print" style={{ textAlign: 'center', marginTop: '16px', marginBottom: '16px' }}>
            <button onClick={() => setShowAdvancedAssets(!showAdvancedAssets)} style={{ background: 'transparent', border: '1px dashed var(--border)', padding: '12px 24px', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              {showAdvancedAssets ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
              {showAdvancedAssets ? 'Hide Advanced Asset Classes' : 'Show Advanced Asset Classes (Livestock, Agriculture)'}
            </button>
          </div>

          {showAdvancedAssets && (
            <>
              {/* Livestock Form */}
              <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'36px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Cow size={20} color="var(--text-dark)" /> Livestock</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0.12) 100%)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(34,197,94,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display:'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight:800, color:'#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sheep & Goats (Nisab: 40)</label>
                    </div>
                    <input type="number" value={sheepCount} onChange={e => setSheepCount(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', fontSize: '1.4rem', fontWeight:900, color:'#16a34a', outline:'none', background: 'transparent', padding: 0 }} />
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.05) 0%, rgba(217,119,6,0.12) 100%)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(217,119,6,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display:'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight:800, color:'#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cows & Cattle (Nisab: 30)</label>
                    </div>
                    <input type="number" value={cowCount} onChange={e => setCowCount(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', fontSize: '1.4rem', fontWeight:900, color:'#d97706', outline:'none', background: 'transparent', padding: 0 }} />
                  </div>
                </div>
              </div>

              {/* Agriculture Form */}
              <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'36px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wheat size={20} color="var(--gold)" /> Agriculture & Grains</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', marginBottom: '24px' }}>Nisab is 653 kg. Rate depends on irrigation.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.15) 100%)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(212,175,55,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display:'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight:800, color:'#b89326', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harvest Weight</label>
                    </div>
                    <div style={{ display:'flex', alignItems: 'baseline', gap: '4px' }}>
                      <input type="number" value={harvestWeight} onChange={e => setHarvestWeight(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', fontSize: '1.4rem', fontWeight:900, color:'var(--gold)', outline:'none', background: 'transparent', padding: 0 }} />
                      <span style={{ color:'#b89326', fontWeight:700, fontSize: '0.9rem' }}>kg</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display:'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Irrigation Method</label>
                    </div>
                    <select value={irrigation} onChange={e => setIrrigation(e.target.value)} style={{ width:'100%', border:'none', fontSize: '0.9rem', fontWeight:800, color:'var(--text-dark)', outline:'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                      <option value="natural">Natural/Rain (10%)</option>
                      <option value="artificial">Artificial/Bought (5%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* RIGHT COLUMN: Sticky Summary */}
        <div className="zakat-right-col" style={{ flex: '1 1 300px', position: 'sticky', top: '24px' }}>
          <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '36px', boxShadow: '0 16px 48px rgba(0,0,0,0.06)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary) 0%, #22c5b0 100%)' }} />
            
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
              <Calculator size={20} color="var(--primary)" /> Total Obligation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', marginBottom: '32px' }}>Your consolidated Zakat statement based on Fiqh rules.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Financial Summary */}
              <div style={{ paddingBottom: '24px', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Financial Zakat</span>
                    {!financialEligible && totalWealth > 0 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--bg-section)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '100px', border: '1px solid var(--border)' }}>Below Nisab</span>
                    )}
                  </div>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: financialEligible ? 'var(--primary)' : 'var(--text-light)', letterSpacing: '-0.5px' }}>
                    {totalWealth === 0 ? '---' : `₦${financialZakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Total Wealth: {totalWealth === 0 ? '₦0' : `₦${totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </div>
              </div>

              {/* Livestock Summary */}
              {(showAdvancedAssets || sheepNum > 0 || cowNum > 0) && (
                <div style={{ paddingBottom: '24px', borderBottom: '1px dashed var(--border)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px' }}>Livestock Zakat</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sheep & Goats</span>
                    <span style={{ fontWeight: 800, color: sheepNum >= 40 ? 'var(--text-dark)' : 'var(--text-light)' }}>{sheepZakat}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cows & Cattle</span>
                    <span style={{ fontWeight: 800, color: cowNum >= 30 ? 'var(--text-dark)' : 'var(--text-light)' }}>{cowZakat}</span>
                  </div>
                </div>
              )}

              {/* Agriculture Summary */}
              {(showAdvancedAssets || harvestNum > 0) && (
                <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Agriculture Zakat</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: agriEligible ? 'var(--gold)' : 'var(--text-light)', letterSpacing: '-0.5px' }}>
                      {agriZakatDue > 0 ? `${agriZakatDue.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : 'None'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Harvest: {harvestNum.toLocaleString()} kg @ {irrigation === 'natural' ? '10%' : '5%'}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handlePrint} className="no-print hover-lift" style={{ marginTop: '32px', width: '100%', background: 'var(--primary)', color: 'var(--bg)', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(15,82,87,0.2)' }}>
              <Download size={18} /> Print Statement
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
