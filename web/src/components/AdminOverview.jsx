import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, TrendingUp, Shield, HelpCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 60000,
  });

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
    { label: 'Non-Compliant Stocks', value: stats.non_compliant_stocks, icon: AlertCircle, color: 'var(--non-compliant)', bg: 'var(--non-compliant-bg)' },
  ];

  return (
    <div className="admin-page-padding" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: '32px' }}>
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

      {/* Pending Reviews Alert */}
      {stats.pending_reviews > 0 && (
        <div style={{ marginBottom: '32px', background: 'var(--review-bg)', border: '1px solid var(--review)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--review)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--review)', fontSize: '1.1rem', fontWeight: 800 }}>Action Required</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                You have <strong>{stats.pending_reviews}</strong> pending compliance reviews waiting for your approval.
              </p>
            </div>
          </div>
          <Link to="/admin/compliance-reviews" style={{ textDecoration: 'none', padding: '10px 20px', background: 'var(--review)', color: 'white', fontWeight: 700, borderRadius: '10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Review Now
          </Link>
        </div>
      )}

      {/* Stat Cards */}
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

    </div>
  );
}
