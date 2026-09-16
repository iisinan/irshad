import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function HalalFundsTab() {
  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '80px 24px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
        
        <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <TrendingUp size={36} strokeWidth={2.5} />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px', letterSpacing: '-0.3px' }}>
          Halal Mutual Funds
        </h2>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 28px', lineHeight: 1.6, fontWeight: 500 }}>
          We are partnering with leading asset managers to bring you curated, shariah-compliant mutual funds. Stay tuned!
        </p>

        <button style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: '30px', padding: '10px 24px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', cursor: 'default' }}>
          COMING SOON
        </button>
        
      </div>
    </div>
  );
}
