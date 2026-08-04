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
      else if (s === 'non-halal') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; color = 'var(--non-halal)'; icon = <AlertCircle size={12} />; }
    } else if (typeof rawStatus === 'string') {
      const s = rawStatus.toLowerCase();
      if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; color = 'var(--halal)'; icon = <CheckCircle2 size={12} />; }
      else if (s === 'non-halal') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; color = 'var(--non-halal)'; icon = <AlertCircle size={12} />; }
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
          
          .modal-search {
            padding: 16px 20px !important;
          }
          
          .modal-body {
            padding: 16px !important;
          }
          
          .modal-footer {
            padding: 16px 20px 24px !important;
          }
        }
      `}</style>
      <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(15,82,87,0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '24px' }}>
        <div className="modal-box" style={{ background: 'var(--bg)', borderRadius: '28px', width: '100%', maxWidth: '640px', boxShadow: '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          {/* Header */}
          <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div>
              <h3 style={{ fontSize: '1.23rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>Add to Watchlist</h3>
              <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>Select the assets you want to track.</p>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-section)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-section)'}>
              <X size={20} />
            </button>
          </div>
  
          {/* Search */}
          <div className="modal-search" style={{ padding: '20px 32px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
              <input 
                type="text" 
                placeholder="Search by symbol or name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid transparent', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', outline: 'none', background: 'var(--bg)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 8px 24px rgba(15,82,87,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
              />
            </div>
          </div>
  
          {/* List */}
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 32px' }}>
          {availableStocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No assets found. You may have already added them all!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {availableStocks.map(stock => {
                const isSelected = selectedSymbols.includes(stock.symbol);
                const cfg = getStatusConfig(stock);
                return (
                  <div 
                    key={stock.symbol}
                    onClick={() => toggleSelection(stock.symbol)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', 
                      background: isSelected ? 'var(--primary-10)' : 'var(--bg)', 
                      border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)', 
                      borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 8px 24px rgba(15,82,87,0.1)' : '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={44} radius={12} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.92rem' }}>
                          {stock.symbol}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{stock.name}</div>
                      </div>
                    </div>

                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: isSelected ? 'none' : '2px solid var(--text-light)', background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {isSelected && <CheckCircle2 size={16} color="white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {selectedSymbols.length} selected
          </div>
          <button 
            onClick={handleSubmit}
            disabled={selectedSymbols.length === 0 || isAdding}
            style={{ 
              padding: '16px 32px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', fontWeight: 800, fontSize: '0.88rem', 
              cursor: selectedSymbols.length === 0 || isAdding ? 'not-allowed' : 'pointer', 
              display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(15,82,87,0.25)', opacity: selectedSymbols.length === 0 || isAdding ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {isAdding ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : 'Add to Watchlist'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
