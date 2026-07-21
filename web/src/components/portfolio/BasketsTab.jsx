import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, ChevronRight, Activity, TrendingUp, TrendingDown, Star, Plus, X, Trash2, Check, DollarSign, Edit2 } from 'lucide-react';
import { fetchBaskets, fetchBasketDetails, fetchNgxStocks, createBasket, deleteBasket, investInBasket, updateBasket } from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

const getStatus = (company) => {
  if (!company) return 'unknown';
  const raw = company.status;
  if (typeof raw === 'object' && raw !== null) return raw.status?.toLowerCase() ?? 'unknown';
  if (typeof raw === 'string') return raw.toLowerCase();
  return 'unknown';
};

class BasketsErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { this.setState({ info }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'darkred', color: 'white', borderRadius: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <h3>Crash inside BasketsTab:</h3>
          <p>{String(this.state.error)}</p>
          <pre style={{ fontSize: '0.8rem' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function BasketsTabContent() {
  const [baskets, setBaskets] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_baskets_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.data?.data && Array.isArray(parsed.data.data)) return parsed.data.data;
        if (parsed?.data && Array.isArray(parsed.data)) return parsed.data;
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => baskets.length === 0);
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [basketDetails, setBasketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Custom Baskets State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState({ id: null, name: '', description: '', symbols: [] });
  const [allStocks, setAllStocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newBasket, setNewBasket] = useState({ name: '', description: '', symbols: [] });

  // Invest State
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [investMessage, setInvestMessage] = useState('');

  const navigate = useNavigate();

  const loadBaskets = async () => {
    try {
      if (baskets.length === 0) setLoading(true);
      const res = await fetchBaskets();
      const newBaskets = res.data || [];
      setBaskets(newBaskets);
      localStorage.setItem('irshad_baskets_cache_v1', JSON.stringify(newBaskets));
    } catch (err) {
      console.error('Failed to load baskets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaskets();
    // Pre-load stocks for the custom basket modal
    fetchNgxStocks().then(res => setAllStocks(res.data || [])).catch(console.error);
  }, []);

  const handleSelectBasket = async (basket) => {
    setSelectedBasket(basket);
    try {
      setLoadingDetails(true);
      const basketRes = await fetchBasketDetails(basket.id);
      const basketData = basketRes.data || {};
      
      // Use the pre-loaded allStocks state instead of making another heavy API call
      const allStocksList = allStocks.length > 0 ? allStocks : (await fetchNgxStocks()).data || [];
      
      let symbols = [];
      try {
        if (typeof basketData.symbols === 'string') {
          symbols = JSON.parse(basketData.symbols);
        } else if (Array.isArray(basketData.symbols)) {
          symbols = basketData.symbols;
        }
      } catch (e) {
        console.error('Failed to parse basket symbols', e);
      }
      
      const populatedStocks = allStocksList.filter(s => symbols.includes(s.symbol) && ['halal', 'compliant'].includes(getStatus(s)));
      setBasketDetails({ ...basketData, stocks: populatedStocks });
    } catch (err) {
      console.error('Failed to load basket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateBasket = async (e) => {
    e.preventDefault();
    if (!newBasket.name || newBasket.symbols.length === 0) return;
    try {
      setSaving(true);
      await createBasket(newBasket);
      setShowCreateModal(false);
      setNewBasket({ name: '', description: '', symbols: [] });
      await loadBaskets();
    } catch (err) {
      console.error('Failed to create basket', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBasket = async (e, id) => {
    e.stopPropagation(); // prevent opening details
    if (!window.confirm('Delete this custom basket?')) return;
    try {
      await deleteBasket(id);
      await loadBaskets();
    } catch (err) {
      console.error('Failed to delete basket', err);
    }
  };

  const handleEditBasket = async (e) => {
    e.preventDefault();
    if (!editingBasket.name || editingBasket.symbols.length === 0) return;
    try {
      setSaving(true);
      await updateBasket(editingBasket.id, editingBasket);
      setShowEditModal(false);
      await loadBaskets();
      // Re-fetch details to show the updated basket
      handleSelectBasket({ ...selectedBasket, name: editingBasket.name, description: editingBasket.description, symbols: editingBasket.symbols });
    } catch (err) {
      console.error('Failed to update basket', err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    let syms = [];
    try {
      if (typeof selectedBasket.symbols === 'string') syms = JSON.parse(selectedBasket.symbols);
      else if (Array.isArray(selectedBasket.symbols)) syms = selectedBasket.symbols;
    } catch(e) {}
    setEditingBasket({
      id: selectedBasket.id,
      name: selectedBasket.name,
      description: selectedBasket.description || '',
      symbols: syms
    });
    setShowEditModal(true);
  };

  const toggleSymbolSelection = (symbol) => {
    setNewBasket(prev => {
      const isSelected = prev.symbols.includes(symbol);
      return {
        ...prev,
        symbols: isSelected ? prev.symbols.filter(s => s !== symbol) : [...prev.symbols, symbol]
      };
    });
  };

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(investAmount);
    if (!amount || amount < 1000) return;
    
    try {
      setInvesting(true);
      const res = await investInBasket(selectedBasket.id, amount);
      toastSuccess(res.message || 'Successfully invested!');
      setTimeout(() => {
        setShowInvestModal(false);
        setInvestAmount('');
      }, 500);
    } catch (err) {
      console.error('Failed to invest', err);
      toastError(err.response?.data?.message || 'Failed to invest. Please check your broker balance.');
    } finally {
      setInvesting(false);
    }
  };

  const handleBack = () => {
    setSelectedBasket(null);
    setBasketDetails(null);
  };

  if (selectedBasket) {
    return (
      <BasketsErrorBoundary>
      <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
        <button onClick={handleBack} style={{ display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', color:'var(--text-muted)', fontWeight:700, cursor:'pointer', marginBottom:'24px', padding:'0' }}>
          <ArrowLeft size={16} /> Back to Baskets
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Briefcase size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)' }}>{selectedBasket.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop:'4px' }}>{selectedBasket.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedBasket.user_id && (
              <button 
                onClick={openEditModal}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-section)', color: 'var(--text-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}
                className="hover-lift"
              >
                <Edit2 size={18} /> Edit
              </button>
            )}
            <button 
              onClick={() => setShowInvestModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gold)', color: '#0D1B2A', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 800, cursor: 'pointer' }}
              className="hover-lift"
            >
              <DollarSign size={18} /> Invest
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading stocks in basket...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {basketDetails?.stocks?.map((stock, i) => (
              <div 
                key={stock.symbol}
                onClick={() => navigate(`/market/${stock.symbol}`)}
                style={{ 
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', 
                  background:'white', borderRadius:'16px', border:'1px solid var(--border)', cursor:'pointer',
                  transition:'all 0.2s', animationDelay: `${i * 0.05}s`
                }}
                className="roll-in-anim hover-lift"
              >
                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                  <div style={{ width:'40px', height:'40px', background:'var(--bg-section)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontWeight:800, fontSize:'0.8rem' }}>
                    {stock.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h4 style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)' }}>{stock.symbol}</h4>
                    <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{stock.name}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)' }}>₦{Number(stock.price).toFixed(2)}</div>
                    <div style={{ fontSize:'0.8rem', fontWeight:700, color: stock.change >= 0 ? 'var(--halal)' : 'var(--non-halal)', display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end' }}>
                      {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(stock.change).toFixed(2)}%
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>
              </div>
            ))}
            {(!basketDetails?.stocks || basketDetails.stocks.length === 0) && (
              <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>No stocks found in this basket.</div>
            )}
          </div>
        )}

        {/* Invest Modal */}
        {showInvestModal && (
          <div className="modal-overlay animate-fade-in" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(13, 27, 42, 0.4)', backdropFilter:'blur(4px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div className="modal-content roll-in-anim" style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'450px', boxShadow:'var(--shadow-lg)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-dark)' }}>Invest in {selectedBasket.name}</h2>
                <button onClick={() => setShowInvestModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
              </div>
              
              <form onSubmit={handleInvestSubmit} style={{ padding:'32px', display:'flex', flexDirection:'column', gap:'24px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Amount to Invest (₦)</label>
                  <input 
                    type="number"
                    min="1000"
                    step="100"
                    required
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    placeholder="Min ₦1,000"
                    style={{ width:'100%', padding:'16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1.1rem', background:'var(--bg-section)', fontWeight:700 }}
                  />
                  {investAmount && !isNaN(investAmount) && basketDetails?.stocks && basketDetails.stocks.length > 0 && (
                    <div style={{ marginTop:'12px', padding:'12px', background:'var(--primary-50)', borderRadius:'8px', fontSize:'0.85rem', color:'var(--primary)' }}>
                      <strong>Estimated Allocation:</strong> ₦{(parseFloat(investAmount) / basketDetails.stocks.length).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} per stock across {basketDetails.stocks.length} assets.
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={investing || !investAmount || parseFloat(investAmount) < 1000}
                  style={{ background:'var(--primary)', color:'white', border:'none', borderRadius:'12px', padding:'16px', fontSize:'1rem', fontWeight:800, cursor: (investing || !investAmount || parseFloat(investAmount) < 1000) ? 'not-allowed' : 'pointer', opacity: (investing || !investAmount || parseFloat(investAmount) < 1000) ? 0.5 : 1 }}
                >
                  {investing ? 'Executing...' : `Invest ₦${investAmount ? parseFloat(investAmount).toLocaleString() : '0'}`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      </BasketsErrorBoundary>
    );
  }

  return (
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'0', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '32px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Briefcase size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Thematic Baskets</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '4px' }}>Curated portfolios based on themes</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'8px', background:'var(--gold)', color:'#0D1B2A', border:'none', borderRadius:'12px', padding:'12px 20px', fontWeight:800, cursor:'pointer' }}
          className="hover-lift"
        >
          <Plus size={18} /> Custom Basket
        </button>
      </div>

      <div style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading baskets...</p>
          </div>
        ) : baskets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Briefcase size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>No thematic baskets available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {baskets.map((basket, i) => (
              <div 
                key={basket.id}
                onClick={() => handleSelectBasket(basket)}
                className="roll-in-anim"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Briefcase size={24} />
                  </div>
                  {basket.user_id && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--gold)', background:'rgba(201,168,76,0.1)', padding:'4px 8px', borderRadius:'6px' }}>CUSTOM</span>
                      <button onClick={(e) => handleDeleteBasket(e, basket.id)} style={{ background:'none', border:'none', color:'var(--non-halal)', cursor:'pointer', padding:'4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>{basket.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{basket.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px' }}>
                    {basket.symbols ? (typeof basket.symbols === 'string' ? JSON.parse(basket.symbols).length : basket.symbols.length) : 0} Stocks
                  </span>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Create Basket Modal */}
      {showCreateModal && (
        <div className="modal-overlay animate-fade-in" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(13, 27, 42, 0.6)', backdropFilter:'blur(8px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="modal-content roll-in-anim" style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'600px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'80vh' }}>
            <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background: 'linear-gradient(to right, var(--bg-section), white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary-50)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Briefcase size={20} /></div>
                <h2 style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--text-dark)', margin: 0 }}>Create Custom Basket</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background:'var(--bg-section)', border:'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'var(--text-muted)', cursor:'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--border)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}><X size={18}/></button>
            </div>
            
            <form onSubmit={handleCreateBasket} style={{ padding:'32px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'24px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.9rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Basket Name</label>
                <input 
                  required
                  value={newBasket.name}
                  onChange={e => setNewBasket({...newBasket, name: e.target.value})}
                  placeholder="e.g. My Dividend Kings"
                  style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:'2px solid var(--border)', fontSize:'1rem', background:'var(--bg-section)', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
              
              <div>
                <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Description (Optional)</label>
                <textarea 
                  value={newBasket.description}
                  onChange={e => setNewBasket({...newBasket, description: e.target.value})}
                  placeholder="What is this basket about?"
                  rows={2}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1rem', background:'var(--bg-section)', resize:'none' }}
                />
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>
                  Select Stocks ({newBasket.symbols.length} selected)
                </label>
                <div style={{ border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', maxHeight:'200px', overflowY:'auto', background:'white' }}>
                  {allStocks.filter(s => ['halal', 'compliant'].includes(getStatus(s))).map(stock => {
                    const isSelected = newBasket.symbols.includes(stock.symbol);
                    return (
                      <div 
                        key={stock.symbol}
                        onClick={() => toggleSymbolSelection(stock.symbol)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--bg-section)', cursor:'pointer', background: isSelected ? 'var(--primary-50)' : 'white', transition:'background 0.2s' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'20px', height:'20px', borderRadius:'4px', border: isSelected ? 'none' : '1px solid var(--text-light)', background: isSelected ? 'var(--primary)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div>
                            <span style={{ fontWeight:800, color:'var(--text-dark)', display:'block' }}>{stock.symbol}</span>
                            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{stock.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving || !newBasket.name || newBasket.symbols.length === 0}
                style={{ background:'var(--primary)', color:'white', border:'none', borderRadius:'12px', padding:'16px', fontSize:'1rem', fontWeight:800, cursor: (saving || !newBasket.name || newBasket.symbols.length === 0) ? 'not-allowed' : 'pointer', opacity: (saving || !newBasket.name || newBasket.symbols.length === 0) ? 0.5 : 1, marginTop:'10px', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { if (!(saving || !newBasket.name || newBasket.symbols.length === 0)) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {saving ? 'Creating...' : 'Create Basket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Basket Modal */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(13, 27, 42, 0.4)', backdropFilter:'blur(4px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="modal-content roll-in-anim" style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'600px', boxShadow:'var(--shadow-lg)', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'80vh' }}>
            <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-dark)' }}>Edit Custom Basket</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleEditBasket} style={{ padding:'32px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Basket Name</label>
                <input 
                  required
                  value={editingBasket.name}
                  onChange={e => setEditingBasket({...editingBasket, name: e.target.value})}
                  placeholder="e.g. My Dividend Kings"
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1rem', background:'var(--bg-section)' }}
                />
              </div>
              
              <div>
                <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>Description (Optional)</label>
                <textarea 
                  value={editingBasket.description}
                  onChange={e => setEditingBasket({...editingBasket, description: e.target.value})}
                  placeholder="What is this basket about?"
                  rows={2}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'1px solid var(--border)', fontSize:'1rem', background:'var(--bg-section)', resize:'none' }}
                />
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', marginBottom:'8px' }}>
                  Select Stocks ({editingBasket.symbols.length} selected)
                </label>
                <div style={{ border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', maxHeight:'200px', overflowY:'auto', background:'white' }}>
                  {allStocks.filter(s => ['halal', 'compliant'].includes(getStatus(s))).map(stock => {
                    const isSelected = editingBasket.symbols.includes(stock.symbol);
                    return (
                      <div 
                        key={stock.symbol}
                        onClick={() => {
                          setEditingBasket(prev => {
                            const selected = prev.symbols.includes(stock.symbol);
                            return { ...prev, symbols: selected ? prev.symbols.filter(s => s !== stock.symbol) : [...prev.symbols, stock.symbol] };
                          });
                        }}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--bg-section)', cursor:'pointer', background: isSelected ? 'var(--primary-50)' : 'white', transition:'background 0.2s' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'20px', height:'20px', borderRadius:'4px', border: isSelected ? 'none' : '1px solid var(--text-light)', background: isSelected ? 'var(--primary)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div>
                            <span style={{ fontWeight:800, color:'var(--text-dark)', display:'block' }}>{stock.symbol}</span>
                            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{stock.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving || !editingBasket.name || editingBasket.symbols.length === 0}
                style={{ background:'var(--primary)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'1rem', fontWeight:800, cursor: (saving || !editingBasket.name || editingBasket.symbols.length === 0) ? 'not-allowed' : 'pointer', opacity: (saving || !editingBasket.name || editingBasket.symbols.length === 0) ? 0.5 : 1, marginTop:'10px' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function BasketsTab() {
  return (
    <BasketsErrorBoundary>
      <BasketsTabContent />
    </BasketsErrorBoundary>
  );
}
