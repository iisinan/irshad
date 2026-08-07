import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, CheckCircle2, Lock, ShieldCheck, Trash2, FileText, UploadCloud, Calendar, Bell } from 'lucide-react';
import api, { fetchNgxStocks, linkBroker } from '../../services/api';
import CompanyLogo from '../CompanyLogo';

// ─── Zakat Date Confirmation Popup ──────────────────────────────────────────
function ZakatDatePrompt({ purchaseDate, onYes, onNo }) {
  const zakatDueDate = (() => {
    const d = new Date(purchaseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    while (d < today) {
      d.setDate(d.getDate() + 354);
    }
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return createPortal(
    <div className="zakat-prompt-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: '24px' }}>
      <div className="zakat-prompt-box" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Icon Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0a5a60 100%)', padding: '32px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar size={28} color="white" />
          </div>
          <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Set Your Zakat Date?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
            Would you like to use <strong style={{ color: 'white' }}>{new Date(purchaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> as your Zakat calculation start date?
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            Your Hawl (one lunar year) starts from the date you first owned this wealth. Once it completes, Zakat becomes due on your eligible portfolio holdings.
          </p>

          <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={18} color="#d4af37" />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Estimated Zakat Due Date</div>
              <div style={{ fontSize: '0.97rem', fontWeight: 800, color: 'var(--text-dark)' }}>{zakatDueDate}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>You'll receive a reminder closer to this date</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onNo}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-section)'}
            >
              Not Now
            </button>
            <button
              onClick={onYes}
              style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary) 0%, #0a5a60 100%)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,82,87,0.25)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Yes, Use This Date
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Zakat Confirmation (after Yes) ─────────────────────────────────────────
function ZakatConfirmation({ purchaseDate, onDone }) {
  const zakatDueDate = (() => {
    const d = new Date(purchaseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    while (d < today) {
      d.setDate(d.getDate() + 354);
    }
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return createPortal(
    <div className="zakat-prompt-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: '24px' }}>
      <div className="zakat-prompt-box" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Success Header */}
        <div style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', padding: '32px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={30} color="white" />
          </div>
          <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 6px' }}>Zakat Date Saved!</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', margin: 0 }}>Your Hawl period has been recorded.</p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.15)', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '0.63rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Hawl Start Date</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                {new Date(purchaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Bell size={20} color="#d4af37" />
              <div>
                <div style={{ fontSize: '0.63rem', fontWeight: 800, color: '#b89326', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Zakat Due Date</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>{zakatDueDate}</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
              We will remind you as your Zakat date approaches. You can also review and update your Zakat settings at any time from the <strong>Zakat</strong> tab in your portfolio.
            </p>
          </div>

          <button
            onClick={onDone}
            style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(21,128,61,0.25)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Got it, JazakAllah Khair 🌙
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
const ZAKAT_DATE_KEY = 'irshad_zakat_hawl_date';
const ZAKAT_ASKED_KEY = 'irshad_zakat_date_asked';

export default function AddHoldingModal({ onClose, onAdd, isAdding, onBrokerLinked, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'manual');
  const [rows, setRows] = useState([{ id: Date.now(), sym: '', sh: '', pr: '', date: '' }]);
  const [activeRowId, setActiveRowId] = useState(null);
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);

  // Broker State
  const [linking, setLinking] = useState(false);
  const [brokerName, setBrokerName] = useState('Meristem');
  const [linkMessage, setLinkMessage] = useState('');

  // Zakat flow state
  const [zakatPromptDate, setZakatPromptDate] = useState(null); // date string, triggers prompt
  const [showZakatConfirm, setShowZakatConfirm] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    fetchNgxStocks().then(res => setAllStocks(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // no-op — keep modal open
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    if (field === 'sym') {
      const val = value.toUpperCase();
      if (val.length > 0) {
        const filtered = allStocks.filter(s => s.symbol.includes(val) || s.name.toUpperCase().includes(val)).slice(0, 5);
        setFilteredStocks(filtered);
        setActiveRowId(id);
      } else {
        setActiveRowId(null);
      }
    }
  };

  const selectSymbolForRow = (id, s) => {
    let priceToFill = '';
    const match = allStocks.find(x => x.symbol === s);
    if (match) {
      const latestPrice = match.daily_prices?.[0]?.price || match.latest_price;
      if (latestPrice) priceToFill = Number(latestPrice).toFixed(2);
    }
    setRows(prev => prev.map(r => r.id === id ? { ...r, sym: s, pr: priceToFill || r.pr } : r));
    setActiveRowId(null);
  };

  const addRow = () => setRows(prev => [...prev, { id: Date.now(), sym: '', sh: '', pr: '', date: '' }]);
  const removeRow = (id) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const totalCost = rows.reduce((acc, r) => acc + ((Number(r.sh) || 0) * (Number(r.pr) || 0)), 0);

  const submit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.sym || r.sh || r.pr || r.date) {
        if (!r.sym) { alert(`Holding #${i + 1}: Ticker symbol cannot be empty.`); return; }
        if (!r.sh || Number(r.sh) <= 0) { alert(`Holding #${i + 1}: Please enter a valid number of shares.`); return; }
        if (!r.pr || Number(r.pr) < 0) { alert(`Holding #${i + 1}: Please enter a valid average price.`); return; }
        if (!r.date) { alert(`Holding #${i + 1}: Purchase date is required.`); return; }
      }
    }

    const validRows = rows.filter(r => r.sym && r.sh && r.pr && r.date);
    if (validRows.length === 0) {
      alert('Please fill out at least one complete holding row (Ticker, Shares, Avg Price, Date).');
      return;
    }

    const holdings = validRows.map(r => ({
      symbol: r.sym.toUpperCase(),
      shares: Number(r.sh),
      average_buy_price: Number(r.pr),
      purchase_date: r.date,
    }));

    // Save holdings first
    const success = await onAdd(holdings);
    if (!success) return; // if it failed, do not proceed to close or prompt

    // Decide whether to show zakat prompt
    const zakatAlreadySet = !!localStorage.getItem(ZAKAT_DATE_KEY);
    const alreadyAsked = !!localStorage.getItem(ZAKAT_ASKED_KEY);

    if (!zakatAlreadySet && !alreadyAsked) {
      // Use the earliest purchase date among new holdings
      const earliestDate = validRows.map(r => r.date).sort()[0];
      setZakatPromptDate(earliestDate);
    } else {
      onClose();
    }
  };

  const handleZakatYes = () => {
    localStorage.setItem(ZAKAT_DATE_KEY, zakatPromptDate);
    localStorage.setItem(ZAKAT_ASKED_KEY, 'yes');
    api.put('/profile', { preferences: { zakat_hawl_date: zakatPromptDate } }).catch(console.error);
    setZakatPromptDate(null);
    setShowZakatConfirm(true);
  };

  const handleZakatNo = () => {
    // Mark as asked so we will ask again next time they add a holding
    // (we intentionally do NOT set ZAKAT_ASKED_KEY permanently — we ask each session)
    setZakatPromptDate(null);
    onClose();
  };

  const handleZakatDone = () => {
    setShowZakatConfirm(false);
    onClose();
  };

  const handleLinkBroker = async () => {
    try {
      setLinking(true);
      setLinkMessage('');
      const res = await linkBroker(brokerName);
      setLinkMessage(res.message || 'Broker linked successfully!');
      if (onBrokerLinked) onBrokerLinked();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setLinkMessage(err.response?.data?.message || 'Failed to link broker.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <style>{`
        /* Custom scrollbar hiding for horizontal tabs */
        .modal-tabs::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          
          .modal-box {
            max-width: 100% !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          .modal-header {
            padding: 20px 20px 16px !important;
            border-bottom: 1px solid var(--border) !important;
          }
          
          .modal-tabs {
            padding: 0 16px !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
          }
          
          .modal-tabs button {
            padding: 12px 16px !important;
            font-size: 0.82rem !important;
            flex: none !important;
          }
          
          .modal-body {
            padding: 16px !important;
          }
          
          .holding-row-card {
            padding: 16px !important;
            margin-bottom: 16px !important;
            border-radius: 14px !important;
          }
          
          .holding-inputs-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px 12px !important;
          }
          
          .holding-inputs-grid > div:nth-child(1) {
            grid-column: span 2 !important;
          }
          
          .holding-inputs-grid > div:nth-child(2) {
            grid-column: span 1 !important;
          }
          
          .holding-inputs-grid > div:nth-child(3) {
            grid-column: span 1 !important;
          }
          
          .holding-inputs-grid > div:nth-child(4) {
            grid-column: span 2 !important;
          }
          
          .modal-footer {
            padding: 16px 20px 24px !important;
          }
          
          .broker-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .broker-card {
            padding: 16px !important;
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            gap: 16px !important;
          }
          
          .broker-card div {
            margin: 0 !important;
          }
          
          .broker-card span {
            text-align: left !important;
          }
        }
        
        @media (max-width: 480px) {
          .zakat-prompt-overlay {
            padding: 16px !important;
          }
          .zakat-prompt-box {
            border-radius: 20px !important;
          }
        }
      `}</style>
      {createPortal(
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
          <div className="modal-box" ref={modalRef} style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '720px', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>

            {/* Header */}
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 32px 24px', background: 'var(--bg)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Add Holdings</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>Update your portfolio tracking.</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.color = 'var(--text-dark)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="modal-tabs" style={{ display: 'flex', padding: '0 32px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setTab('manual')} style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', fontSize: '0.88rem', fontWeight: 800, color: tab === 'manual' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'manual' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>Manual Entry</button>
              <button onClick={() => setTab('import')} style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', fontSize: '0.88rem', fontWeight: 700, color: tab === 'import' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'import' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FileText size={16} /> Import Statement</button>
              <button onClick={() => setTab('broker')} style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', fontSize: '0.88rem', fontWeight: 700, color: tab === 'broker' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'broker' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Lock size={16} /> Link Broker</button>
            </div>

            {tab === 'manual' ? (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                <div className="modal-body" style={{ padding: '32px', overflowY: 'auto', flex: 1, background: '#FFFFFF' }}>
                  {rows.map((row, index) => (
                    <div key={row.id} className="holding-row-card" style={{ background: '#FFFFFF', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border)', position: 'relative' }}>
                      {/* Row Header & Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HOLDING #{index + 1}</div>
                        {rows.length > 1 && (
                          <button type="button" onClick={() => removeRow(row.id)} style={{ background: 'none', border: 'none', padding: '4px', color: 'var(--non-halal)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="holding-inputs-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '12px', alignItems: 'flex-start' }}>
                        {/* Ticker */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Ticker Symbol</label>
                          <div style={{ position: 'relative' }}>
                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input value={row.sym} onChange={e => handleRowChange(row.id, 'sym', e.target.value)} onFocus={() => { if (row.sym) setActiveRowId(row.id); }} onBlur={() => setTimeout(() => setActiveRowId(null), 200)} placeholder="SEARCH STOCK..." style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', outline: 'none', transition: 'border-color 0.2s', background: '#FFFFFF' }} onFocusCapture={e => { e.target.style.borderColor = 'var(--primary)'; }} onBlurCapture={e => { e.target.style.borderColor = 'var(--border)'; }} />
                            {activeRowId === row.id && filteredStocks.length > 0 && (
                              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden', animation: 'slideUpFade 0.2s ease', minWidth: '300px' }}>
                                {filteredStocks.map((stock, i) => (
                                  <div key={stock.symbol} onClick={() => selectSymbolForRow(row.id, stock.symbol)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: i === filteredStocks.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-10)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={32} radius={8} />
                                      <div>
                                        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.84rem' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '0.79rem', fontWeight: 800, color: 'var(--text-dark)' }}>₦{Number(stock.daily_prices?.[0]?.price || stock.latest_price || 0).toFixed(2)}</div>
                                      <div style={{ fontSize: '0.66rem', color: 'var(--text-light)' }}>Current Price</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shares */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Shares</label>
                          <input type="number" value={row.sh} onChange={e => handleRowChange(row.id, 'sh', e.target.value)} placeholder="0" min="0" step="any" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: '#FFFFFF', transition: 'border-color 0.2s' }} onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                        </div>

                        {/* Avg Price */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Avg Price (₦)</label>
                          <input type="number" value={row.pr} onChange={e => handleRowChange(row.id, 'pr', e.target.value)} placeholder="0.00" min="0" step="any" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: '#FFFFFF', transition: 'border-color 0.2s' }} onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                        </div>

                        {/* Date — REQUIRED */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                            Purchase Date
                          </label>
                          <input
                            type="date"
                            value={row.date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => handleRowChange(row.id, 'date', e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: '#FFFFFF', transition: 'border-color 0.2s', color: row.date ? 'var(--text-dark)' : 'var(--text-muted)' }}
                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = '#FFFFFF'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = '#FFFFFF'; }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addRow} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#FFFFFF', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-10)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}>
                    <Plus size={18} /> Add Another Holding
                  </button>
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>Estimated Total</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', background: 'none', border: 'none', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>Cancel</button>
                    <button type="submit" disabled={isAdding} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: isAdding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'opacity 0.2s', opacity: isAdding ? 0.7 : 1 }}>
                      {isAdding ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : 'Confirm Addition'}
                    </button>
                  </div>
                </div>
              </form>
            ) : tab === 'broker' ? (
              <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '40px 32px 32px', textAlign: 'center', background: '#FAFAFA' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--halal-bg)', color: 'var(--halal)', borderRadius: '24px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '24px' }}><ShieldCheck size={16} /> End-to-End Encrypted</div>
                  <h4 style={{ fontSize: '1.41rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', letterSpacing: '-0.5px' }}>Link your Broker</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 auto', lineHeight: 1.6, maxWidth: '320px' }}>Connect your brokerage account to Irshad to seamlessly track your Shariah-compliant investments.</p>
                </div>
                <div className="modal-body" style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                  {linkMessage && (<div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: linkMessage.includes('successfully') ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: linkMessage.includes('successfully') ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} /> {linkMessage}</div>)}
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Select an Institution</p>
                  <div className="broker-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {['Meristem', 'Stanbic IBTC', 'CSCS', 'Risevest'].map((broker) => (
                      <div key={broker} onClick={() => setBrokerName(broker)} className="broker-card" style={{ padding: '24px', borderRadius: '16px', border: brokerName === broker ? '2px solid var(--primary)' : '2px solid var(--border)', background: brokerName === broker ? 'var(--primary-50)' : 'var(--bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: brokerName === broker ? '0 8px 24px rgba(243, 198, 81, 0.15)' : 'none' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: brokerName === broker ? 'var(--bg)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.23rem', fontWeight: 800, color: 'var(--text-dark)' }}>{broker.charAt(0)}</div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>{broker}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <button type="button" onClick={handleLinkBroker} disabled={linking || !brokerName} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: '#0B0F17', fontWeight: 800, fontSize: '0.88rem', cursor: (linking || !brokerName) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(243, 198, 81, 0.25)', opacity: (linking || !brokerName) ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {linking ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: '#0B0F17' }} /> : 'Continue'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '40px 32px 32px', textAlign: 'center', background: '#FAFAFA' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '24px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '24px' }}><FileText size={16} /> Bulk Import</div>
                  <h4 style={{ fontSize: '1.41rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', letterSpacing: '-0.5px' }}>Upload Statement</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 auto', lineHeight: 1.6, maxWidth: '320px' }}>Upload your trade log or portfolio statement (PDF/CSV) to automatically extract your holdings.</p>
                </div>
                <div className="modal-body" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '100%', padding: '48px 24px', borderRadius: '20px', border: '2px dashed var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-50)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }} onClick={() => document.getElementById('file-upload').click()}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><UploadCloud size={28} /></div>
                    <div>
                      <div style={{ fontSize: '0.97rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center', marginBottom: '4px' }}>Click to Browse Files</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Supports .pdf, .csv, and .xlsx</div>
                    </div>
                    <input type="file" id="file-upload" accept=".pdf,.csv,.xlsx" style={{ display: 'none' }} onChange={(e) => { if (e.target.files.length) { alert('File selected: ' + e.target.files[0].name + '\n\nParsing logic will connect to the backend here.'); onClose(); } }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Zakat Date Prompt */}
      {zakatPromptDate && !showZakatConfirm && (
        <ZakatDatePrompt
          purchaseDate={zakatPromptDate}
          onYes={handleZakatYes}
          onNo={handleZakatNo}
        />
      )}

      {/* Zakat Confirmation */}
      {showZakatConfirm && (
        <ZakatConfirmation
          purchaseDate={localStorage.getItem(ZAKAT_DATE_KEY)}
          onDone={handleZakatDone}
        />
      )}
    </>
  );
}
