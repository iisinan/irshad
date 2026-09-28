import React from 'react';
import { Briefcase, Activity, Calendar, ShieldCheck, Target, Droplet } from 'lucide-react';

export default function MutualFundOverview({ stock }) {
  const fd = stock?.fund_details || {};
  const history = fd.purification_history || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Overview Card */}
      <div className="detail-panel" style={{ padding: '28px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '20px' }}>
          <Briefcase size={16} /> ABOUT {stock.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} color="var(--primary)" /> Fund Manager
            </span>
            <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
              {fd.provider || 'N/A'}
            </span>
          </div>

          <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--gold, var(--gold))" /> Launched
            </span>
            <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
              {fd.launched || 'N/A'}
            </span>
          </div>

          <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--halal, #16a34a)" /> Trustee
            </span>
            <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
              {fd.trustee || 'N/A'}
            </span>
          </div>

          <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#3b82f6" /> Custodian
            </span>
            <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
              {fd.custodian || 'N/A'}
            </span>
          </div>

        </div>
      </div>

      {/* Investment Strategy */}
      <div className="detail-panel" style={{ padding: '28px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '20px' }}>
          <Target size={16} /> INVESTMENT STRATEGY
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Target Allocation</h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{fd.investment_components_target || 'Not specified.'}</p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Actual Asset Mix</h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{fd.asset_mix || 'Not available.'}</p>
          </div>
        </div>
      </div>

      {/* Purification Details */}
      <div className="detail-panel" style={{ padding: '28px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--doubtful, #eab308)', marginBottom: '20px' }}>
          <Droplet size={16} /> PURIFICATION DETAILS
        </div>
        
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
          {fd.purification_note || 'Not disclosed in public documents.'}
        </p>

        {history.length > 0 && (
          <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Financial Year</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Per Unit Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.year} style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)' }}>{h.year}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--doubtful, #eab308)' }}>₦{Number(h.per_unit).toFixed(5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
