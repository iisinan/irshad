import React, { useState } from 'react';
import { Shield, Search, CheckCircle, Edit2, X, TrendingUp, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import CompanyLogo from './CompanyLogo';
import { useAuth } from '../context/AuthContext';
import { toastError, toastSuccess } from '../utils/toast';
import ZakatSettingsAdmin from './ZakatSettingsAdmin';


// ─── Status Badge ────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    halal:     { color: 'var(--halal)',     bg: 'var(--halal-bg)',     label: 'Halal' },
    'non-halal': { color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', label: 'Non-Halal' },
    doubtful:  { color: 'var(--doubtful)',  bg: 'var(--doubtful-bg)',  label: 'Doubtful' },
    review:    { color: 'var(--review)',    bg: 'var(--review-bg)',    label: 'Under Review' },
  };
  const s = map[status] || { color: 'var(--text-muted)', bg: 'var(--bg-section)', label: status || 'Unknown' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 12px', borderRadius: '100px',
      fontSize: '0.72rem', fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Tab Button ──────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '9px 18px', borderRadius: '10px', border: 'none',
      background: active ? 'var(--bg)' : 'transparent',
      color: active ? 'var(--text-dark)' : 'var(--text-muted)',
      fontWeight: active ? 700 : 600,
      fontSize: '0.82rem', cursor: 'pointer',
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.2s',
    }}>
      <Icon size={15} style={{ opacity: active ? 1 : 0.7 }} />
      {label}
    </button>
  );
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // ── React Query fetchers (cache-first, background refresh) ──
  const { data: stocks = [], isFetching: stocksFetching, refetch: refetchStocks, error: stocksError } = useQuery({
    queryKey: ['admin-stocks'],
    queryFn: async () => {
      const res = await api.get('/stocks');
      const data = res.data?.data || [];
      localStorage.setItem('irshad_admin_stocks_v1', JSON.stringify(data));
      return data;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('irshad_admin_stocks_v1');
        return cached ? JSON.parse(cached) : undefined;
      } catch { return undefined; }
    },
    staleTime: 1000 * 60 * 5, // 5 min — serve cache instantly, revalidate after
    gcTime: 1000 * 60 * 60,
  });

  const { data: alerts = [], refetch: refetchAlerts, error: alertsError } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await api.get('/admin/alerts');
      const data = res.data?.data || res.data || [];
      localStorage.setItem('irshad_admin_alerts_v1', JSON.stringify(data));
      return data;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('irshad_admin_alerts_v1');
        return cached ? JSON.parse(cached) : undefined;
      } catch { return undefined; }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });

  const loading = stocksFetching && stocks.length === 0;
  const error = stocksError?.message || alertsError?.message;

  const loadData = () => {
    refetchStocks();
    refetchAlerts();
  };

  const [activeTab, setActiveTab] = useState('stocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  // When status is updated locally, also invalidate the query cache
  const patchStock = (symbol, updatedStock) => {
    queryClient.setQueryData(['admin-stocks'], (old = []) =>
      old.map(s => s.symbol === symbol ? updatedStock : s)
    );
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem || !newStatus || !reason) return;
    setUpdating(true);
    try {
      if (selectedItem.type === 'stocks') {
        const res = await api.put(`/stocks/${selectedItem.data.symbol}/status`, { status: newStatus, reason });
        patchStock(selectedItem.data.symbol, res.data.data);
      }
      setSelectedItem(null); setNewStatus(''); setReason('');
      toastSuccess('Status updated successfully');
    } catch (err) {
      toastError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      await api.post(`/admin/alerts/${id}/resolve`);
      queryClient.setQueryData(['admin-alerts'], (old = []) => old.filter(a => a.id !== id));
      toastSuccess('Alert resolved');
    } catch { toastError('Failed to resolve alert'); }
  };

  const handleExport = async () => {
    try {
      toastSuccess('Generating export...');
      // Use axios with responseType blob - auth interceptor is applied automatically
      const response = await api.get('/admin/stocks/export', {
        responseType: 'blob',
        headers: { 'Accept': 'text/csv' },
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `irshad_stocks_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toastSuccess('Download started!');
    } catch (err) {
      console.error('Export error:', err);
      toastError('Failed to export stocks. Please try again.');
    }
  };

  const handleImportPreview = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setImporting(true);
    try {
      const res = await api.post('/admin/stocks/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportPreview(res.data.data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to parse CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const res = await api.post('/admin/stocks/import/confirm', { changes: importPreview });
      toastSuccess(res.data.message || 'Import successful');
      setImportPreview(null);
      loadData();
    } catch (err) {
      console.error(err);
      toastError('Failed to apply import');
    } finally {
      setImporting(false);
    }
  };

  let filteredData = stocks.filter(s =>
    s.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statusFilter !== 'all') {
    filteredData = filteredData.filter(s => s.status?.status === statusFilter);
  }





  if (user?.role !== 'admin' && user?.role !== 'scholar') {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Shield size={36} />
        </div>
        <h2 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="admin-page-padding" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin</span>
          <ChevronRight size={12} color="var(--text-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Alerts</span>
        </div>
        <div className="admin-dashboard-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} />
              </span>
              Scholar & Admin Alerts
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 0', lineHeight: 1.5 }}>
              Manage compliance statuses, products, and global settings.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text-dark)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px',
                border: 'none', background: 'var(--primary)',
                color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              {importing && !importPreview ? 'Parsing...' : 'Import CSV'}
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportPreview} style={{ display: 'none' }} />
          </div>
        </div>
      </div>



      {/* ── Alerts Section ───────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--non-halal)' }}>
            <AlertCircle size={16} /> {alerts.length} Action{alerts.length !== 1 ? 's' : ''} Required
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', background: 'var(--non-halal-bg)',
                border: '1px solid var(--non-halal-border)', borderRadius: '14px',
                gap: '12px', flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-halal)', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--non-halal)', fontSize: '0.88rem', marginBottom: '2px' }}>
                      Conflict: {alert.company?.symbol || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>{alert.message}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    onClick={() => { setSelectedItem({ type: 'stocks', data: alert.company }); setNewStatus('non-halal'); setReason('Overriding based on Excel screening failure'); }}
                    style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--non-halal)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    Override to Fail
                  </button>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs + Search ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--bg-section)', padding: '4px', borderRadius: '14px', gap: '2px' }}>
          <TabBtn active={activeTab === 'stocks'} onClick={() => setActiveTab('stocks')} icon={TrendingUp} label="Stocks" />
        </div>

        {activeTab !== 'zakat' && (
          <div className="admin-filter-row" style={{ display: 'flex', gap: '12px', flex: '1', minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {activeTab === 'stocks' && (
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Verdicts</option>
                <option value="halal">Halal</option>
                <option value="doubtful">Doubtful</option>
                <option value="non-halal">Non-Halal</option>
              </select>
            )}
            
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${activeTab}…`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  borderRadius: '12px', border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text-dark)',
                  fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ─────────────────────────── */}
      {activeTab === 'zakat' ? (
        <ZakatSettingsAdmin />
      ) : (
        <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {error ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <AlertCircle size={32} color="var(--non-halal)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{error}</p>
              <button onClick={loadData} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Retry</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                    {[activeTab === 'stocks' ? 'Company' : 'Product', activeTab === 'stocks' ? 'Sector' : 'Brand', 'Status', 'Action'].map((h, i) => (
                      <th key={h} style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: i === 3 ? 'right' : 'left', background: 'var(--bg-section)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {[1,2,3,4].map(j => (
                          <td key={j} style={{ padding: '18px 20px' }}>
                            <div style={{ height: '14px', borderRadius: '6px', background: 'var(--bg-section)', animation: 'pulse 1.5s ease-in-out infinite', width: j === 4 ? '60px' : '80%' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '56px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No {activeTab} match your search.</div>
                      </td>
                    </tr>
                  ) : filteredData.map(item => {
                    const status = activeTab === 'stocks' ? item.status?.status : item.status;
                    const isVerified = activeTab === 'stocks' ? item.status?.verified_by_scholar === 1 : item.verified_by_scholar === 1;
                    return (
                      <tr key={activeTab === 'stocks' ? item.symbol : item.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          {activeTab === 'stocks' ? (
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }}
                              onClick={() => navigate(`/admin/tickers/${item.symbol}/view`)}
                              title="View Stock Information"
                            >
                              <CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={36} radius={9} />
                              <div style={{ transition: 'all 0.2s' }}
                                   onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                   onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                              >
                                <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem', lineHeight: 1.2 }}>
                                  {item.symbol}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                  {item.name}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem' }}>{item.name}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {activeTab === 'stocks' ? (item.sector || '—') : (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.82rem' }}>{item.brand || 'Unknown'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{item.barcode}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StatusBadge status={status} />
                            {isVerified && <Shield size={13} color="var(--halal)" title="Scholar Verified" />}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              if (activeTab === 'stocks') {
                                navigate(`/admin/tickers/${item.symbol}`);
                              } else {
                                setSelectedItem({ type: activeTab, data: item });
                                setNewStatus(status || 'halal');
                              }
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '7px 14px', borderRadius: '10px',
                              background: 'var(--primary-50)', color: 'var(--primary)',
                              border: '1px solid var(--primary-100)', cursor: 'pointer',
                              fontWeight: 700, fontSize: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          >
                            <Edit2 size={13} />
                            {activeTab === 'stocks' ? 'Edit' : 'Override'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Override Modal ──────────────────────── */}
      {selectedItem && createPortal(
        <div className="admin-modal-overlay" style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000
        }}>
          <div className="animate-fade-in admin-modal-body" style={{
            background: 'var(--bg)', padding: '0', borderRadius: '24px',
            width: '100%', maxWidth: '480px',
            border: '1px solid var(--border)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
            overflow: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Override Status</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  {selectedItem.type === 'stocks' ? selectedItem.data?.symbol : selectedItem.data?.name}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  New Status
                </label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.88rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select new status…</option>
                  <option value="halal">✅ Halal</option>
                  <option value="doubtful">⚠️ Doubtful</option>
                  <option value="non-halal">❌ Non-Halal</option>
                </select>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  Reason for Override *
                </label>
                <textarea required value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Explain why the algorithmic status is being overridden…"
                  rows={4}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setSelectedItem(null)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={updating || !reason || !newStatus}
                  style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: (updating || !reason || !newStatus) ? 'not-allowed' : 'pointer', opacity: (updating || !reason || !newStatus) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {updating ? 'Saving…' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Import Preview Modal ──────────────────────── */}
      {importPreview && createPortal(
        <div className="admin-modal-overlay" style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000
        }}>
          <div className="animate-fade-in admin-modal-body" style={{
            background: 'var(--bg)', padding: '0', borderRadius: '24px',
            width: '100%', maxWidth: '700px',
            border: '1px solid var(--border)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Review Import Changes</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {importPreview.length} {importPreview.length === 1 ? 'ticker' : 'tickers'} will be updated. Unchanged rows from the CSV will be ignored.
                </div>
              </div>
              <button onClick={() => setImportPreview(null)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {importPreview.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle size={48} color="var(--halal)" style={{ margin: '0 auto 16px' }} />
                  No changes detected. The CSV perfectly matches the current database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {importPreview.map((change, i) => (
                    <div key={i} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-section)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{change.ticker} - {change.name}</div>
                      </div>
                      
                      {change.new_verdict !== change.old_verdict && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', width: '80px' }}>Verdict:</span>
                          <del style={{ color: 'var(--text-light)', opacity: 0.6 }}>{change.old_verdict}</del>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{change.new_verdict}</span>
                        </div>
                      )}
                      
                      {change.new_override !== change.old_override && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', width: '80px' }}>Override:</span>
                          <del style={{ color: 'var(--text-light)', opacity: 0.6 }}>{change.old_override ? 'TRUE' : 'FALSE'}</del>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{change.new_override ? 'TRUE' : 'FALSE'}</span>
                        </div>
                      )}

                      {change.new_reason !== change.old_reason && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)', width: '80px' }}>Reason:</span>
                          <div style={{ flex: 1 }}>
                            <del style={{ display: 'block', color: 'var(--text-light)', opacity: 0.6, marginBottom: '2px' }}>{change.old_reason || '(empty)'}</del>
                            <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 600 }}>{change.new_reason || '(empty)'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-actions" style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', background: 'var(--bg-section)' }}>
              <button type="button" onClick={() => setImportPreview(null)}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmImport} disabled={importing || importPreview.length === 0}
                style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: (importing || importPreview.length === 0) ? 'not-allowed' : 'pointer', opacity: (importing || importPreview.length === 0) ? 0.5 : 1 }}>
                {importing ? 'Applying Changes...' : `Confirm & Update ${importPreview.length} Tickers`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminDashboard;
