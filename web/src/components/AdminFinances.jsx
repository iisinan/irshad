import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Search, RefreshCw, Download, CheckCircle2, Clock, XCircle,
  CreditCard, Users, TrendingUp, Eye, X, Copy, Check, ChevronLeft, ChevronRight,
  BarChart3, ShieldCheck, Filter, Calendar, RotateCcw, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminFinances,
  exportAdminFinancesCsv,
  verifyAdminFinanceTransaction,
} from '../services/api';

const fmtNaira = (amount) => {
  const num = Number(amount || 0);
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const fmtCompactNaira = (amount) => {
  const num = Number(amount || 0);
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₦${Math.round(num / 1_000)}k`;
  return `₦${num}`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_STYLE = {
  success: {
    label: 'Success',
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.3)',
    Icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#D97706',
    border: 'rgba(245, 158, 11, 0.3)',
    Icon: Clock,
  },
  failed: {
    label: 'Failed',
    bg: 'rgba(239, 68, 68, 0.10)',
    color: '#DC2626',
    border: 'rgba(239, 68, 68, 0.3)',
    Icon: XCircle,
  },
};

const PLAN_STYLE = {
  max: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.3)', bar: '#7C3AED' },
  pro: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)', bar: '#059669' },
  free: { bg: 'rgba(107, 114, 128, 0.12)', color: '#4B5563', border: 'rgba(107, 114, 128, 0.25)', bar: '#6B7280' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_STYLE[status] || {
    label: (status || 'Unknown').toUpperCase(),
    bg: 'rgba(107, 114, 128, 0.12)',
    color: 'var(--text-muted)',
    border: 'rgba(107, 114, 128, 0.25)',
    Icon: Clock,
  };
  const Icon = cfg.Icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {item.month}
      </div>
      <div style={{ color: '#059669', fontWeight: 800 }}>
        {fmtNaira(item.revenue_ngn)}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
        {item.transactions} confirmed {item.transactions === 1 ? 'payment' : 'payments'}
      </div>
    </div>
  );
};

const AdminFinances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_revenue_ngn: 0,
    revenue_30d_ngn: 0,
    avg_ticket_ngn: 0,
    success_rate: 0,
    success_count: 0,
    pending_count: 0,
    failed_count: 0,
    total_count: 0,
    paying_users_count: 0,
    active_paid_subs: 0,
    active_admin_overrides: 0,
  });
  const [filteredTotals, setFilteredTotals] = useState({ count: 0, success_revenue_ngn: 0 });
  const [charts, setCharts] = useState({
    monthly_revenue: [],
    by_plan: [],
    by_cycle: [],
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedRef, setCopiedRef] = useState('');

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/portfolio');
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const currentFilters = useCallback(() => ({
    search: searchQuery,
    status: statusFilter,
    type: typeFilter,
    plan: planFilter,
    billingCycle: cycleFilter,
    dateFrom,
    dateTo,
  }), [searchQuery, statusFilter, typeFilter, planFilter, cycleFilter, dateFrom, dateTo]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    planFilter !== 'all' ||
    cycleFilter !== 'all' ||
    dateFrom ||
    dateTo
  );

  const loadFinances = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchAdminFinances({
        page,
        perPage: 20,
        ...currentFilters(),
      });
      setSummary(res.summary || {});
      setFilteredTotals(res.filtered_totals || { count: 0, success_revenue_ngn: 0 });
      setCharts(res.charts || { monthly_revenue: [], by_plan: [], by_cycle: [] });
      const pager = res.transactions || {};
      setTransactions(pager.data || []);
      setTotalPages(pager.last_page || 1);
      setTotalRows(pager.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  }, [page, currentFilters]);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPlanFilter('all');
    setCycleFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedRef(value);
    setTimeout(() => setCopiedRef(''), 1800);
  };

  const handleExportCsv = async () => {
    if (!filteredTotals.count) return;
    try {
      setExporting(true);
      const blob = await exportAdminFinancesCsv(currentFilters());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irshad-finances-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Exported ${filteredTotals.count} payment record(s) to CSV.`);
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleVerifyTransaction = async (tx) => {
    if (!tx || verifyingId === tx.id) return;
    try {
      setVerifyingId(tx.id);
      const res = await verifyAdminFinanceTransaction(tx.id);
      showToast(res.status === 'failed' ? 'error' : 'success', res.message || 'Verification complete.');
      if (selectedTx?.id === tx.id && res.transaction) {
        setSelectedTx(res.transaction);
      }
      await loadFinances();
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Unable to verify payment with Squad.');
    } finally {
      setVerifyingId(null);
    }
  };

  const totalPlanRevenue = (charts.by_plan || []).reduce((acc, p) => acc + Number(p.revenue_ngn || 0), 0);

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: '1340px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10000,
            padding: '12px 18px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.86rem',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.14)',
            color: toast.type === 'error' ? '#DC2626' : '#059669',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '420px',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Admin &rsaquo; Finances
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              letterSpacing: '-0.02em',
            }}
          >
            <Wallet size={24} style={{ color: 'var(--primary)' }} />
            Finances &amp; Payments
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            Monitor subscription collections, revenue trends, plan splits, and reconcile pending Squad checkouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!filteredTotals.count || exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: filteredTotals.count && !exporting ? 'pointer' : 'not-allowed',
              opacity: filteredTotals.count ? 1 : 0.5,
            }}
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : `Export CSV${filteredTotals.count ? ` (${filteredTotals.count})` : ''}`}
          </button>

          <button
            type="button"
            onClick={loadFinances}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Revenue
            </span>
            <Wallet size={17} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtNaira(summary.total_revenue_ngn)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary.active_paid_subs || 0} active paid subs &middot; {summary.active_admin_overrides || 0} overrides
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last 30 Days
            </span>
            <TrendingUp size={17} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtNaira(summary.revenue_30d_ngn)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            From {summary.paying_users_count || 0} paying {summary.paying_users_count === 1 ? 'user' : 'users'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Avg Payment / Success Rate
            </span>
            <BarChart3 size={17} style={{ color: '#7C3AED' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtNaira(summary.avg_ticket_ngn)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary.success_rate || 0}% checkout completion rate
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Breakdown
            </span>
            <CreditCard size={17} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ color: '#059669' }} title="Successful">{summary.success_count || 0}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>/</span>
            <span style={{ color: '#D97706' }} title="Pending">{summary.pending_count || 0}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>/</span>
            <span style={{ color: '#DC2626' }} title="Failed">{summary.failed_count || 0}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Success &middot; Pending &middot; Failed ({summary.total_count || 0} total)
          </div>
        </div>
      </div>

      {/* Analytics Row: 6-Month Chart & Plan / Cycle Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* 6-Month Revenue Area Chart */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            gridColumn: 'span 1',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Monthly Revenue Trend
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Confirmed payments over the last 6 months
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: '190px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly_revenue || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="financesRevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtCompactNaira}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue_ngn"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#financesRevGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan & Billing Cycle Split */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Revenue by Plan &amp; Billing Cycle
            </h2>
            <p style={{ margin: '2px 0 12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Confirmed subscription collections across tiers
            </p>

            {(charts.by_plan || []).length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '14px 0' }}>
                No confirmed transactions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(charts.by_plan || []).map((item) => {
                  const pct = totalPlanRevenue > 0 ? Math.round((item.revenue_ngn / totalPlanRevenue) * 100) : 0;
                  const cfg = PLAN_STYLE[item.slug] || PLAN_STYLE.free;
                  return (
                    <div key={item.slug}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.name} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({item.count} tx)</span>
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {fmtNaira(item.revenue_ngn)} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', borderRadius: '999px', background: 'var(--bg-section)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: cfg.bar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Billing Cycle Chips */}
          {(charts.by_cycle || []).length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(charts.by_cycle || []).map((c) => (
                <div
                  key={c.cycle}
                  style={{
                    flex: '1 1 130px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-section)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {c.cycle}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {fmtNaira(c.revenue_ngn)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {c.count} {c.count === 1 ? 'payment' : 'payments'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Filter Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-section)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search user, email, or reference..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <select
                value={planFilter}
                onChange={(e) => { setPage(1); setPlanFilter(e.target.value); }}
                aria-label="Filter by plan"
                style={{
                  padding: '8px 11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">All Plans</option>
                <option value="pro">Rawdha</option>
                <option value="max">Noor</option>
              </select>

              <select
                value={cycleFilter}
                onChange={(e) => { setPage(1); setCycleFilter(e.target.value); }}
                aria-label="Filter by billing cycle"
                style={{
                  padding: '8px 11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">All Cycles</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
                aria-label="Filter by status"
                style={{
                  padding: '8px 11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
                aria-label="Filter by payment type"
                style={{
                  padding: '8px 11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">All Types</option>
                <option value="initial">Initial</option>
                <option value="renewal">Renewal</option>
              </select>
            </div>
          </div>

          {/* Date Range + Filtered Totals Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Calendar size={14} /> Date range:
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
                aria-label="Start date"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
                aria-label="End date"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <Filter size={13} />
              <span>
                {filteredTotals.count} {filteredTotals.count === 1 ? 'record' : 'records'}
                {hasActiveFilters ? ` · Confirmed: ${fmtNaira(filteredTotals.success_revenue_ngn)}` : ''}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              margin: '16px 20px 0',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
                {['User', 'Plan', 'Amount', 'Type', 'Reference', 'Status', 'Date', 'Actions'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                      textAlign: col === 'Actions' ? 'right' : 'left',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading payment records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
                      No payment transactions match your filters.
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const planSlug = tx.plan?.slug || 'free';
                  const planCfg = PLAN_STYLE[planSlug] || PLAN_STYLE.free;
                  const initials = (tx.user?.name || tx.user?.email || '?')
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() || '')
                    .join('');

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '999px',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {initials || <Users size={14} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {tx.user?.name || 'Deleted User'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {tx.user?.email || `User #${tx.user_id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: planCfg.bg,
                            color: planCfg.color,
                            border: `1px solid ${planCfg.border}`,
                          }}
                        >
                          {tx.plan?.name || 'Plan'}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', textTransform: 'capitalize' }}>
                          {tx.billing_cycle || '—'} &middot; {tx.gateway || 'squad'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {fmtNaira(tx.amount_ngn ?? (tx.amount_kobo || 0) / 100)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {tx.currency || 'NGN'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {tx.type || 'initial'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--text-primary)',
                              background: 'var(--bg-section)',
                              padding: '3px 7px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {tx.transaction_ref}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.transaction_ref)}
                            title="Copy transaction reference"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'inline-flex',
                            }}
                          >
                            {copiedRef === tx.transaction_ref ? <Check size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
                          </button>
                        </div>
                        {tx.gateway_ref && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            GW: {tx.gateway_ref}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <StatusBadge status={tx.status} />
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>{fmtDate(tx.paid_at || tx.created_at)}</div>
                        {tx.paid_at && tx.created_at && tx.paid_at !== tx.created_at && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Created {fmtDate(tx.created_at)}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {tx.status === 'pending' && tx.gateway === 'squad' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyTransaction(tx)}
                              disabled={verifyingId === tx.id}
                              title="Verify status with Squad and activate if paid"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: verifyingId === tx.id ? 'wait' : 'pointer',
                              }}
                            >
                              <ShieldCheck size={13} />
                              {verifyingId === tx.id ? 'Verifying...' : 'Verify'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-section)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Page {page} of {totalPages} &middot; {totalRows} shown
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.45 : 1,
              }}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.45 : 1,
              }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx &&
        createPortal(
          <div
            onClick={() => setSelectedTx(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '22px 24px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Payment #{selectedTx.id}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedTx.transaction_ref}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--bg-section)',
                  border: '1px solid var(--border)',
                  marginBottom: '16px',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>USER</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedTx.user?.name || '—'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{selectedTx.user?.email || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>AMOUNT</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem' }}>
                    {fmtNaira(selectedTx.amount_ngn ?? (selectedTx.amount_kobo || 0) / 100)}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {selectedTx.amount_kobo} kobo ({selectedTx.currency || 'NGN'})
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>PLAN &amp; CYCLE</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'capitalize' }}>
                    {selectedTx.plan?.name || '—'} ({selectedTx.billing_cycle || '—'})
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>STATUS</div>
                  <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={selectedTx.status} />
                    {selectedTx.status === 'pending' && selectedTx.gateway === 'squad' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyTransaction(selectedTx)}
                        disabled={verifyingId === selectedTx.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 9px',
                          borderRadius: '8px',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: verifyingId === selectedTx.id ? 'wait' : 'pointer',
                        }}
                      >
                        <ShieldCheck size={12} />
                        {verifyingId === selectedTx.id ? 'Verifying...' : 'Verify with Squad'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>GATEWAY &amp; TYPE</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedTx.gateway || 'squad'} &middot; {selectedTx.type || 'initial'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>PAID AT</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {fmtDate(selectedTx.paid_at)}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  GATEWAY PAYLOAD
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--bg-section)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '220px',
                  }}
                >
                  {selectedTx.raw_payload ? JSON.stringify(selectedTx.raw_payload, null, 2) : 'No raw gateway payload recorded.'}
                </pre>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminFinances;
