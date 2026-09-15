import React from 'react';
import { Rocket, FileText, BarChart2, Building, Calendar, Info } from 'lucide-react';

export default function UpdatesIPO() {
  return (
    <div style={{ padding: '24px', background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Rocket size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>IPO Center</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upcoming Initial Public Offerings & Shariah analysis</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Dangote Refinery IPO Card */}
        <div style={{ 
          background: 'var(--bg-section)', 
          borderRadius: '16px', 
          border: '1px solid var(--border)',
          overflow: 'hidden',
          transition: 'all 0.3s'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/90/Dangote_Group_Logo.svg" alt="Dangote" style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Dangote Refinery</h3>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'var(--primary-50)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>UPCOMING</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={14} /> Oil & Gas</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={14} /> NGX (Planned)</span>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Expected Valuation</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>~$20B+</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: 'var(--primary-50)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
              <Info size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Preliminary Shariah Assessment</strong>
                As a refining business, the core activity (petroleum processing) is generally considered permissible (Halal). A full AAOIFI screening regarding debt ratios (which may be substantial given the project size) and interest-bearing assets will be conducted once the official prospectus and financial statements are released.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Target Timeline</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="var(--primary)" /> Q4 2026 - Q1 2027 (Est.)</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Capacity</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>650,000 barrels per day</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Listing Location</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Nigerian Exchange (NGX), London (LSE) dual-listing potential</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The Dangote Refinery is Africa's largest oil refinery and the world's largest single-train facility. The planned IPO is expected to be one of the largest in African history. Irshad will provide a comprehensive Shariah compliance breakdown of the offer once the regulatory filings are public.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
