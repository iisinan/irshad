import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, AlertTriangle, CheckCircle, Edit2, X, Package, TrendingUp, AlertCircle } from 'lucide-react';
import api, { fetchNgxStocks, fetchProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toastError, toastSuccess } from '../utils/toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' | 'products'
  
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'stocks' | 'products', data: {} }
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stocksRes, productsRes, alertsRes] = await Promise.all([
        api.get('/stocks'),
        api.get('/products'),
        api.get('/admin/alerts')
      ]);
      setStocks(stocksRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
      setAlerts(alertsRes.data?.data || alertsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem || !newStatus || !reason) return;
    
    setUpdating(true);
    try {
      if (selectedItem.type === 'stocks') {
        const response = await api.put(`/stocks/${selectedItem.data.symbol}/status`, {
          status: newStatus,
          reason: reason
        });
        const result = response.data;
        setStocks(stocks.map(s => s.symbol === selectedItem.data.symbol ? result.data : s));
      } else {
        const response = await api.put(`/products/${selectedItem.data.id}/status`, {
          status: newStatus,
          status_reason: reason
        });
        const result = response.data;
        setProducts(products.map(p => p.id === selectedItem.data.id ? result.data : p));
      }
      
      setSelectedItem(null);
      setNewStatus('');
      setReason('');
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
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toastError('Failed to resolve alert');
    }
  };

  const getFilteredData = () => {
    if (activeTab === 'stocks') {
      return stocks.filter(s => 
        s.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return products.filter(p => 
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'scholar') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Shield size={48} color="red" style={{ margin: '0 auto 20px' }} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield color="var(--primary-green)" />
            Scholar & Admin Panel
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Override and manage compliance statuses manually.</p>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-section)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('stocks')}
              style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px',
                  backgroundColor: activeTab === 'stocks' ? 'var(--bg)' : 'transparent',
                  color: activeTab === 'stocks' ? 'var(--text-dark)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', fontWeight: '700',
                  boxShadow: activeTab === 'stocks' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
                <TrendingUp size={16} /> Stocks
            </button>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px',
                  backgroundColor: activeTab === 'products' ? 'var(--bg)' : 'transparent',
                  color: activeTab === 'products' ? 'var(--text-dark)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', fontWeight: '700',
                  boxShadow: activeTab === 'products' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
                <Package size={16} /> Products
            </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#B91C1C' }}>
            <AlertCircle size={20} /> Action Required
          </h2>
          {alerts.map(alert => (
            <div key={alert.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '16px 24px', backgroundColor: '#FEF2F2', 
              border: '1px solid #FECACA', borderRadius: '12px' 
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#991B1B', marginBottom: '4px' }}>
                  Conflict Detected for {alert.company?.symbol || 'Unknown'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{alert.message}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setSelectedItem({ type: 'stocks', data: alert.company });
                    setNewStatus('non-halal');
                    setReason('Overriding based on Excel screening failure');
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#B91C1C', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  Resolve (Override to Fail)
                </button>
                <button 
                  onClick={() => resolveAlert(alert.id)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--bg)', color: 'var(--text-dark)', border: '1px solid var(--border)', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab} by name or ID...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-section)',
              color: 'var(--text-dark)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {activeTab === 'stocks' ? 'Company' : 'Product'}
              </th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {activeTab === 'stocks' ? 'Sector' : 'Brand / Barcode'}
              </th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredData.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No {activeTab} found.</td></tr>
            ) : filteredData.map(item => {
              
              const status = activeTab === 'stocks' ? item.status?.status : item.status;
              const isVerified = activeTab === 'stocks' ? item.status?.verified_by_scholar === 1 : item.verified_by_scholar === 1;
              const statusColor = status === 'halal' ? 'var(--primary-green)' : 
                                 status === 'non-halal' ? 'var(--non-halal)' : '#F59E0B';
              
              return (
                <tr key={activeTab === 'stocks' ? item.symbol : item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>
                        {activeTab === 'stocks' ? item.symbol : item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {activeTab === 'stocks' ? item.name : ''}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {activeTab === 'stocks' ? item.sector : (
                        <div>
                            <div>{item.brand || 'Unknown Brand'}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{item.barcode}</div>
                        </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
                      <span style={{ fontWeight: '600', textTransform: 'capitalize', color: statusColor }}>
                        {status || 'Unknown'}
                      </span>
                      {isVerified && (
                        <Shield size={14} color="var(--primary-green)" title="Scholar Verified" />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button 
                      onClick={() => {
                        setSelectedItem({ type: activeTab, data: item });
                        setNewStatus(status || 'halal');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-section)', color: 'var(--text-dark)',
                        border: '1px solid var(--border)', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-section)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <Edit2 size={14} /> Override
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>
                  Override {selectedItem.type === 'stocks' ? selectedItem.data.symbol : selectedItem.data.name}
              </h2>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  NEW STATUS
                </label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '13px', outline: 'none' }}
                >
                  <option value="halal">Halal</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="non-halal">Non-Halal</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  REASON FOR OVERRIDE (REQUIRED)
                </label>
                <textarea 
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the algorithmic status is being overridden..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '13px', minHeight: '100px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedItem(null)}
                  style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--bg-section)', color: 'var(--text-muted)', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating || !reason}
                  style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', opacity: (updating || !reason) ? 0.5 : 1 }}
                >
                  {updating ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
