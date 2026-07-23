import React from 'react';

export default function OverviewTab() {
  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '60px 24px', textAlign: 'center', border: '1px dashed var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: '1.58rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '12px' }}>Overview</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          We will develop this later. Check out your Portfolio or Market Screener in the meantime.
        </p>
      </div>
    </div>
  );
}
