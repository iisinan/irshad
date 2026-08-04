import React, { useState, useEffect } from 'react';
import { Calculator, Download, Coins, Wheat, Bug as Cow, Scale, CheckCircle2, RefreshCw, AlertCircle, Calendar, Bell, Edit2, ChevronDown, ChevronUp, Info, Sliders } from 'lucide-react';
import api, { getSettings } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  
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
        .print-only { display: none; }
        @media print {
          @page { margin: 15mm 20mm; size: A4; }
          body * { visibility: hidden; }
          .zakat-print-container, .zakat-print-container * { visibility: visible; }
          .zakat-print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .zakat-print-body { display: block !important; }
          .print-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; margin-bottom: 20px; }
          .zakat-two-col { flex-direction: column !important; }
          .zakat-right-col { position: static !important; }
          .zakat-hero { display: none !important; }
        }
      `}</style>
      
      {/* ═══════════════════════════════════════════════════
          PRINT-ONLY: Full Zakat Statement Document
      ═══════════════════════════════════════════════════ */}
      <div className="print-only" style={{ display: 'none', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', background: '#fff', padding: '0', minHeight: '100vh' }}>

        {/* ── Background Watermark ── */}
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, zIndex: 0, pointerEvents: 'none' }}>
          <img src="/logo.svg" alt="" style={{ width: '600px', height: 'auto', filter: 'grayscale(100%)' }} />
        </div>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '24px', borderBottom: '3px solid #0F5257', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/logo.svg" alt="Irshad" style={{ height: '44px', width: 'auto' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#0F5257', letterSpacing: '-0.5px', lineHeight: 1 }}>Irshad</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Shariah-Compliant Portfolio</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F5257', letterSpacing: '-0.5px' }}>Zakat Statement</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            {hawlDate && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Hawl started: {new Date(hawlDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          </div>
        </div>

        {/* ── Prepared For ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Prepared For</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{user?.first_name || user?.name || 'Valued Client'} {user?.last_name || ''}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{user?.email || ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Statement ID</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>ZKT-{Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        {/* ── Green accent rule ── */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #0F5257, #22c5b0, #d4af37)', borderRadius: '2px', marginBottom: '32px', position: 'relative', zIndex: 1 }} />

        {/* ── Nisab Configuration ── */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px 24px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Nisab Thresholds Applied</div>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '12px', color: '#64748b' }}>Standard: </span><span style={{ fontSize: '13px', fontWeight: 700 }}>{nisabStandard === 'gold' ? 'Gold (85g)' : 'Silver (595g)'}</span></div>
            <div><span style={{ fontSize: '12px', color: '#64748b' }}>Financial Nisab: </span><span style={{ fontSize: '13px', fontWeight: 700, color: '#0F5257' }}>₦{financialNisab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            <div><span style={{ fontSize: '12px', color: '#64748b' }}>Livestock (Sheep): </span><span style={{ fontSize: '13px', fontWeight: 700 }}>40 head</span></div>
            <div><span style={{ fontSize: '12px', color: '#64748b' }}>Livestock (Cows): </span><span style={{ fontSize: '13px', fontWeight: 700 }}>30 head</span></div>
            <div><span style={{ fontSize: '12px', color: '#64748b' }}>Agriculture: </span><span style={{ fontSize: '13px', fontWeight: 700 }}>653 kg (5 Awsuq)</span></div>
          </div>
        </div>

        {/* ── Financial Wealth Section ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F5257', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#0F5257', borderRadius: '2px' }} />
            Financial Wealth
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value (₦)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '11px 14px', color: '#334155' }}>📈 Stock Portfolio</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>₦{portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}><span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Auto-synced</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '11px 14px', color: '#334155' }}>💵 Cash & Savings</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>₦{cashNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}>—</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '11px 14px', color: '#334155' }}>🥇 Gold Held ({Number(goldGrams) || 0}g @ ₦{goldPrice.toLocaleString()}/g)</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>₦{goldNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}>—</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '11px 14px', color: '#334155' }}>🥈 Silver Held ({Number(silverGrams) || 0}g @ ₦{silverPrice.toLocaleString()}/g)</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>₦{silverNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}>—</td>
              </tr>
              <tr style={{ background: financialEligible ? '#f0fdf4' : '#fafafa', fontWeight: 800 }}>
                <td style={{ padding: '12px 14px', color: '#0F5257', fontSize: '14px' }}>Total Wealth</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#0F5257', fontSize: '14px' }}>₦{totalWealth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {financialEligible
                    ? <span style={{ background: '#0F5257', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Nisab Reached ✓</span>
                    : <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Below Nisab</span>}
                </td>
              </tr>
            </tbody>
          </table>
          {financialEligible && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Zakat due @ 2.5%:</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#0F5257', letterSpacing: '-0.5px' }}>₦{financialZakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>

        {/* ── Livestock Section ── */}
        {(sheepNum > 0 || cowNum > 0) && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#16a34a', borderRadius: '2px' }} />
              Livestock Zakat
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Animal</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Count</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nisab</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zakat Due</th>
                </tr>
              </thead>
              <tbody>
                {sheepNum > 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 14px', color: '#334155' }}>🐑 Sheep & Goats</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700 }}>{sheepNum}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#64748b' }}>40 head</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: sheepNum >= 40 ? '#16a34a' : '#94a3b8' }}>{sheepZakat}</td>
                  </tr>
                )}
                {cowNum > 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 14px', color: '#334155' }}>🐄 Cows & Buffaloes</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700 }}>{cowNum}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#64748b' }}>30 head</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: cowNum >= 30 ? '#16a34a' : '#94a3b8' }}>{cowZakat}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Agriculture Section ── */}
        {harvestNum > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#d97706', borderRadius: '2px' }} />
              Agriculture Zakat
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#fffbeb' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crop</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harvest</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Irrigation</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zakat Due</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '11px 14px', color: '#334155' }}>🌾 Grains & Fruits</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700 }}>{harvestNum.toLocaleString()} kg</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', color: '#64748b' }}>{irrigation === 'natural' ? 'Natural / Rain' : 'Artificial / Bought'}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700 }}>{irrigation === 'natural' ? '10%' : '5%'}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: agriEligible ? '#d97706' : '#94a3b8' }}>{agriZakatDue > 0 ? `${agriZakatDue.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : 'Below Nisab'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Consolidated Summary ── */}
        <div style={{ marginTop: '36px', marginBottom: '32px', border: '2px solid #0F5257', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: '#0F5257', color: '#fff', padding: '14px 20px', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Summary of Zakat Payable
          </div>
          <div style={{ padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Financial Wealth Zakat</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: financialEligible ? '#0F5257' : '#94a3b8' }}>
                {financialEligible ? `₦${financialZakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              </span>
            </div>
            
            {(sheepNum > 0 || cowNum > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Livestock Zakat</span>
                <div style={{ textAlign: 'right' }}>
                  {sheepNum >= 40 && <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>Sheep: {sheepZakat}</div>}
                  {cowNum >= 30 && <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>Cows: {cowZakat}</div>}
                  {sheepNum < 40 && cowNum < 30 && <span style={{ fontSize: '16px', fontWeight: 800, color: '#94a3b8' }}>—</span>}
                </div>
              </div>
            )}
            
            {harvestNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Agriculture Zakat</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: agriEligible ? '#d97706' : '#94a3b8' }}>
                  {agriEligible ? `${agriZakatDue.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : '—'}
                </span>
              </div>
            )}
            
            {(!financialEligible && (!sheepNum || sheepNum < 40) && (!cowNum || cowNum < 30) && (!harvestNum || harvestNum < 653)) && (
              <div style={{ padding: '12px 0', borderTop: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                No Zakat is currently due across your registered asset classes.
              </div>
            )}
          </div>
        </div>

        {/* ── Hawl Date ── */}
        {hawlDate && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '14px 20px', marginBottom: '28px', display: 'flex', gap: '32px' }}>
            <div><span style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hawl Started</span><br /><span style={{ fontSize: '14px', fontWeight: 700 }}>{new Date(hawlDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
            {hawlDueDate && <div><span style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due Date</span><br /><span style={{ fontSize: '14px', fontWeight: 700 }}>{hawlDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>}
            {daysUntilDue !== null && <div><span style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days Remaining</span><br /><span style={{ fontSize: '14px', fontWeight: 700, color: daysUntilDue <= 30 ? '#dc2626' : '#16a34a' }}>{daysUntilDue > 0 ? `${daysUntilDue} days` : 'Due Now!'}</span></div>}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div style={{ marginTop: '32px', padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#64748b', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          <strong style={{ color: '#334155' }}>Disclaimer:</strong> This Zakat statement is generated based on data entered by the user and live market prices at the time of generation. It is provided as a tool to assist in Zakat calculation and is not a substitute for professional Islamic financial advice. Nisab values are calculated using {nisabStandard === 'gold' ? 'Gold (85g)' : 'Silver (595g)'} standard.
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.svg" alt="Irshad" style={{ height: '22px', width: 'auto', opacity: 0.6 }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>iirshad.com</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Powered by Irshad · Shariah-Compliant Portfolio Intelligence</span>
        </div>

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Coins size={20} color="var(--primary)" /> Financial Wealth</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', marginBottom: 0, fontWeight: 500 }}>Your investable & liquid assets for Zakat calculation.</p>
              </div>
              {totalWealth > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Wealth</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px' }}>₦{totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              )}
            </div>

            {/* Stock Portfolio — read-only display card */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary-10) 0%, rgba(15,82,87,0.12) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid var(--primary-50)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display:'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight:700, color:'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📈 Stock Portfolio</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>₦{portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#16a34a', padding: '5px 12px', borderRadius: '100px' }}>
                <CheckCircle2 size={12} /> Auto-synced
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
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
                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>🐄 Livestock</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px', fontWeight: 500 }}>Enter total head count for each animal type.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0.12) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight:800, color:'#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🐑 Sheep & Goats <span style={{ fontWeight: 600, color: '#16a34a99' }}>(Nisab: 40)</span></label>
                    <input type="number" value={sheepCount} onChange={e => setSheepCount(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', borderBottom: '2px solid rgba(34,197,94,0.3)', fontSize: '1.6rem', fontWeight:900, color:'#16a34a', outline:'none', background: 'transparent', padding: '4px 0', boxSizing: 'border-box' }} />
                    {sheepNum > 0 && <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>{sheepNum >= 40 ? '✓ Above Nisab' : `${40 - sheepNum} more to reach Nisab`}</span>}
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.05) 0%, rgba(217,119,6,0.12) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(217,119,6,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight:800, color:'#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🐄 Cows & Cattle <span style={{ fontWeight: 600, color: '#d9770699' }}>(Nisab: 30)</span></label>
                    <input type="number" value={cowCount} onChange={e => setCowCount(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', borderBottom: '2px solid rgba(217,119,6,0.3)', fontSize: '1.6rem', fontWeight:900, color:'#d97706', outline:'none', background: 'transparent', padding: '4px 0', boxSizing: 'border-box' }} />
                    {cowNum > 0 && <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>{cowNum >= 30 ? '✓ Above Nisab' : `${30 - cowNum} more to reach Nisab`}</span>}
                  </div>
                </div>
              </div>

              {/* Agriculture Form */}
              <div className="print-card hover-lift" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'36px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wheat size={20} color="var(--gold)" /> Agriculture & Grains</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px', fontWeight: 500 }}>Nisab is 653 kg (5 Awsuq). Zakat rate depends on irrigation method.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.15) 100%)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight:800, color:'#b89326', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🌾 Harvest Weight</label>
                    <div style={{ display:'flex', alignItems: 'baseline', gap: '6px' }}>
                      <input type="number" value={harvestWeight} onChange={e => setHarvestWeight(e.target.value)} placeholder="0" style={{ width:'100%', border:'none', borderBottom: '2px solid rgba(212,175,55,0.3)', fontSize: '1.6rem', fontWeight:900, color:'var(--gold)', outline:'none', background: 'transparent', padding: '4px 0', boxSizing: 'border-box' }} />
                      <span style={{ color:'#b89326', fontWeight:800, fontSize: '1rem' }}>kg</span>
                    </div>
                    {harvestNum > 0 && <span style={{ fontSize: '0.75rem', color: agriEligible ? '#16a34a' : '#b89326', fontWeight: 700 }}>{agriEligible ? '✓ Above Nisab' : `${(agriNisab - harvestNum).toLocaleString()} kg more needed`}</span>}
                  </div>
                  <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight:800, color:'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💧 Irrigation Method</label>
                    <select value={irrigation} onChange={e => setIrrigation(e.target.value)} style={{ width:'100%', border:'none', borderBottom: '2px solid var(--border)', fontSize: '0.95rem', fontWeight:800, color:'var(--text-dark)', outline:'none', background: 'transparent', padding: '4px 0', cursor: 'pointer' }}>
                      <option value="natural">Natural / Rain (10%)</option>
                      <option value="artificial">Artificial / Bought (5%)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Rate applied: {irrigation === 'natural' ? '10%' : '5%'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* RIGHT COLUMN: Sticky Summary */}
        <div className="zakat-right-col" style={{ flex: '1 1 300px', position: 'sticky', top: '24px' }}>
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '32px', boxShadow: '0 16px 48px rgba(0,0,0,0.07)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary) 0%, #22c5b0 50%, #d4af37 100%)' }} />

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.3px' }}>
              <Calculator size={18} color="var(--primary)" /> Zakat Summary
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginBottom: '28px', fontWeight: 500 }}>Consolidated obligation based on Fiqh rules.</p>

            {/* Financial Zakat Block */}
            <div style={{ background: financialEligible ? 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.12) 100%)' : 'var(--bg-section)', borderRadius: '18px', padding: '20px', marginBottom: '16px', border: `1px solid ${financialEligible ? 'rgba(34,197,94,0.2)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: financialEligible ? '#16a34a' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Financial Zakat</span>
                  {!financialEligible && totalWealth > 0 && (
                    <div style={{ marginTop: '4px' }}><span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--bg)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '100px', border: '1px solid var(--border)' }}>Below Nisab</span></div>
                  )}
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: financialEligible ? '#16a34a' : 'var(--text-light)', letterSpacing: '-1px' }}>
                  {totalWealth === 0 ? '—' : `₦${financialZakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                2.5% of ₦{totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })} total wealth
              </div>
            </div>

            {/* Livestock Summary */}
            {(showAdvancedAssets || sheepNum > 0 || cowNum > 0) && (
              <div style={{ background: 'var(--bg-section)', borderRadius: '18px', padding: '20px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '14px' }}>🐄 Livestock Zakat</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sheep & Goats</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: sheepNum >= 40 ? 'var(--text-dark)' : 'var(--text-light)' }}>{sheepZakat}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cows & Cattle</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: cowNum >= 30 ? 'var(--text-dark)' : 'var(--text-light)' }}>{cowZakat}</span>
                </div>
              </div>
            )}

            {/* Agriculture Summary */}
            {(showAdvancedAssets || harvestNum > 0) && (
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.12) 100%)', borderRadius: '18px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b89326', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🌾 Agriculture Zakat</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: agriEligible ? 'var(--gold)' : 'var(--text-light)', letterSpacing: '-0.5px' }}>
                    {agriZakatDue > 0 ? `${agriZakatDue.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : '—'}
                  </span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {harvestNum.toLocaleString()} kg @ {irrigation === 'natural' ? '10%' : '5%'}
                </div>
              </div>
            )}

            <button onClick={handlePrint} className="no-print hover-lift" style={{ marginTop: '8px', width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, #22c5b0 100%)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(15,82,87,0.25)', fontSize: '0.9rem', letterSpacing: '0.2px' }}>
              <Download size={16} /> Print Zakat Statement
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
