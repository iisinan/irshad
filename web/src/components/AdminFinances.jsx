import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Search, RefreshCw, Download, CheckCircle2, Clock, XCircle,
  CreditCard, Users, TrendingUp, Eye, X, Copy, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAdminFinances } from '../services/api';

const fmtNaira = (amount) => {
  const num = Number(amount || 0);
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
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
  max: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.3)' },
  pro: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
  free: { bg: 'rgba(107, 114, 128, 0.12)', color: '#4B5563', border: 'rgba(107, 114, 128, 0.25)' },
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

const AdminFinances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_revenue_ngn: 0,
    revenue_30d_ngn: 0,
    success_count: 0,
    pending_count: 0,
    failed_count: 0,
    total_count: 0,
    paying_users_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedRef, setCopiedRef] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/portfolio');
    }
  }, [user, navigate]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadFinances = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchAdminFinances({
        page,
        perPage: 20,
        search: searchQuery,
        status: statusFilter,
        type: typeFilter,
      });
      setSummary(res.summary || {});
      const pager = res.transactions || {};
      setTransactions(pager.data || []);
      setTotalPages(pager.last_page || 1);
      setTotalRows(pager.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedRef(value);
    setTimeout(() => setCopiedRef(''), 1800);
  };

  const handleExportCsv = () => {
    if (!transactions.length) return;
    const headers = [
      'ID',
      'User Name',
      'User Email',
      'Plan',
      'Billing Cycle',
      'Amount (NGN)',
      'Currency',
      'Status',
      'Type',
      'Gateway',
      'Transaction Ref',
      'Gateway Ref',
      'Paid At',
      'Created At',
    ];
    const escapeCsv = (val) => {
      const s = val == null ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = transactions.map((tx) => [
      tx.id,
      tx.user?.name || '',
      tx.user?.email || '',
      tx.plan?.name || '',
      tx.billing_cycle || '',
      tx.amount_ngn ?? (tx.amount_kobo || 0) / 100,
      tx.currency || 'NGN',
      tx.status || '',
      tx.type || '',
      tx.gateway || '',
      tx.transaction_ref || '',
      tx.gateway_ref || '',
      tx.paid_at || '',
      tx.created_at || '',
    ].map(escapeCsv).join(','));

    const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irshad-finances-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: '1320px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '24px',
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
            Track all subscription checkouts, recurring renewals, and payment statuses across Irshad.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!transactions.length}
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
              cursor: transactions.length ? 'pointer' : 'not-allowed',
              opacity: transactions.length ? 1 : 0.5,
            }}
          >
            <Download size={15} />
            Export CSV
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Revenue
            </span>
            <Wallet size={17} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtNaira(summary.total_revenue_ngn)}
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last 30 Days
            </span>
            <TrendingUp size={17} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtNaira(summary.revenue_30d_ngn)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Confirmed collections
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Successful Payments
            </span>
            <CheckCircle2 size={17} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
            {summary.success_count || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Out of {summary.total_count || 0} total attempts
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending / Failed
            </span>
            <CreditCard size={17} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#D97706' }}>{summary.pending_count || 0}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 6px' }}>/</span>
            <span style={{ color: '#DC2626' }}>{summary.failed_count || 0}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting verification or declined
          </div>
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
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
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
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              aria-label="Filter by status"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
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
              onChange={(e) => {
                setPage(1);
                setTypeFilter(e.target.value);
              }}
              aria-label="Filter by payment type"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Types</option>
              <option value="initial">Initial</option>
              <option value="renewal">Renewal</option>
            </select>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {totalRows} {totalRows === 1 ? 'record' : 'records'}
            </span>
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
                {['User', 'Plan', 'Amount', 'Type', 'Reference', 'Status', 'Date', ''].map((col) => (
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
            Page {page} of {totalPages}
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
                  <div style={{ marginTop: '3px' }}>
                    <StatusBadge status={selectedTx.status} />
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
