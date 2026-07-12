import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, AlertTriangle, CheckCircle, Edit2, X } from 'lucide-react';
import api, { fetchNgxStocks } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedStock, setSelectedStock] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const res = await fetchNgxStocks();
      if (res && res.data) {
        setStocks(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedStock || !newStatus || !reason) return;
    
    setUpdating(true);
    try {
      const response = await api.put(`/stocks/${selectedStock.symbol}/status`, {
        status: newStatus,
        reason: reason
      });

      const result = response.data;
      
      // Update local state
      setStocks(stocks.map(s => s.symbol === selectedStock.symbol ? result.data : s));
      
      // Close modal
      setSelectedStock(null);
      setNewStatus('');
      setReason('');
      
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'admin' && user?.role !== 'scholar') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Shield size={48} color="red" style={{ margin: '0 auto 20px' }} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield color="var(--primary-green)" />
            Scholar & Admin Panel
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Override and manage compliance statuses manually.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sector</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredStocks.map(stock => {
              const statusColor = stock.status?.status === 'halal' ? 'var(--primary-green)' : 
                                 stock.status?.status === 'non-halal' ? 'var(--non-halal)' : '#F59E0B';
              
              return (
                <tr key={stock.symbol} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stock.name}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    {stock.sector}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
                      <span style={{ fontWeight: '600', textTransform: 'capitalize', color: statusColor }}>
                        {stock.status?.status || 'Unknown'}
                      </span>
                      {stock.status?.verified_by_scholar === 1 && (
                        <Shield size={14} color="var(--primary-green)" title="Scholar Verified" />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button 
                      onClick={() => {
                        setSelectedStock(stock);
                        setNewStatus(stock.status?.status || 'halal');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 12px', borderRadius: '6px',
                        backgroundColor: '#F3F4F6', color: 'var(--text-dark)',
                        border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
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
      {selectedStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Override {selectedStock.symbol}</h2>
              <button onClick={() => setSelectedStock(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  NEW STATUS
                </label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '15px' }}
                >
                  <option value="halal">Halal</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="non-halal">Non-Halal</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  REASON FOR OVERRIDE (REQUIRED)
                </label>
                <textarea 
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the algorithmic status is being overridden..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '15px', minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedStock(null)}
                  style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: 'var(--text-dark)', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating || !reason}
                  style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', opacity: (updating || !reason) ? 0.5 : 1 }}
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
