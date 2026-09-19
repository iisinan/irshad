import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function UpdatesDigestViewer({ meta }) {
  const gainers = meta?.top_gainers || [];
  const losers = meta?.top_losers || [];
  const userPerf = meta?.user_performances || [];
  const dividends = meta?.dividends || [];

  const renderPerfItem = (item, i) => {
    const isUp = item.change_pct > 0;
    const isDown = item.change_pct < 0;
    const color = isUp ? 'var(--halal)' : isDown ? 'var(--non-compliant)' : 'var(--text-muted)';
    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    
    return (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-section)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-dark)' }}>{item.ticker}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.status || 'Status Unknown'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ padding: '4px', background: `color-mix(in srgb, ${color} 10%, transparent)`, borderRadius: '6px', color }}>
            <Icon size={12} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color }}>{isUp ? '+' : ''}{item.change_pct}%</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg)', borderRadius: '20px', color: 'var(--text-dark)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Weekly Digest</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Your portfolio compliance summary and market update.</p>
      
      {userPerf.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Your Watchlist & Portfolio</h3>
          {userPerf.map((p, i) => renderPerfItem(p, i))}
        </div>
      )}

      {gainers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Market Top Gainers</h3>
          {gainers.map((p, i) => renderPerfItem(p, i))}
        </div>
      )}

      {losers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Market Top Losers</h3>
          {losers.map((p, i) => renderPerfItem(p, i))}
        </div>
      )}

      {dividends.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Dividends This Week</h3>
          {dividends.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-section)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{d.ticker}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Declared: {d.date_declared}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>{d.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
