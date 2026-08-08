import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { fetchStockDetails } from '../services/api';
import { Check, X, Inbox, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function AdminFinancialReviewQueue() {
  useAuth();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  
  // Edit state
  const [editData, setEditData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stock details (for chart)
  const [stockDetails, setStockDetails] = useState({});
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/financial-review');
      setQueue(res.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load financial review queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(item.id);
    setEditData(item.extracted_data || {});
    
    if (!stockDetails[item.company.symbol]) {
      setChartLoading(true);
      try {
        const res = await fetchStockDetails(item.company.symbol);
        const data = res?.data || res;
        setStockDetails(prev => ({ ...prev, [item.company.symbol]: data }));
      } catch (err) {
        console.error('Failed to load stock details', err);
      } finally {
        setChartLoading(false);
      }
    }
  };

  const handleEditChange = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleApprove = async (id) => {
    setIsSubmitting(true);
    try {
      await api.post(`/admin/financial-review/${id}/approve`, {
        extracted_data: editData
      });
      // Remove from queue
      setQueue(prev => prev.filter(q => q.id !== id));
      setExpandedId(null);
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this extracted data?")) return;
    setIsSubmitting(true);
    try {
      await api.post(`/admin/financial-review/${id}/reject`);
      // Remove from queue
      setQueue(prev => prev.filter(q => q.id !== id));
      setExpandedId(null);
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChart = (symbol) => {
    const stock = stockDetails[symbol];
    if (chartLoading && !stock) {
      return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading chart...</div>;
    }
    if (!stock || !stock.chart_data || stock.chart_data.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No chart data available.</div>;
    }

    const dailyPrices = stock.chart_data;
    const chartData = [...dailyPrices].reverse().map(p => ({
      date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      price: parseFloat(p.price)
    }));

    return (
      <div style={{ height: '240px', width: '100%', marginTop: '16px', background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-dark)' }}>Price History (30 Days)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
            <Line type="monotone" dataKey="price" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gold-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(209, 165, 98, 0.3)' }}>
          <Inbox size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>Financial Extraction Queue</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>Review AI-extracted financial data before it impacts AAOIFI compliance status.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div style={{ padding: '24px', background: 'var(--non-halal-bg)', color: '#DC2626', borderRadius: '12px', border: '1px solid var(--non-halal-border)' }}>
          {error}
        </div>
      ) : queue.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Check size={48} color="#059669" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', margin: '0 0 8px 0' }}>All Caught Up</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>There are no pending financial extractions to review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queue.map(item => (
            <div key={item.id} style={{ background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Header row */}
              <div 
                onClick={() => handleExpand(item)}
                style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedId === item.id ? 'var(--bg-hover)' : 'transparent', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {item.company?.symbol?.substring(0, 2)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.company?.symbol} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.9rem' }}>— {item.company?.name}</span></h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <BarChart2 size={12} /> Pending Review
                    </span>
                  </div>
                </div>
                <div>
                  {expandedId === item.id ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === item.id && (
                <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '32px' }}>
                  
                  {/* Left column: Edit Form */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extracted Financial Data</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {Object.entries(editData).map(([key, val]) => {
                        // Skip rendering non-primitive types if they sneak in
                        if (typeof val === 'object' && val !== null) return null;
                        
                        return (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}
                            </label>
                            <input 
                              type={typeof val === 'number' ? 'number' : 'text'}
                              value={val === null ? '' : val}
                              onChange={(e) => handleEditChange(key, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
                              style={{ 
                                padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                                background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.9rem'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                      <button 
                        onClick={() => handleApprove(item.id)}
                        disabled={isSubmitting}
                        style={{
                          background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: '8px',
                          fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center'
                        }}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(item.id)}
                        disabled={isSubmitting}
                        style={{
                          background: 'transparent', color: '#DC2626', padding: '10px 24px', borderRadius: '8px',
                          fontWeight: 600, fontSize: '0.9rem', border: '1px solid #DC2626', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center'
                        }}
                      >
                        <X size={16} /> Delete & Reject
                      </button>
                    </div>
                  </div>

                  {/* Right column: Chart & Context */}
                  <div style={{ flex: '1', borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historical Context</h5>
                    {renderChart(item.company.symbol)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
