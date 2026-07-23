import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, CheckCircle2, Lock, ShieldCheck, ChevronDown, Trash2, FileText, UploadCloud, RefreshCw } from 'lucide-react';
import { fetchNgxStocks, formatLogoUrl, linkBroker } from '../../services/api';

export default function AddHoldingModal({ onClose, onAdd, isAdding, onBrokerLinked, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'manual');
  
  // Rows for bulk add
  const [rows, setRows] = useState([{ id: Date.now(), sym: '', sh: '', pr: '' }]);
  const [activeRowId, setActiveRowId] = useState(null);

  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  
  // Broker State
  const [linking, setLinking] = useState(false);
  const [brokerName, setBrokerName] = useState('Meristem');
  const [linkMessage, setLinkMessage] = useState('');

  const modalRef = useRef(null);

  useEffect(() => {
    fetchNgxStocks().then(res => setAllStocks(res.data || [])).catch(console.error);
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // We do not close the entire modal on outside click if they are interacting with dropdowns
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const addRow = () => setRows(prev => [...prev, { id: Date.now(), sym: '', sh: '', pr: '' }]);
  const removeRow = (id) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const totalCost = rows.reduce((acc, r) => acc + ((Number(r.sh)||0) * (Number(r.pr)||0)), 0);

  const submit = (e) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.sym && r.sh && r.pr);
    if (validRows.length === 0) {
      alert('Please fill out at least one complete holding row (Ticker, Shares, Avg Price).');
      return;
    }
    
    const holdings = validRows.map(r => ({
      symbol: r.sym.toUpperCase(),
      shares: Number(r.sh),
      average_buy_price: Number(r.pr)
    }));
    onAdd(holdings);
  };

  const handleLinkBroker = async () => {
    try {
      setLinking(true);
      setLinkMessage('');
      const res = await linkBroker(brokerName);
      setLinkMessage(res.message || 'Broker linked successfully!');
      if (onBrokerLinked) onBrokerLinked();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch(err) {
      setLinkMessage(err.response?.data?.message || 'Failed to link broker.');
    } finally {
      setLinking(false);
    }
  };

  return createPortal(
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(15,82,87,0.4)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'24px' }}>
      <div ref={modalRef} style={{ background: 'var(--bg)', borderRadius:'28px', width:'100%', maxWidth:'720px', boxShadow:'0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'90vh', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight:800, color:'var(--text-dark)', margin: 0 }}>Add Holdings</h3>
            <p style={{ fontSize: '0.75rem', color:'var(--text-muted)', margin: '4px 0 0 0' }}>Update your portfolio tracking.</p>
          </div>
          <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--border)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}>
            <X size={18}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-section)' }}>
          <button onClick={() => setTab('manual')} style={{ flex:1, padding:'16px', background:'none', border:'none', fontSize: '0.84rem', fontWeight:800, color: tab === 'manual' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'manual' ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all 0.2s' }}>
            Manual Entry
          </button>
          <button onClick={() => setTab('import')} style={{ flex:1, padding:'16px', background:'none', border:'none', fontSize: '0.84rem', fontWeight:800, color: tab === 'import' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'import' ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <FileText size={14} /> Import Statement
          </button>
          <button onClick={() => setTab('broker')} style={{ flex:1, padding:'16px', background:'none', border:'none', fontSize: '0.84rem', fontWeight:800, color: tab === 'broker' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'broker' ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <Lock size={14} /> Link Broker
          </button>
        </div>

        {tab === 'manual' ? (
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', overflow:'hidden', flex:1 }}>
            
            <div style={{ padding:'28px 28px 16px', overflowY:'auto', flex:1, background: '#FAFAFA' }}>
              {rows.map((row, index) => (
                <div key={row.id} style={{ background: 'var(--bg)', padding:'20px', borderRadius:'16px', marginBottom:'20px', border:'1px solid var(--border)', boxShadow:'0 2px 8px rgba(0,0,0,0.02)', position:'relative' }}>
                  
                  {/* Row Header & Delete */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight:800, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      Holding #{index + 1}
                    </div>
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(row.id)} style={{ background:'none', border:'none', padding:'4px', color:'var(--non-halal)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.6, transition:'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.6}>
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                  
                  {/* Ticker Search & Inputs */}
                  <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:'16px', alignItems: 'flex-start' }}>
                    <div>
                      <label style={{ display:'block', fontSize: '0.7rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Ticker Symbol</label>
                      <div style={{ position:'relative' }}>
                        <Search size={16} color="var(--text-light)" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }}/>
                        <input 
                          value={row.sym} 
                          onChange={e => handleRowChange(row.id, 'sym', e.target.value)} 
                          onFocus={() => { if(row.sym) setActiveRowId(row.id); }}
                          onBlur={() => setTimeout(() => setActiveRowId(null), 200)}
                          placeholder="Search stock..." 
                          style={{ width:'100%', padding:'14px 14px 14px 40px', borderRadius:'12px', border:'2px solid var(--border)', fontSize: '0.88rem', fontWeight:700, color:'var(--text-dark)', textTransform:'uppercase', outline:'none', transition:'all 0.2s', background:'var(--bg-section)' }}
                          onFocusCapture={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--bg)'; }}
                          onBlurCapture={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-section)'; }}
                        />
                        
                        {/* Spotlight Search Dropdown */}
                        {activeRowId === row.id && filteredStocks.length > 0 && (
                          <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background: 'var(--bg)', border:'1px solid var(--border)', borderRadius:'14px', zIndex:50, boxShadow:'0 16px 48px rgba(0,0,0,0.12)', overflow:'hidden', animation:'slideUpFade 0.2s ease', minWidth:'300px' }}>
                            {filteredStocks.map((stock, i) => (
                              <div 
                                key={stock.symbol} 
                                onClick={() => selectSymbolForRow(row.id, stock.symbol)}
                                style={{ padding:'12px 16px', cursor:'pointer', borderBottom: i === filteredStocks.length - 1 ? 'none' : '1px solid var(--bg-section)', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-10)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden' }}>
                                    {stock.logo_url ? <img loading="lazy" src={formatLogoUrl(stock.logo_url)} alt={stock.symbol} style={{ width:'100%', height:'100%', objectFit:'contain' }}/> : stock.symbol.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:800, color:'var(--text-dark)', fontSize: '0.84rem' }}>{stock.symbol}</div>
                                    <div style={{ fontSize: '0.7rem', color:'var(--text-muted)', maxWidth:'120px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{stock.name}</div>
                                  </div>
                                </div>
                                <div style={{ textAlign:'right' }}>
                                  <div style={{ fontSize: '0.79rem', fontWeight:800, color:'var(--text-dark)' }}>
                                    ₦{Number(stock.daily_prices?.[0]?.price || stock.latest_price || 0).toFixed(2)}
                                  </div>
                                  <div style={{ fontSize: '0.66rem', color:'var(--text-light)' }}>Current Price</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize: '0.7rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Shares</label>
                      <input type="number" value={row.sh} onChange={e=>handleRowChange(row.id, 'sh', e.target.value)} placeholder="0" min="0" step="any" style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'2px solid var(--border)', fontSize: '0.88rem', fontWeight:700, outline:'none', background:'var(--bg-section)', transition:'all 0.2s' }} onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--bg)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-section)'; }}/>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize: '0.7rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Avg Price (₦)</label>
                      <input type="number" value={row.pr} onChange={e=>handleRowChange(row.id, 'pr', e.target.value)} placeholder="0.00" min="0" step="any" style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'2px solid var(--border)', fontSize: '0.88rem', fontWeight:700, outline:'none', background:'var(--bg-section)', transition:'all 0.2s' }} onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--bg)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-section)'; }}/>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addRow} style={{ width:'100%', padding:'16px', borderRadius:'16px', background:'var(--primary-10)', border:'2px dashed var(--primary-100)', color:'var(--primary)', fontWeight:800, fontSize: '0.84rem', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-10)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}>
                <Plus size={18}/> Add Another Holding
              </button>
            </div>

            {/* Sticky Footer */}
            <div style={{ padding:'24px 28px', borderTop:'1px solid var(--border)', background: 'var(--bg)', zIndex:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <span style={{ fontSize: '0.79rem', fontWeight:700, color:'var(--text-muted)' }}>Estimated Total</span>
                <span style={{ fontSize: '1.23rem', fontWeight:800, color:'var(--primary)' }}>
                  ₦{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div style={{ display:'flex', gap:'16px' }}>
                <button type="button" onClick={onClose} style={{ flex:1, padding:'16px', borderRadius:'14px', background:'var(--bg-section)', border:'none', color:'var(--text-dark)', fontWeight:800, fontSize: '0.88rem', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--border)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}>Cancel</button>
                <button type="submit" disabled={isAdding} style={{ flex:2, padding:'16px', borderRadius:'14px', background:'var(--primary)', border:'none', color:'var(--bg)', fontWeight:800, fontSize: '0.88rem', cursor:isAdding ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:'0 8px 24px rgba(15, 82, 87, 0.25)', opacity: isAdding ? 0.7 : 1, transition:'transform 0.2s' }} onMouseEnter={e => !isAdding && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {isAdding ? <div className="spinner" style={{ width:'20px', height:'20px', borderTopColor:'white' }}/> : 'Confirm Addition'}
                </button>
              </div>
            </div>
          </form>
        ) : tab === 'broker' ? (
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '40px 32px 32px', textAlign: 'center', background: '#FAFAFA' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--halal-bg)', color: 'var(--halal)', borderRadius: '24px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '24px' }}>
                <ShieldCheck size={16} /> End-to-End Encrypted
              </div>
              <h4 style={{ fontSize: '1.41rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
                Link your Broker
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6, maxWidth:'320px', margin:'0 auto' }}>
                Connect your brokerage account to Irshad to seamlessly track your Shariah-compliant investments.
              </p>
            </div>

            <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
              {linkMessage && (
                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: linkMessage.includes('successfully') ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: linkMessage.includes('successfully') ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} /> {linkMessage}
                </div>
              )}

              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Select an Institution</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {['Meristem', 'Stanbic IBTC', 'CSCS', 'Risevest'].map((broker) => (
                  <div 
                    key={broker}
                    onClick={() => setBrokerName(broker)}
                    style={{
                      padding: '24px', borderRadius: '16px', border: brokerName === broker ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: brokerName === broker ? 'var(--primary-50)' : 'var(--bg)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                      transition: 'all 0.2s', boxShadow: brokerName === broker ? '0 8px 24px rgba(15, 82, 87, 0.1)' : 'none'
                    }}
                  >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: brokerName === broker ? 'var(--bg)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.23rem', fontWeight: 800, color: 'var(--text-dark)', boxShadow: brokerName === broker ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                      {broker.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>{broker}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <button 
                type="button" 
                onClick={handleLinkBroker}
                disabled={linking || !brokerName}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', 
                  border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', 
                  cursor: (linking || !brokerName) ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                  boxShadow: '0 8px 24px rgba(15, 82, 87, 0.25)', opacity: (linking || !brokerName) ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {linking ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '40px 32px 32px', textAlign: 'center', background: '#FAFAFA' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '24px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '24px' }}>
                <FileText size={16} /> Bulk Import
              </div>
              <h4 style={{ fontSize: '1.41rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
                Upload Statement
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6, maxWidth:'320px', margin:'0 auto' }}>
                Upload your trade log or portfolio statement (PDF/CSV) to automatically extract your holdings.
              </p>
            </div>

            <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                style={{
                  width: '100%', padding: '48px 24px', borderRadius: '20px', border: '2px dashed var(--border)',
                  background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <UploadCloud size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.97rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center', marginBottom: '4px' }}>Click to Browse Files</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Supports .pdf, .csv, and .xlsx</div>
                </div>
                <input type="file" id="file-upload" accept=".pdf,.csv,.xlsx" style={{ display: 'none' }} onChange={(e) => {
                  if(e.target.files.length) {
                    alert('File selected: ' + e.target.files[0].name + '\n\nParsing logic will connect to the backend here.');
                    onClose();
                  }
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
