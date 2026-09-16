import React from 'react';
import { Briefcase } from 'lucide-react';

export default function HalalFundsTab() {
  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '60px 24px', textAlign: 'center', border: '1px dashed var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)' }}>
          <Briefcase size={32} />
        </div>
        <h2 style={{ fontSize: '1.58rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '12px' }}>Halal Funds</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          We will be adding a list of verified Halal Mutual Funds and ETFs very soon. Check back later!
        </p>
      </div>
    </div>
  );
}
