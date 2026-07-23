import React, { useState } from 'react';
import { Calculator, Download, Coins, Wheat, Bug as Cow, Scale, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

function getCowZakat(n) {
  if (n < 30) return 'None (Below Nisab)';
  if (n >= 30 && n < 40) return '1 Yearling (Tabi\')';
  if (n >= 40 && n < 60) return '1 Two-year-old (Musinnah)';
  if (n >= 60 && n < 70) return '2 Yearlings';
  if (n >= 70 && n < 80) return '1 Yearling & 1 Two-year-old';
  if (n >= 80 && n < 90) return '2 Two-year-olds';
  if (n >= 90 && n < 100) return '3 Yearlings';
  if (n >= 100 && n < 110) return '2 Yearlings & 1 Two-year-old';
  if (n >= 110 && n < 120) return '2 Two-year-olds & 1 Yearling';
  
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
  // Settings & Live Fetch
  const [exchangeRate, setExchangeRate] = useState(1500); // USD to NGN
  const [goldPrice, setGoldPrice] = useState(150000); // NGN per gram
  const [isFetchingNisab, setIsFetchingNisab] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Financial State
  const [cash, setCash] = useState('');
  const [goldValue, setGoldValue] = useState('');
  const portfolioValue = data?.summary?.total_balance || 0;

  // Livestock State
  const [sheepCount, setSheepCount] = useState('');
  const [cowCount, setCowCount] = useState('');

  // Agriculture State
  const [harvestWeight, setHarvestWeight] = useState('');
  const [irrigation, setIrrigation] = useState('natural'); // natural, artificial

  // Financial Calculations
  const financialNisab = goldPrice * 85;
  const cashNum = Number(cash) || 0;
  const goldNum = Number(goldValue) || 0;
  const totalWealth = portfolioValue + cashNum + goldNum;
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

  const fetchLiveNisab = async () => {
    setIsFetchingNisab(true);
    setFetchError('');
    try {
      const res = await fetch('https://api.gold-api.com/price/XAU');
      if (!res.ok) throw new Error('Failed to fetch gold price');
      const apiData = await res.json();
      const pricePerOunceUsd = apiData.price;
      const pricePerGramUsd = pricePerOunceUsd / 31.1035; // Troy Ounce to Gram
      const pricePerGramNgn = pricePerGramUsd * exchangeRate;
      setGoldPrice(Math.round(pricePerGramNgn));
    } catch (err) {
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
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; margin-bottom: 24px; }
        }
      `}</style>
      
      {/* Hero Banner */}
      <div className="no-print" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'40px', boxShadow:'0 12px 32px rgba(13,27,42,0.15)', border:'none', marginBottom: '32px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <Scale size={32} fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.58rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Comprehensive Zakat</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', marginTop: '6px', margin: 0 }}>A simple, smart calculator for all your asset classes.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Calculators */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Smart Nisab Setup */}
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Smart Nisab <span style={{ padding: '4px 8px', background: 'var(--primary-10)', color: 'var(--primary)', fontSize: '0.66rem', borderRadius: '8px', fontWeight: 800 }}>LIVE</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>The Nisab threshold is 85 grams of gold. Fetch the live price globally.</p>
              </div>
              <button onClick={fetchLiveNisab} disabled={isFetchingNisab} className="no-print hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-alt)', color: 'var(--text-dark)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, cursor: isFetchingNisab ? 'not-allowed' : 'pointer', opacity: isFetchingNisab ? 0.7 : 1 }}>
                <RefreshCw size={16} className={isFetchingNisab ? 'animate-spin' : ''} />
                {isFetchingNisab ? 'Fetching...' : 'Fetch Live Price'}
              </button>
            </div>

            {fetchError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fef2f2', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.79rem', fontWeight: 600 }}>
                <AlertCircle size={16} /> {fetchError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.75rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', textTransform: 'uppercase' }}>Exchange Rate (USD to NGN)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                  <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
                </div>
              </div>

              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.75rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', textTransform: 'uppercase' }}>Gold Price (Per Gram)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                  <input type="number" value={goldPrice} onChange={e => setGoldPrice(Number(e.target.value))} style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--primary)', outline:'none', background: 'var(--primary-10)' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>Calculated Nisab Threshold (85g)</span>
              <span style={{ fontSize: '1.06rem', fontWeight: 900, color: 'var(--gold)' }}>₦{financialNisab.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Financial Wealth Form */}
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
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
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Cash & Savings</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                  <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
                </div>
              </div>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Other Gold/Silver</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>₦</span>
                  <input type="number" value={goldValue} onChange={e => setGoldValue(e.target.value)} placeholder="0.00" style={{ width:'100%', padding:'14px 16px 14px 36px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
                </div>
              </div>
            </div>
            
            {/* Nisab Progress within Financial block */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase' }}>Wealth vs Nisab</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: financialEligible ? 'var(--halal)' : 'var(--text-muted)' }}>
                    {Math.min(100, Math.round((totalWealth / financialNisab) * 100))}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ width: `${Math.min(100, (totalWealth / financialNisab) * 100)}%`, height: '100%', background: financialEligible ? 'var(--primary)' : 'var(--gold)', transition: 'width 0.8s ease' }} />
                </div>
            </div>
          </div>

          {/* Livestock Form */}
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Cow size={20} color="var(--text-dark)" /> Livestock</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px' }}>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Sheep & Goats (Nisab: 40)</label>
                <input type="number" value={sheepCount} onChange={e => setSheepCount(e.target.value)} placeholder="0" style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Cows & Cattle (Nisab: 30)</label>
                <input type="number" value={cowCount} onChange={e => setCowCount(e.target.value)} placeholder="0" style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
              </div>
            </div>
          </div>

          {/* Agriculture Form */}
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wheat size={20} color="var(--gold)" /> Agriculture & Grains</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', marginBottom: '24px' }}>Nisab is 653 kg. Rate depends on irrigation.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Harvest Weight (kg)</label>
                <div style={{ position:'relative' }}>
                  <input type="number" value={harvestWeight} onChange={e => setHarvestWeight(e.target.value)} placeholder="0" style={{ width:'100%', padding:'14px 48px 14px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.97rem', fontWeight:700, color:'var(--text-dark)', outline:'none' }} />
                  <span style={{ position:'absolute', right:'16px', top:'14px', color:'var(--text-muted)', fontWeight:700 }}>kg</span>
                </div>
              </div>
              <div className="input-group">
                <label style={{ display:'block', fontSize: '0.79rem', fontWeight:600, color:'var(--text-dark)', marginBottom:'8px' }}>Irrigation Method</label>
                <select value={irrigation} onChange={e => setIrrigation(e.target.value)} style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.88rem', fontWeight:600, color:'var(--text-dark)', outline:'none', background: 'var(--bg)' }}>
                  <option value="natural">Natural/Rain (10%)</option>
                  <option value="artificial">Artificial/Bought (5%)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Summary */}
        <div style={{ flex: '1 1 35%', position: 'sticky', top: '24px' }}>
          <div className="print-card" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '32px', boxShadow: '0 12px 32px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} color="var(--primary)" /> Total Obligation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', marginBottom: '32px' }}>Your consolidated Zakat statement based on Fiqh rules.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Financial Summary */}
              <div style={{ paddingBottom: '20px', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Financial Zakat</span>
                  <span style={{ fontSize: '1.23rem', fontWeight: 900, color: financialEligible ? 'var(--primary)' : 'var(--text-light)', letterSpacing: '-0.5px' }}>
                    ₦{financialZakatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total Wealth: ₦{totalWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Livestock Summary */}
              <div style={{ paddingBottom: '20px', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '12px' }}>Livestock Zakat</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}>Sheep & Goats</span>
                  <span style={{ fontWeight: 800, color: sheepNum >= 40 ? 'var(--text-dark)' : 'var(--text-light)' }}>{sheepZakat}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}>Cows & Cattle</span>
                  <span style={{ fontWeight: 800, color: cowNum >= 30 ? 'var(--text-dark)' : 'var(--text-light)' }}>{cowZakat}</span>
                </div>
              </div>

              {/* Agriculture Summary */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Agriculture Zakat</span>
                  <span style={{ fontSize: '1.23rem', fontWeight: 900, color: agriEligible ? 'var(--text-dark)' : 'var(--text-light)', letterSpacing: '-0.5px' }}>
                    {agriZakatDue > 0 ? `${agriZakatDue.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : 'None'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Harvest: {harvestNum.toLocaleString()} kg @ {irrigation === 'natural' ? '10%' : '5%'}
                </div>
              </div>
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
