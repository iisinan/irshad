import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertCircle, TrendingUp, Shield, HelpCircle, CheckCircle,
  ShieldAlert, ArrowRight, Check, X, Clock, ExternalLink, ChevronRight, History,
  ChevronDown, ChevronUp, FileText, CheckCheck, Eye
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import CompanyLogo from './CompanyLogo';
import { customConfirm } from '../utils/confirm';

const STATUS_CONFIG = {
  halal:          { label: 'SHARIAH COMPLIANT',     bg: 'rgba(16,185,129,.12)', color: '#059669', border: 'rgba(16,185,129,.3)' },
  'non-compliant':{ label: 'SHARIAH NON-COMPLIANT', bg: 'rgba(239,68,68,.10)',  color: '#DC2626', border: 'rgba(239,68,68,.3)'  },
  doubtful:       { label: 'DOUBTFUL',              bg: 'rgba(245,158,11,.12)', color: '#D97706', border: 'rgba(245,158,11,.3)' },
};

const StatusPill = ({ status, size = 'sm' }) => {
  const c = STATUS_CONFIG[status] ?? { label: (status || 'UNKNOWN').toUpperCase(), bg: 'rgba(100,100,100,.1)', color: 'var(--text-muted)', border: 'rgba(100,100,100,.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'lg' ? '5px 12px' : '3px 9px',
      borderRadius: 100, fontSize: size === 'lg' ? '0.73rem' : '0.65rem',
      fontWeight: 800, letterSpacing: '.5px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
};

const fmtNaira = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₦0';
  const num = Number(val);
  if (Math.abs(num) >= 1e12) return `₦${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9)  return `₦${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6)  return `₦${(num / 1e6).toFixed(2)}M`;
  return `₦${num.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

export default function AdminOverview() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const handleQuickApprove = async (id, e) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/approve`);
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast('Approved! Live status has been updated.', 'success');
    } catch (err) {
      showToast('Failed to approve review: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickReject = async (id, e) => {
    e.stopPropagation();
    if (!await customConfirm('Are you sure you want to reject this compliance change? The stock will retain its previous status.')) {
      return;
    }
    setProcessingId(id);
    try {
      await api.post(`/admin/compliance-reviews/${id}/reject`);
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast('Review rejected. Previous status retained.', 'success');
    } catch (err) {
      showToast('Failed to reject review: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!stats?.pending_reviews) return;
    if (!await customConfirm(`Are you sure you want to approve all ${stats.pending_reviews} pending compliance changes? Their statuses will be applied live.`)) {
      return;
    }
    setBulkProcessing(true);
    try {
      const ids = (stats.pending_list || []).map(r => r.id);
      await api.post('/admin/compliance-reviews/bulk-approve', { ids });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast(`Approved all ${ids.length} compliance reviews!`, 'success');
    } catch (err) {
      showToast('Bulk approval failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page-padding" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-padding" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--non-compliant)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
          <h3>Failed to load stats</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Stocks', value: stats.total_stocks, icon: TrendingUp, color: 'var(--primary)', bg: 'var(--primary-50)' },
    { label: 'Halal Stocks', value: stats.halal_stocks, icon: CheckCircle, color: 'var(--halal)', bg: 'var(--halal-bg)' },
    { label: 'Doubtful Stocks', value: stats.doubtful_stocks, icon: HelpCircle, color: 'var(--doubtful)', bg: 'var(--doubtful-bg)' },
    { label: 'Non-Compliant Stocks', value: stats.non_halal_stocks, icon: AlertCircle, color: 'var(--non-compliant)', bg: 'var(--non-compliant-bg)' },
  ];

  const pendingList = stats.pending_list || [];
  const recentHistory = stats.recent_history || [];

  return (
    <div className="admin-page-padding" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem',
          background: toast.type === 'error' ? 'var(--non-compliant-bg)' : 'var(--halal-bg)',
          color: toast.type === 'error' ? '#DC2626' : '#059669',
          border: `1px solid ${toast.type === 'error' ? 'var(--non-compliant-border)' : 'rgba(16,185,129,0.3)'}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </span>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 0', lineHeight: 1.5 }}>
            High-level metrics and system health indicators.
          </p>
        </div>

        {/* Global Pending Reviews Pill Link */}
        {stats.pending_reviews > 0 && (
          <Link
            to="/admin/compliance-reviews"
            style={{
              textDecoration: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#DC2626',
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            {stats.pending_reviews} Compliance Review{stats.pending_reviews > 1 ? 's' : ''} Pending
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* ── PRIORITY NOTIFICATION: Compliance Changes Needing Admin Review ── */}
      {stats.pending_reviews > 0 ? (
        <div style={{
          marginBottom: '32px',
          background: 'var(--bg-section, #ffffff)',
          border: '1.5px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)',
        }}>
          {/* Alert Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.15rem', fontWeight: 800 }}>
                    Compliance Review Required
                  </h3>
                  <span style={{
                    background: '#DC2626', color: 'white', fontSize: '0.72rem', fontWeight: 800,
                    padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.4px'
                  }}>
                    {stats.pending_reviews} PENDING
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  A financial statement filing or ratio recalculation caused a compliance status change that requires admin approval before reflecting live.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {stats.pending_reviews > 1 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkProcessing}
                  style={{
                    padding: '8px 16px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: bulkProcessing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCheck size={14} />
                  Approve All ({stats.pending_reviews})
                </button>
              )}

              <Link
                to="/admin/compliance-reviews"
                style={{
                  textDecoration: 'none',
                  padding: '8px 16px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                Open Manager <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Pending Tickers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
            {pendingList.map((review) => {
              const company = review.company || {};
              const screening = company.aaoifiScreening || {};
              const finData = typeof screening.financial_data_used === 'string'
                ? JSON.parse(screening.financial_data_used)
                : (screening.financial_data_used || {});

              const isProcessing = processingId === review.id;
              const isExpanded = expandedId === review.id;

              const debtRatio = screening.debt_ratio ? Number(screening.debt_ratio) : null;
              const cashRatio = screening.cash_ratio ? Number(screening.cash_ratio) : null;
              const impureRatio = screening.impermissible_income_ratio ? Number(screening.impermissible_income_ratio) : null;

              return (
                <div
                  key={review.id}
                  style={{
                    background: 'var(--bg, #fafafa)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Row: Info & Main Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}>
                    {/* Left: Logo & Transition */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px', flex: '1 1 320px' }}>
                      <CompanyLogo
                        symbol={company.symbol}
                        logoUrl={company.logo_url}
                        size={44}
                        radius={10}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)' }}>
                            {company.symbol || 'N/A'}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                            {company.name}
                          </span>
                        </div>

                        {/* Status Transition Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <StatusPill status={review.old_status} size="sm" />
                          <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                          <StatusPill status={review.new_status} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Center: Reason snippet */}
                    <div style={{ flex: '2 1 340px', minWidth: '260px' }}>
                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-dark)',
                        background: 'var(--bg-section)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        lineHeight: 1.4,
                      }}>
                        <strong>Reason: </strong>
                        {review.reason ? review.reason.replace(/^SCHOLAR REVIEW REQUIRED:\s*/i, '') : 'Financial ratio criteria changed.'}
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => handleQuickApprove(review.id, e)}
                        disabled={isProcessing}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: '#059669', color: 'white',
                          border: 'none', borderRadius: '8px',
                          padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1,
                          transition: 'all 0.15s ease',
                        }}
                        title="Approve and apply status change live"
                      >
                        <Check size={14} />
                        Approve
                      </button>

                      <button
                        onClick={(e) => handleQuickReject(review.id, e)}
                        disabled={isProcessing}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: 'transparent', color: '#DC2626',
                          border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px',
                          padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1,
                          transition: 'all 0.15s ease',
                        }}
                        title="Reject status change and retain previous status"
                      >
                        <X size={14} />
                        Reject
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : review.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '8px 10px', borderRadius: '8px',
                          background: isExpanded ? 'var(--primary-100)' : 'var(--primary-50)',
                          color: 'var(--primary)', border: '1px solid var(--border)',
                          fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Inspect detailed ratios and balance sheet"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Financial Breakdown Drawer */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '14px',
                      borderTop: '1px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      animation: 'fadeIn 0.2s ease',
                    }}>
                      {/* Ratios 3-Column Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {/* Debt Ratio */}
                        <div style={{
                          background: 'var(--bg-section)', padding: '10px 14px', borderRadius: '10px',
                          border: `1px solid ${screening.debt_status === 'fail' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Debt Ratio (Max 30%)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: screening.debt_status === 'fail' ? '#DC2626' : 'var(--text-dark)' }}>
                              {debtRatio !== null ? `${debtRatio.toFixed(2)}%` : 'N/A'}
                            </span>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              background: screening.debt_status === 'fail' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: screening.debt_status === 'fail' ? '#DC2626' : '#059669',
                            }}>
                              {screening.debt_status === 'fail' ? 'FAIL' : 'PASS'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Debt: {fmtNaira(finData.total_debt)}
                          </div>
                        </div>

                        {/* Cash Ratio */}
                        <div style={{
                          background: 'var(--bg-section)', padding: '10px 14px', borderRadius: '10px',
                          border: `1px solid ${screening.cash_status === 'fail' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Cash Ratio (Max 30%)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: screening.cash_status === 'fail' ? '#DC2626' : 'var(--text-dark)' }}>
                              {cashRatio !== null ? `${cashRatio.toFixed(2)}%` : 'N/A'}
                            </span>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              background: screening.cash_status === 'fail' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: screening.cash_status === 'fail' ? '#DC2626' : '#059669',
                            }}>
                              {screening.cash_status === 'fail' ? 'FAIL' : 'PASS'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Cash: {fmtNaira(finData.cash_and_equivalents || finData.cash)}
                          </div>
                        </div>

                        {/* Impure Income */}
                        <div style={{
                          background: 'var(--bg-section)', padding: '10px 14px', borderRadius: '10px',
                          border: `1px solid ${screening.impermissible_income_status === 'fail' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Impure Income (Max 5%)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: screening.impermissible_income_status === 'fail' ? '#DC2626' : 'var(--text-dark)' }}>
                              {impureRatio !== null ? `${impureRatio.toFixed(2)}%` : '0.00%'}
                            </span>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              background: screening.impermissible_income_status === 'fail' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: screening.impermissible_income_status === 'fail' ? '#DC2626' : '#059669',
                            }}>
                              {screening.impermissible_income_status === 'fail' ? 'FAIL' : 'PASS'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Interest: {fmtNaira(finData.interest_income)} / Rev: {fmtNaira(finData.total_revenue)}
                          </div>
                        </div>
                      </div>

                      {/* Source URL & Action Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <strong>Market Cap: </strong>{fmtNaira(finData.market_cap || company.market_cap)}
                          {finData.published_date && <span> • <strong>Published: </strong>{finData.published_date}</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {finData.source_url && (
                            <a
                              href={finData.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none',
                                fontWeight: 700, padding: '4px 8px', borderRadius: '6px',
                                background: 'var(--primary-50)'
                              }}
                            >
                              <FileText size={12} />
                              View Original Filing <ExternalLink size={11} />
                            </a>
                          )}

                          <Link
                            to="/admin/compliance-reviews"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none',
                              fontWeight: 600, padding: '4px 8px'
                            }}
                          >
                            <Eye size={12} />
                            Open in Compliance Manager
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Reassuring clean state when all reviews are completed */
        <div style={{
          marginBottom: '32px',
          background: 'var(--bg-section, #ffffff)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                Compliance Audits Up to Date
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No pending compliance changes requiring administrator review. All stocks are screened against latest financial filings.
              </div>
            </div>
          </div>

          <Link
            to="/admin/compliance-reviews"
            style={{
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View Review History <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <card.icon size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>
                {card.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Compliance Activity Feed ── */}
      {recentHistory.length > 0 && (
        <div style={{
          background: 'var(--bg-section, #ffffff)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                Recent Compliance Activity
              </h2>
            </div>
            <Link
              to="/admin/compliance-reviews"
              style={{
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              See All Logs <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentHistory.map((item) => {
              const comp = item.company || {};
              const isApproved = item.status === 'approved';
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg, #fafafa)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CompanyLogo
                      symbol={comp.symbol}
                      logoUrl={comp.logo_url}
                      size={28}
                      radius={6}
                    />
                    <span style={{ fontWeight: 800, color: 'var(--text-dark)', minWidth: '70px' }}>
                      {comp.symbol || 'N/A'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StatusPill status={item.old_status} size="sm" />
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <StatusPill status={item.new_status} size="sm" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: isApproved ? '#059669' : '#DC2626',
                    }}>
                      {item.status ? item.status.toUpperCase() : 'REVIEWED'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : (item.created_at ? new Date(item.created_at).toLocaleDateString() : '')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
