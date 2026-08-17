import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, Briefcase, Droplets, TrendingUp, Search, Bell, History, PieChart as PieChartIcon, Smartphone, Monitor, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { fetchAdminUserAnalytics } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const AdminUserAnalyticsModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchAdminUserAnalytics(userId);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const ModalWrap = ({ children }) => createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
      <div className="animate-fade-in" style={{ background: 'var(--bg)', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>,
    document.body
  );

  const ModalHeader = ({ title, subtitle }) => (
    <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div>
        {subtitle && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{subtitle}</div>}
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{title}</h3>
      </div>
      <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
        <X size={16} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <ModalWrap>
        <ModalHeader title="Loading Analytics..." subtitle="User Activity" />
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', borderWidth: '3px', borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      </ModalWrap>
    );
  }

  if (error || !data) {
    return (
      <ModalWrap>
        <ModalHeader title="Error" subtitle="User Activity" />
        <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--non-compliant)' }}>
          {error || 'Failed to load analytics data'}
        </div>
      </ModalWrap>
    );
  }

  const { user, holdings, purifications, screened_count, recent_history, price_alerts } = data;
  const totalInvested = holdings.reduce((sum, h) => sum + (parseFloat(h.shares) * parseFloat(h.average_buy_price)), 0);
  
  // Zakat Estimate (2.5% of holdings value)
  const zakatEstimate = totalInvested * 0.025;

  // Pie chart data
  const sectorDataMap = {};
  holdings.forEach(h => {
      const sector = h.company?.sector || 'Unknown';
      const val = parseFloat(h.shares) * parseFloat(h.average_buy_price);
      sectorDataMap[sector] = (sectorDataMap[sector] || 0) + val;
  });
  const pieData = Object.entries(sectorDataMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  // Filter History
  const now = new Date();
  const filteredHistory = recent_history?.filter(h => {
    if (timeframe === 'all') return true;
    const hDate = new Date(h.created_at);
    if (timeframe === 'today') {
      return hDate.toDateString() === now.toDateString();
    }
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return hDate >= weekAgo;
    }
    if (timeframe === 'month') {
      return hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'year') {
      return hDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Platform Split Data
  let mobileCount = 0;
  let webCount = 0;
  filteredHistory?.forEach(h => {
    if (h.platform === 'mobile') mobileCount++;
    else webCount++;
  });
  const platformData = [
    { name: 'Mobile App', value: mobileCount },
    { name: 'Web App', value: webCount }
  ].filter(d => d.value > 0);

  // Top Searched Stocks Data
  const topSearchedMap = {};
  filteredHistory?.forEach(h => {
    if (h.reference_id) {
        topSearchedMap[h.reference_id] = (topSearchedMap[h.reference_id] || 0) + 1;
    }
  });
  const topSearchedData = Object.entries(topSearchedMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Purification Data
  const sortedPurifications = [...(purifications || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const purificationsOverTimeMap = {};
  sortedPurifications.forEach(p => {
     const date = new Date(p.created_at);
     const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
     purificationsOverTimeMap[monthYear] = (purificationsOverTimeMap[monthYear] || 0) + parseFloat(p.amount);
  });
  const purificationChartData = Object.entries(purificationsOverTimeMap).map(([name, amount]) => ({ name, amount }));

  return (
    <ModalWrap>
      <style>{`
        .premium-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, var(--bg-section) 0%, rgba(255,255,255,0.02) 100%);
        }
        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .premium-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--primary), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .premium-card:hover::before {
          opacity: 1;
        }
        .premium-row {
          transition: all 0.2s ease;
        }
        .premium-row:hover {
          background: rgba(16, 185, 129, 0.04);
          transform: scale(1.002);
        }
        .icon-glow {
          box-shadow: 0 0 15px currentColor;
          opacity: 0.8;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>

      <ModalHeader title={user.name} subtitle={`${user.email} • ${user.plan} plan`} />
      
      <div className="custom-scroll" style={{ padding: '28px', overflowY: 'auto', flex: 1, background: 'var(--bg)' }}>
        
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="premium-card" style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-glow" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Search size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{screened_count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Stocks Screened</div>
            </div>
          </div>

          <div className="premium-card" style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-glow" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--halal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{holdings.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Active Holdings</div>
            </div>
          </div>

          <div className="premium-card" style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-glow" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>
                ₦{zakatEstimate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Zakat Est. (Portfolio)</div>
            </div>
          </div>

          <div className="premium-card" style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-glow" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{price_alerts?.filter(a => a.status === 'active').length || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Active Price Alerts</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {/* Chart Section */}
            <div className="premium-card" style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="var(--primary)" /> Portfolio Distribution
              </h4>
              {pieData.length > 0 ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₦${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`} contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', color: 'var(--text-dark)', fontWeight: 600}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No portfolio data to display.
                </div>
              )}
            </div>

            {/* Platform Usage Donut */}
            <div className="premium-card" style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="var(--primary)" /> Platform Usage
              </h4>
              {platformData.length > 0 ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={85} paddingAngle={5}>
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#8B5CF6'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} searches`} contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', color: 'var(--text-dark)', fontWeight: 600}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No platform data to display.
                </div>
              )}
            </div>
            {/* Recent Activity Section */}
            <div className="premium-card" style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--primary)" /> Recent Search Activity
                </h4>
                <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)', gap: '4px' }}>
                  {['all', 'today', 'week', 'month', 'year'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTimeframe(t)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: timeframe === t ? 'var(--primary)' : 'transparent',
                        color: timeframe === t ? 'white' : 'var(--text-muted)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t === 'all' ? 'All' : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
                  {!filteredHistory || filteredHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '40px' }}>No recent searches found for this timeframe.</div>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {filteredHistory.map((h, i) => (
                              <div className="premium-row" key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', borderBottom: i === filteredHistory.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                                          {h.reference_id?.substring(0, 3)}
                                      </div>
                                      <div>
                                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Checked {h.reference_id}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            {h.platform === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                                            {h.platform === 'mobile' ? 'Mobile App' : 'Web App'}
                                          </div>
                                      </div>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                      {new Date(h.created_at).toLocaleDateString()}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            </div>
        </div>

        {/* Full Width Middle Row: Top Searched Stocks */}
        <div style={{ marginBottom: '32px' }}>
            {/* Top Searched Stocks Bar Chart */}
            <div className="premium-card" style={{ flex: '1 1 100%', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="var(--primary)" /> Top Searched Stocks
              </h4>
              {topSearchedData.length > 0 ? (
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSearchedData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                      <Tooltip cursor={{fill: 'var(--bg)'}} contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', color: 'var(--text-dark)', fontWeight: 600}} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No search data to display.
                </div>
              )}
            </div>
        </div>



        {/* Purification Section */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <div className="premium-card" style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LineChartIcon size={18} color="var(--primary)" /> Purification History
              </h4>
              {purificationChartData.length > 0 ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={purificationChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPurification" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', color: 'var(--text-dark)', fontWeight: 600}} formatter={(value) => `₦${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#colorPurification)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No purification data to display.
                </div>
              )}
            </div>

            <div className="premium-card" style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={18} color="var(--primary)" /> Purification Log
              </h4>
              <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
                  {!purifications || purifications.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '40px' }}>No purifications logged.</div>
                  ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Date</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Source</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purifications.map((p, i) => (
                              <tr className="premium-row" key={i} style={{ borderBottom: i === purifications.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <td style={{ padding: '12px', color: 'var(--text-dark)', fontSize: '0.85rem', fontWeight: 600 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.source || 'General'}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-dark)', fontSize: '0.85rem', fontWeight: 700 }}>₦{parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                  )}
              </div>
            </div>
        </div>

        {/* Holdings Table */}
        <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={18} color="var(--primary)" /> Portfolio Holdings
        </h4>
        <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
          {holdings.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No holdings found for this user.</div>
          ) : (
            <div className="custom-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Symbol</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shares</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Price</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const shares = parseFloat(h.shares);
                    const avgPrice = parseFloat(h.average_buy_price);
                    const val = shares * avgPrice;
                    return (
                      <tr className="premium-row" key={i} style={{ borderBottom: i === holdings.length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{h.symbol}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{shares.toLocaleString()}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>₦{avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>₦{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Price Alerts Table */}
        <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--primary)" /> Active Price Alerts
        </h4>
        <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          {!price_alerts || price_alerts.filter(a => a.status === 'active').length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active price alerts.</div>
          ) : (
            <div className="custom-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Symbol</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Condition</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Price</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {price_alerts.filter(a => a.status === 'active').map((a, i) => {
                    const price = parseFloat(a.target_price);
                    return (
                      <tr className="premium-row" key={i} style={{ borderBottom: i === price_alerts.filter(a => a.status === 'active').length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{a.symbol}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.condition === 'above' ? 'Rises Above' : 'Drops Below'}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>₦{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </ModalWrap>
  );
};

export default AdminUserAnalyticsModal;
