import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { addMultipleToWatchlist } from '../../services/api';
import CompanyLogo from '../CompanyLogo';

export default function AddWatchlistModal({ onClose, onAdded, allStocks, watchlistSymbols }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Filter stocks based on search query, excluding those already in watchlist
  const availableStocks = useMemo(() => {
    let filtered = allStocks.filter(s => !watchlistSymbols.includes(s.symbol));
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [allStocks, watchlistSymbols, searchQuery]);

  const toggleSelection = (symbol) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  const getStatusConfig = (company) => {
    let statusStr = 'DOUBTFUL';
    let cls = 'status-doubtful';
    let color = 'var(--doubtful)';
    let icon = <HelpCircle size={12} />;

    const rawStatus = company.status;
    if (typeof rawStatus === 'object' && rawStatus !== null) {
      const s = rawStatus.status?.toLowerCase();
      if (s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; color = 'var(--halal)'; icon = <CheckCircle2 size={12} />; }
      else if (s === 'non-compliant') { statusStr = 'NON-COMPLIANT'; cls = 'status-non-compliant'; color = 'var(--non-compliant)'; icon = <AlertCircle size={12} />; }
    } else if (typeof rawStatus === 'string') {
      const s = rawStatus.toLowerCase();
      if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; color = 'var(--halal)'; icon = <CheckCircle2 size={12} />; }
      else if (s === 'non-compliant') { statusStr = 'NON-COMPLIANT'; cls = 'status-non-compliant'; color = 'var(--non-compliant)'; icon = <AlertCircle size={12} />; }
    }
    return { label: statusStr, cls, icon, color };
  };

  const handleSubmit = async () => {
    if (selectedSymbols.length === 0) return;
    try {
      setIsAdding(true);
      await addMultipleToWatchlist(selectedSymbols, false, true); // Opt-in to email by default
      onAdded(selectedSymbols);
      onClose();
    } catch {
      alert('Failed to add assets. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(12px); }
        }
        .modal-overlay {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .polished-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .polished-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .polished-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
        .polished-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .modal-box {
            max-width: 100% !important;
            width: 100% !important;
            max-height: 90vh !important;
            border-radius: 28px 28px 0 0 !important;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.1) !important;
          }
          .modal-header { padding: 20px 24px 16px !important; }
          .modal-search { padding: 12px 24px !important; }
          .modal-body { padding: 16px 24px !important; }
          .modal-footer { padding: 20px 24px 32px !important; }
        }
      `}</style>
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(6, 9, 14, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }} onClick={onClose}>
        <div 
          className="modal-box" 
          onClick={e => e.stopPropagation()} 
          style={{ 
            background: 'var(--bg)', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '560px', 
            boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px var(--border) inset', 
            display: 'flex', 
            flexDirection: 'column', 
            maxHeight: 'calc(100vh - 48px)',
            minHeight: 0,
            overflow: 'hidden',
            animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
          }}
        >
          {/* Header */}
          <div className="modal-header" style={{ padding: '24px 32px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>Add to Watchlist</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>Select the assets you want to track.</p>
            </div>
            <button 
              onClick={onClose} 
              style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }} 
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dark)'; }} 
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={18} />
            </button>
          </div>
  
          {/* Search */}
          <div className="modal-search" style={{ padding: '16px 32px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
              <input 
                type="text" 
                placeholder="Search by symbol or name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-dark)', outline: 'none', background: 'var(--bg-section)', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--bg)'; e.target.style.boxShadow = '0 0 0 4px var(--primary-10)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-section)'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
              />
            </div>
          </div>
  
          {/* List */}
          <div className="modal-body polished-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 32px', minHeight: 0 }}>
          {availableStocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={24} color="var(--text-light)" />
              </div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>No assets found.</p>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>You may have already added them all, or try a different search term.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {availableStocks.map(stock => {
                const isSelected = selectedSymbols.includes(stock.symbol);
                return (
                  <div 
                    key={stock.symbol}
                    onClick={() => toggleSelection(stock.symbol)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', 
                      background: isSelected ? 'var(--primary-10)' : 'transparent', 
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)', 
                      borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={40} radius={10} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {stock.symbol}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{stock.name}</div>
                      </div>
                    </div>

                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: isSelected ? 'none' : '2px solid var(--text-light)', background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {isSelected && <CheckCircle2 size={14} color="white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{selectedSymbols.length}</span> asset{selectedSymbols.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              style={{ padding: '12px 20px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={selectedSymbols.length === 0 || isAdding}
              style={{ 
                padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem', 
                cursor: selectedSymbols.length === 0 || isAdding ? 'not-allowed' : 'pointer', 
                display: 'flex', alignItems: 'center', gap: '8px', opacity: selectedSymbols.length === 0 || isAdding ? 0.6 : 1, transition: 'all 0.2s',
                boxShadow: selectedSymbols.length > 0 ? '0 4px 12px var(--primary-50)' : 'none'
              }}
            >
              {isAdding ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }} /> : 'Add to Watchlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
