import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Layers, Search, ArrowLeft, Plus, Check, X, Wallet, Edit2, Trash2,
  ShieldCheck, Sparkles, TrendingUp, TrendingDown, Info,
  ChevronRight, Award, Leaf, Zap, ShoppingBag, Hammer, Coins,
  ExternalLink, CheckCircle2, RefreshCw
} from 'lucide-react';
import {
  fetchBaskets, createBasket, updateBasket,
  deleteBasket, investInBasket, fetchNgxStocks, fetchPortfolio
} from '../../services/api';
import CompanyLogo from '../CompanyLogo';
import { toastSuccess, toastError } from '../../utils/toast';
import { customConfirm } from '../../utils/confirm';
import { useAuth } from '../../context/AuthContext';
import localforage from 'localforage';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const parseSymbols = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        const double = JSON.parse(parsed);
        if (Array.isArray(double)) return double;
      }
    } catch {}
  }
  return [];
};

const getStatus = (stock) => {
  if (!stock) return 'doubtful';
  const raw = stock.current_status || stock.status?.status || stock.aaoifi_screening?.final_status || stock.aaoifiScreening?.final_status || '';
  return String(raw).toLowerCase();
};

const isHalal = (stock) => {
  const s = getStatus(stock);
  return s === 'halal' || s === 'compliant';
};

const getCategoryMeta = (category = '') => {
  const cat = String(category).toLowerCase();
  if (cat.includes('premium') || cat.includes('blue chip')) {
    return { icon: Award, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', label: 'Nigeria Premium' };
  }
  if (cat.includes('agri')) {
    return { icon: Leaf, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', label: 'Agriculture' };
  }
  if (cat.includes('energy') || cat.includes('power')) {
    return { icon: Zap, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.25)', label: 'Energy & Power' };
  }
  if (cat.includes('consumer')) {
    return { icon: ShoppingBag, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)', label: 'Consumer Goods' };
  }
  if (cat.includes('industrial') || cat.includes('infra') || cat.includes('real estate')) {
    return { icon: Hammer, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.25)', label: 'Industrial' };
  }
  if (cat.includes('dividend') || cat.includes('income')) {
    return { icon: Coins, color: '#15803d', bg: 'rgba(21, 128, 61, 0.1)', border: 'rgba(21, 128, 61, 0.25)', label: 'Dividends' };
  }
  return { icon: Layers, color: 'var(--primary)', bg: 'var(--primary-50)', border: 'var(--primary-100)', label: category || 'Custom Theme' };
};

const fmtNaira = (n) => {
  const v = Number(n || 0);
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function BasketsTab({ onUpgrade }) {
  const { user } = useAuth();

  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [allStocks, setAllStocks] = useState([]);
  const [stocksMap, setStocksMap] = useState({});
  const [cashBalance, setCashBalance] = useState(0);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'curated' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBasket, setNewBasket] = useState({ name: '', description: '', category: 'Custom', symbols: [] });
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [savingBasket, setSavingBasket] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState({ id: null, name: '', description: '', category: 'Custom', symbols: [] });
  const [editStockSearchQuery, setEditStockSearchQuery] = useState('');
  const [updatingBasket, setUpdatingBasket] = useState(false);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  // Pre-load cached data immediately for instant render
  useEffect(() => {
    localforage.getItem('irshad_baskets_cache').then(cached => {
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setBaskets(cached);
        setLoading(false);
      }
    }).catch(() => {});

    // Try to hydrate cash balance
    localforage.getItem('irshad_portfolio_cache').then(cached => {
      if (cached?.data?.summary?.cash_balance !== undefined) {
        setCashBalance(Number(cached.data.summary.cash_balance) || 0);
      }
    }).catch(() => {});
  }, []);

  // Fetch stocks & baskets
  const loadData = async (silent = false) => {
    if (!silent && baskets.length === 0) setLoading(true);
    try {
      const [basketsRes, stocksRes, portRes] = await Promise.allSettled([
        fetchBaskets(),
        fetchNgxStocks(),
        fetchPortfolio(),
      ]);

      if (basketsRes.status === 'fulfilled') {
        const list = Array.isArray(basketsRes.value) ? basketsRes.value : (basketsRes.value?.data || []);
        setBaskets(list);
        localforage.setItem('irshad_baskets_cache', list).catch(() => {});
      }

      if (stocksRes.status === 'fulfilled') {
        const stocks = Array.isArray(stocksRes.value?.data) ? stocksRes.value.data : (stocksRes.value?.data?.data || []);
        setAllStocks(stocks);
        const map = {};
        stocks.forEach(s => {
          if (s.symbol) map[s.symbol.toUpperCase()] = s;
        });
        setStocksMap(map);
      }

      if (portRes.status === 'fulfilled' && portRes.value?.data?.summary?.cash_balance !== undefined) {
        setCashBalance(Number(portRes.value.data.summary.cash_balance) || 0);
      }
    } catch (e) {
      console.error('[BasketsTab] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute stats
  const curatedCount = useMemo(() => baskets.filter(b => b.user_id === null).length, [baskets]);
  const customCount = useMemo(() => baskets.filter(b => b.user_id !== null).length, [baskets]);

  // Filtered baskets
  const filteredBaskets = useMemo(() => {
    return baskets.filter(b => {
      if (activeFilter === 'curated' && b.user_id !== null) return false;
      if (activeFilter === 'custom' && b.user_id === null) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (b.name || '').toLowerCase().includes(q);
      const matchDesc = (b.description || '').toLowerCase().includes(q);
      const matchCategory = (b.category || '').toLowerCase().includes(q);
      const syms = parseSymbols(b.symbols);
      const matchSymbol = syms.some(s => s.toLowerCase().includes(q));

      return matchName || matchDesc || matchCategory || matchSymbol;
    });
  }, [baskets, activeFilter, searchQuery]);

  // Selected Basket details & constituent metrics
  const selectedDetails = useMemo(() => {
    if (!selectedBasket) return null;
    const syms = parseSymbols(selectedBasket.symbols);
    const constituents = syms.map(sym => {
      const s = stocksMap[sym.toUpperCase()];
      return s || { symbol: sym, name: sym, latest_price: 0, price_change_pct: 0, current_status: 'halal' };
    });

    let totalChange = 0;
    let countedChange = 0;
    let halalCount = 0;
    let sumSharePrices = 0;
    let topPerformer = null;
    let maxGain = -Infinity;

    constituents.forEach(st => {
      const price = Number(st.latest_price || st.daily_prices?.[0]?.price || 0);
      const change = Number(st.price_change_pct || st.change_pct || 0);
      if (price > 0) sumSharePrices += price;

      if (!isNaN(change)) {
        totalChange += change;
        countedChange++;
        if (change > maxGain) {
          maxGain = change;
          topPerformer = st;
        }
      }

      if (isHalal(st)) halalCount++;
    });

    const avgChange = countedChange > 0 ? (totalChange / countedChange) : 0;

    return {
      symbols: syms,
      constituents,
      avgChange,
      halalCount,
      sumSharePrices,
      topPerformer,
    };
  }, [selectedBasket, stocksMap]);

  // Halal-only stocks for custom basket picker
  const eligibleStocks = useMemo(() => {
    return allStocks.filter(s => isHalal(s));
  }, [allStocks]);

  // Check Plan Limit for Custom Basket Creation
  const handleOpenCreateModal = () => {
    const limit = user?.tier?.features?.baskets ?? 0;
    if (limit !== -1 && customCount >= limit) {
      if (onUpgrade) onUpgrade();
      else toastError('You have reached your custom baskets limit. Please upgrade your plan.');
      return;
    }
    setNewBasket({ name: '', description: '', category: 'Custom', symbols: [] });
    setStockSearchQuery('');
    setShowCreateModal(true);
  };

  // Create Basket Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newBasket.name.trim()) {
      toastError('Please enter a basket name.');
      return;
    }
    if (newBasket.symbols.length === 0) {
      toastError('Please select at least 1 Shariah-compliant stock.');
      return;
    }

    try {
      setSavingBasket(true);
      await createBasket({
        name: newBasket.name.trim(),
        description: newBasket.description.trim() || null,
        category: newBasket.category || 'Custom',
        symbols: newBasket.symbols,
      });
      toastSuccess('Custom basket created successfully!');
      setShowCreateModal(false);
      await loadData(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create basket.';
      if (msg.toLowerCase().includes('upgrade') || msg.toLowerCase().includes('limit')) {
        setShowCreateModal(false);
        if (onUpgrade) onUpgrade();
      } else {
        toastError(msg);
      }
    } finally {
      setSavingBasket(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (basket) => {
    const syms = parseSymbols(basket.symbols);
    setEditingBasket({
      id: basket.id,
      name: basket.name || '',
      description: basket.description || '',
      category: basket.category || 'Custom',
      symbols: syms,
    });
    setEditStockSearchQuery('');
    setShowEditModal(true);
  };

  // Edit Basket Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBasket.name.trim()) {
      toastError('Please enter a basket name.');
      return;
    }
    if (editingBasket.symbols.length === 0) {
      toastError('Please select at least 1 stock.');
      return;
    }

    try {
      setUpdatingBasket(true);
      await updateBasket(editingBasket.id, {
        name: editingBasket.name.trim(),
        description: editingBasket.description.trim() || null,
        category: editingBasket.category || 'Custom',
        symbols: editingBasket.symbols,
      });
      toastSuccess('Basket updated successfully!');
      setShowEditModal(false);
      if (selectedBasket && selectedBasket.id === editingBasket.id) {
        setSelectedBasket(prev => ({
          ...prev,
          name: editingBasket.name.trim(),
          description: editingBasket.description.trim() || null,
          symbols: editingBasket.symbols,
        }));
      }
      await loadData(true);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update basket.');
    } finally {
      setUpdatingBasket(false);
    }
  };

  // Delete Basket Handler
  const handleDeleteBasket = async (basket, e) => {
    if (e) e.stopPropagation();
    const confirmed = await customConfirm(`Are you sure you want to delete "${basket.name}"?`);
    if (!confirmed) return;

    try {
      await deleteBasket(basket.id);
      toastSuccess('Basket deleted successfully.');
      if (selectedBasket && selectedBasket.id === basket.id) {
        setSelectedBasket(null);
      }
      await loadData(true);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete basket.');
    }
  };

  // Invest in Basket Handler
  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(String(investAmount).replace(/,/g, ''));
    if (isNaN(amount) || amount < 1000) {
      toastError('Minimum investment is ₦1,000.');
      return;
    }
    if (amount > cashBalance) {
      toastError(`Insufficient funds. Your brokerage cash balance is ${fmtNaira(cashBalance)}.`);
      return;
    }

    try {
      setInvesting(true);
      const res = await investInBasket(selectedBasket.id, amount);
      toastSuccess(res.message || 'Successfully invested in basket!');
      setShowInvestModal(false);
      setInvestAmount('');
      await loadData(true);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to execute basket investment.');
    } finally {
      setInvesting(false);
    }
  };

  // Quick Amount Selector for Investment Modal
  const setQuickAmount = (val) => {
    if (val === 'max') {
      setInvestAmount(Math.floor(cashBalance).toString());
    } else {
      setInvestAmount(val.toString());
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ─── Breadcrumb / Detail Header (When Selected) ─── */}
      {selectedBasket ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <button
              onClick={() => setSelectedBasket(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '10px 18px',
                color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.86rem',
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <ArrowLeft size={16} /> Back to All Baskets
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedBasket.user_id !== null && (
                <>
                  <button
                    onClick={() => handleOpenEditModal(selectedBasket)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '10px 16px',
                      color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.84rem',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <Edit2 size={15} /> Edit
                  </button>
                  <button
                    onClick={(e) => handleDeleteBasket(selectedBasket, e)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px', padding: '10px 16px',
                      color: 'var(--non-compliant)', fontWeight: 700, fontSize: '0.84rem',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setInvestAmount('');
                  setShowInvestModal(true);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #166534 100%)',
                  border: 'none', borderRadius: '12px', padding: '11px 22px',
                  color: 'white', fontWeight: 800, fontSize: '0.88rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 8px 20px rgba(21, 128, 61, 0.25)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <Wallet size={16} /> Invest in Basket
              </button>
            </div>
          </div>

          {/* Hero Banner for Selected Basket */}
          {(() => {
            const meta = getCategoryMeta(selectedBasket.category || (selectedBasket.user_id ? 'Custom' : 'Thematic'));
            const IconComp = meta.icon;
            return (
              <div style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '30px 32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: meta.color }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '18px',
                      background: meta.bg, border: `1px solid ${meta.border}`,
                      color: meta.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0
                    }}>
                      <IconComp size={32} />
                    </div>

                    <div style={{ maxWidth: '640px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          background: meta.bg, color: meta.color,
                          fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px'
                        }}>
                          {meta.label}
                        </span>

                        {selectedBasket.user_id === null ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '20px',
                            background: 'rgba(21, 128, 61, 0.1)', color: 'var(--halal)',
                            fontSize: '0.68rem', fontWeight: 800
                          }}>
                            <ShieldCheck size={12} /> Curated by Irshad
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px',
                            background: 'var(--primary-50)', color: 'var(--primary)',
                            fontSize: '0.68rem', fontWeight: 800
                          }}>
                            My Custom Basket
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
                        {selectedBasket.name}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        {selectedBasket.description || 'Curated portfolio basket of verified Shariah-compliant equities.'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div style={{
                    display: 'flex', gap: '16px', background: 'var(--bg-section)',
                    border: '1px solid var(--border)', borderRadius: '18px', padding: '16px 20px',
                    alignItems: 'center', flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Holdings</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                        {selectedDetails?.symbols?.length || 0} Stocks
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg 1D Move</div>
                      <div style={{
                        fontSize: '1.15rem', fontWeight: 900,
                        color: (selectedDetails?.avgChange || 0) >= 0 ? 'var(--halal)' : 'var(--non-compliant)'
                      }}>
                        {(selectedDetails?.avgChange || 0) >= 0 ? '+' : ''}
                        {(selectedDetails?.avgChange || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shariah Verdict</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--halal)' }}>
                        100% Halal
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Constituents Table Card */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>
                  Basket Constituents
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Stocks included in this theme with live market prices, daily returns, and AAOIFI status.
                </p>
              </div>

              <div style={{
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                background: 'var(--bg-section)', padding: '6px 14px', borderRadius: '10px',
                border: '1px solid var(--border)'
              }}>
                Allocation: Equal Weight ({selectedDetails?.symbols?.length ? (100 / selectedDetails.symbols.length).toFixed(1) : 0}% each)
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sector</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>1D Return</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Compliance</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetails?.constituents?.map((st) => {
                    const price = Number(st.latest_price || st.daily_prices?.[0]?.price || 0);
                    const change = Number(st.price_change_pct || st.change_pct || 0);
                    const isPositive = change >= 0;
                    return (
                      <tr key={st.symbol} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CompanyLogo symbol={st.symbol} logoUrl={st.logo_url} size={38} radius={10} />
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.92rem' }}>
                                {st.symbol}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.name || st.company_name || st.symbol}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '16px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {st.sector || 'Equities'}
                        </td>

                        <td style={{ padding: '16px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.92rem' }}>
                          {price > 0 ? fmtNaira(price) : '—'}
                        </td>

                        <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontWeight: 800, fontSize: '0.82rem',
                            color: isPositive ? 'var(--halal)' : 'var(--non-compliant)'
                          }}>
                            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </td>

                        <td style={{ padding: '16px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '12px',
                            background: 'rgba(34, 197, 94, 0.1)', color: 'var(--halal)',
                            fontSize: '0.72rem', fontWeight: 800
                          }}>
                            <CheckCircle2 size={12} /> Halal
                          </span>
                        </td>

                        <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                          <Link
                            to={`/stocks/${st.symbol}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '6px 12px', borderRadius: '8px',
                              background: 'var(--bg-section)', border: '1px solid var(--border)',
                              color: 'var(--text-dark)', fontSize: '0.76rem', fontWeight: 700,
                              textDecoration: 'none', transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Strategy Explanation Card */}
            <div style={{
              marginTop: '24px', padding: '18px 20px', borderRadius: '16px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              display: 'flex', gap: '14px', alignItems: 'flex-start'
            }}>
              <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-dark)' }}>How Basket Execution Works:</strong> When you invest in this thematic basket,
                your capital is equally allocated across all active Shariah-compliant constituent equities. Orders are executed in whole shares
                directly through your linked broker account, and fractional uninvested balances remain safely in your cash balance.
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* ─── Grid View (All Baskets) ─── */
        <>
          {/* Top Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ maxWidth: '640px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px', background: 'var(--primary-50)',
                  border: '1px solid var(--primary-100)', color: 'var(--primary)',
                  fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.6px', marginBottom: '12px'
                }}>
                  <Sparkles size={13} /> Thematic Investing
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 10px', letterSpacing: '-0.6px' }}>
                  Thematic Halal Baskets
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                  Curated collections of verified Shariah-compliant Nigerian equities grouped by market themes,
                  dividend resilience, and economic sectors. Invest across an entire strategy with a single click.
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #166534 100%)',
                  border: 'none', borderRadius: '14px', padding: '14px 24px',
                  color: 'white', fontWeight: 800, fontSize: '0.92rem',
                  cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: '0 10px 24px rgba(21, 128, 61, 0.25)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <Plus size={18} /> Create Custom Basket
              </button>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Baskets</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>{baskets.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Curated & custom collections</div>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Curated Themes</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>{curatedCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Professionally screened themes</div>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>My Custom Baskets</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>{customCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Created by you</div>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Compliance Engine</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--halal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--halal)' }}>100% Halal</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>AAOIFI standard screened</div>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: '20px', padding: '12px 18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${baskets.length})` },
                { id: 'curated', label: `Curated (${curatedCount})` },
                { id: 'custom', label: `Custom (${customCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    padding: '8px 18px', borderRadius: '12px', border: 'none',
                    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeFilter === tab.id ? 'var(--primary)' : 'transparent',
                    color: activeFilter === tab.id ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '8px 14px', width: '100%', maxWidth: '320px'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search baskets or symbols..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '0.84rem', color: 'var(--text-dark)', width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Baskets Grid */}
          {loading && baskets.length === 0 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px'
            }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', height: '240px', border: '1px solid var(--border)' }} className="skeleton" />
              ))}
            </div>
          ) : filteredBaskets.length === 0 ? (
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px',
              padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-50)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Layers size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 8px' }}>
                {activeFilter === 'custom' ? 'No Custom Baskets Yet' : 'No Baskets Found'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                {activeFilter === 'custom'
                  ? 'Create your first custom basket by grouping your favourite Halal Nigerian stocks into a personalized theme.'
                  : 'Try adjusting your search criteria or switch back to the All Baskets tab.'}
              </p>
              {activeFilter === 'custom' && (
                <button
                  onClick={handleOpenCreateModal}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'var(--primary)', color: 'white', border: 'none',
                    borderRadius: '12px', padding: '12px 24px', fontWeight: 800,
                    fontSize: '0.88rem', cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Create Custom Basket
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px'
            }}>
              {filteredBaskets.map(basket => {
                const meta = getCategoryMeta(basket.category || (basket.user_id ? 'Custom' : 'Thematic'));
                const IconComp = meta.icon;
                const syms = parseSymbols(basket.symbols);

                // Calculate average move for card preview
                let avgChange = 0;
                let count = 0;
                syms.forEach(sym => {
                  const s = stocksMap[sym.toUpperCase()];
                  if (s && !isNaN(Number(s.price_change_pct))) {
                    avgChange += Number(s.price_change_pct);
                    count++;
                  }
                });
                const cardChange = count > 0 ? (avgChange / count) : 0;
                const isPositive = cardChange >= 0;

                return (
                  <div
                    key={basket.id}
                    onClick={() => setSelectedBasket(basket)}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '24px',
                      padding: '24px',
                      display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {/* Top color indicator */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: meta.color }} />

                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '14px',
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          color: meta.color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0
                        }}>
                          <IconComp size={22} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '14px',
                            background: meta.bg, color: meta.color,
                            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                          }}>
                            {meta.label}
                          </span>

                          {basket.user_id === null ? (
                            <span style={{
                              padding: '3px 8px', borderRadius: '14px',
                              background: 'rgba(21, 128, 61, 0.1)', color: 'var(--halal)',
                              fontSize: '0.65rem', fontWeight: 800
                            }}>
                              Curated
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(basket); }}
                                style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 8px', color: 'var(--text-dark)', cursor: 'pointer' }}
                                title="Edit basket"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteBasket(basket, e)}
                                style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '4px 8px', color: 'var(--non-compliant)', cursor: 'pointer' }}
                                title="Delete basket"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                        {basket.name}
                      </h3>
                      <p style={{
                        color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.55, margin: '0 0 16px',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {basket.description || 'Verified Shariah-compliant equity basket.'}
                      </p>

                      {/* Stock Pills Preview */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                        {syms.slice(0, 5).map(sym => (
                          <span
                            key={sym}
                            style={{
                              padding: '3px 8px', borderRadius: '8px',
                              background: 'var(--bg-section)', border: '1px solid var(--border)',
                              fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dark)'
                            }}
                          >
                            {sym}
                          </span>
                        ))}
                        {syms.length > 5 && (
                          <span style={{
                            padding: '3px 8px', borderRadius: '8px',
                            background: 'var(--primary-50)', color: 'var(--primary)',
                            fontSize: '0.72rem', fontWeight: 800
                          }}>
                            +{syms.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata & Explore CTA */}
                    <div style={{
                      borderTop: '1px solid var(--border)', paddingTop: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>1D Avg Move: </span>
                        <span style={{
                          fontWeight: 800, fontSize: '0.82rem',
                          color: isPositive ? 'var(--halal)' : 'var(--non-compliant)'
                        }}>
                          {isPositive ? '+' : ''}{cardChange.toFixed(2)}%
                        </span>
                      </div>

                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem'
                      }}>
                        Explore <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Create Custom Basket Modal ─── */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'slideUpFade 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px' }}>
                  Create Custom Basket
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Build your personalized portfolio basket of verified Halal Nigerian stocks.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Basket Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My High Yield Halal"
                  value={newBasket.name}
                  onChange={e => setNewBasket({ ...newBasket, name: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-section)',
                    fontSize: '0.88rem', color: 'var(--text-dark)', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the objective or strategy behind this theme?"
                  value={newBasket.description}
                  onChange={e => setNewBasket({ ...newBasket, description: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-section)',
                    fontSize: '0.88rem', color: 'var(--text-dark)', outline: 'none', resize: 'none'
                  }}
                />
              </div>

              {/* Stock Multi-Select */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Select Constituent Stocks ({newBasket.symbols.length} selected) *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--halal)', fontWeight: 700 }}>
                    100% Shariah Compliant Only
                  </span>
                </div>

                {/* Stock Search Box */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '8px 12px', marginBottom: '10px'
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search stock by symbol or name..."
                    value={stockSearchQuery}
                    onChange={e => setStockSearchQuery(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      fontSize: '0.82rem', color: 'var(--text-dark)', width: '100%'
                    }}
                  />
                  {stockSearchQuery && (
                    <button type="button" onClick={() => setStockSearchQuery('')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Stock Selection List */}
                <div style={{
                  border: '1px solid var(--border)', borderRadius: '14px',
                  maxHeight: '220px', overflowY: 'auto', background: 'var(--bg)'
                }}>
                  {eligibleStocks
                    .filter(s => {
                      if (!stockSearchQuery.trim()) return true;
                      const q = stockSearchQuery.toLowerCase();
                      return (s.symbol || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
                    })
                    .map(stock => {
                      const isSelected = newBasket.symbols.includes(stock.symbol);
                      const price = Number(stock.latest_price || stock.daily_prices?.[0]?.price || 0);
                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => {
                            setNewBasket(prev => ({
                              ...prev,
                              symbols: isSelected
                                ? prev.symbols.filter(sym => sym !== stock.symbol)
                                : [...prev.symbols, stock.symbol]
                            }));
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', transition: 'background 0.15s',
                            background: isSelected ? 'var(--primary-50)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '6px',
                              border: isSelected ? 'none' : '1.5px solid var(--border)',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                              {isSelected && <Check size={13} />}
                            </div>

                            <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={28} radius={8} />

                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.86rem' }}>
                                {stock.symbol}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {stock.name || stock.symbol}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-dark)' }}>
                            {price > 0 ? fmtNaira(price) : '—'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    background: 'var(--bg-section)', border: '1px solid var(--border)',
                    color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBasket || !newBasket.name.trim() || newBasket.symbols.length === 0}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px',
                    background: 'var(--primary)', border: 'none',
                    color: 'white', fontWeight: 800, fontSize: '0.88rem',
                    cursor: (savingBasket || !newBasket.name.trim() || newBasket.symbols.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (savingBasket || !newBasket.name.trim() || newBasket.symbols.length === 0) ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {savingBasket ? <RefreshCw size={16} className="spin" /> : 'Create Basket'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Edit Custom Basket Modal ─── */}
      {showEditModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'slideUpFade 0.3s ease-out'
          }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px' }}>
                  Edit Custom Basket
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Update the name, description, or constituent stocks of your basket.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Basket Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingBasket.name}
                  onChange={e => setEditingBasket({ ...editingBasket, name: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-section)',
                    fontSize: '0.88rem', color: 'var(--text-dark)', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingBasket.description}
                  onChange={e => setEditingBasket({ ...editingBasket, description: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-section)',
                    fontSize: '0.88rem', color: 'var(--text-dark)', outline: 'none', resize: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Select Constituent Stocks ({editingBasket.symbols.length} selected) *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--halal)', fontWeight: 700 }}>
                    100% Shariah Compliant Only
                  </span>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '8px 12px', marginBottom: '10px'
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search stock by symbol or name..."
                    value={editStockSearchQuery}
                    onChange={e => setEditStockSearchQuery(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      fontSize: '0.82rem', color: 'var(--text-dark)', width: '100%'
                    }}
                  />
                  {editStockSearchQuery && (
                    <button type="button" onClick={() => setEditStockSearchQuery('')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{
                  border: '1px solid var(--border)', borderRadius: '14px',
                  maxHeight: '220px', overflowY: 'auto', background: 'var(--bg)'
                }}>
                  {eligibleStocks
                    .filter(s => {
                      if (!editStockSearchQuery.trim()) return true;
                      const q = editStockSearchQuery.toLowerCase();
                      return (s.symbol || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
                    })
                    .map(stock => {
                      const isSelected = editingBasket.symbols.includes(stock.symbol);
                      const price = Number(stock.latest_price || stock.daily_prices?.[0]?.price || 0);
                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => {
                            setEditingBasket(prev => ({
                              ...prev,
                              symbols: isSelected
                                ? prev.symbols.filter(sym => sym !== stock.symbol)
                                : [...prev.symbols, stock.symbol]
                            }));
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', transition: 'background 0.15s',
                            background: isSelected ? 'var(--primary-50)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '6px',
                              border: isSelected ? 'none' : '1.5px solid var(--border)',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                              {isSelected && <Check size={13} />}
                            </div>

                            <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={28} radius={8} />

                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.86rem' }}>
                                {stock.symbol}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {stock.name || stock.symbol}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-dark)' }}>
                            {price > 0 ? fmtNaira(price) : '—'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    background: 'var(--bg-section)', border: '1px solid var(--border)',
                    color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBasket || !editingBasket.name.trim() || editingBasket.symbols.length === 0}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px',
                    background: 'var(--primary)', border: 'none',
                    color: 'white', fontWeight: 800, fontSize: '0.88rem',
                    cursor: (updatingBasket || !editingBasket.name.trim() || editingBasket.symbols.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (updatingBasket || !editingBasket.name.trim() || editingBasket.symbols.length === 0) ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {updatingBasket ? <RefreshCw size={16} className="spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Invest in Basket Modal ─── */}
      {showInvestModal && selectedBasket && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '520px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'slideUpFade 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #166534 100%)',
              padding: '28px 28px 22px', color: 'white', textAlign: 'center'
            }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Wallet size={26} color="white" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 4px', color: 'white' }}>
                Invest in {selectedBasket.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Equal-weight allocation across {selectedDetails?.symbols?.length || 0} Shariah-compliant equities.
              </p>
            </div>

            {/* Body */}
            <form onSubmit={handleInvestSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Cash Balance Indicator */}
              <div style={{
                background: 'var(--bg-section)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Broker Cash</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-dark)' }}>{fmtNaira(cashBalance)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAmount('max')}
                  style={{
                    background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
                    color: 'var(--primary)', fontWeight: 800, fontSize: '0.74rem',
                    padding: '6px 12px', borderRadius: '8px', cursor: 'pointer'
                  }}
                >
                  Use Max
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Investment Amount (NGN) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>₦</span>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    required
                    placeholder="e.g. 50000"
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '14px 16px 14px 34px', borderRadius: '12px',
                      border: '1px solid var(--border)', background: 'var(--bg-section)',
                      fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', outline: 'none'
                    }}
                  />
                </div>

                {/* Quick Chips */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {[10000, 25000, 50000, 100000, 250000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(amt)}
                      style={{
                        padding: '6px 12px', borderRadius: '8px',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dark)',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      +₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Allocation Preview */}
              {(() => {
                const num = parseFloat(investAmount);
                if (!num || num < 1000 || !selectedDetails?.symbols?.length) return null;
                const perStock = num / selectedDetails.symbols.length;
                return (
                  <div style={{
                    background: 'rgba(21, 128, 61, 0.05)', border: '1px solid rgba(21, 128, 61, 0.15)',
                    borderRadius: '14px', padding: '14px 18px'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--halal)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Estimated Allocation
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 700 }}>
                      ~{fmtNaira(perStock)} allocated to each of the {selectedDetails.symbols.length} stocks
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Orders are filled in whole share units based on live market pricing.
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowInvestModal(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    background: 'var(--bg-section)', border: '1px solid var(--border)',
                    color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investing || !investAmount || Number(investAmount) < 1000}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #166534 100%)',
                    border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem',
                    cursor: (investing || !investAmount || Number(investAmount) < 1000) ? 'not-allowed' : 'pointer',
                    opacity: (investing || !investAmount || Number(investAmount) < 1000) ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {investing ? <RefreshCw size={16} className="spin" /> : 'Confirm & Invest'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
