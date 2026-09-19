import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Rocket, FileText, BarChart2, Building, Calendar, Info, X, DollarSign, Clock, Shield, ChevronRight } from 'lucide-react';

const IPO_LIST = [
  {
    id: 'dangote-refinery',
    name: 'Dangote Refinery',
    status: 'OPEN',
    statusColor: 'var(--halal)',
    statusBg: 'var(--halal-bg)',
    sector: 'Oil & Gas',
    exchange: 'NGX (Planned)',
    valuation: '~$20B+',
    logo: 'https://raw.githubusercontent.com/iisinan/irshad/main/mobile/assets/logos/DPRP.png',
    timeline: 'Q4 2026 - Q1 2027 (Est.)',
    capacity: '650,000 barrels per day',
    listingLocation: 'Nigerian Exchange (NGX), London (LSE)',
    shariahAssessment: 'As a refining business, the core activity (petroleum processing) is permissible (Halal). The H1 2026 audited statements have been analyzed: The company holds ₦5.66B in debt (0.0086% Debt Ratio) and ₦4.26B in cash (0.0065% Cash Ratio), while impure income stands safely at 0.35%. It passes all AAOIFI quantitative financial screening ratios. Status: 100% HALAL.',
    description: "The Dangote Petroleum Refinery and Petrochemicals FZE initial public offering is now live. The offering involves 4.1 billion ordinary shares aimed at raising ₦2.15 trillion ($1.6 billion), representing one of the largest IPOs in African history. Minimum subscription is 10 shares (₦5,250), with subsequent multiples of 10. The offering is officially certified as Shariah-compliant.",
    dateStart: 'September 14, 2026',
    dateEnd: 'October 13, 2026',
    price: '₦525 per share'
  }
];

function IPOCard({ ipo, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: 'linear-gradient(180deg, var(--bg-section) 0%, var(--bg) 100%)',
        borderRadius: '20px', 
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        position: 'relative'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(91, 41, 113, 0.08)';
        e.currentTarget.style.borderColor = 'var(--primary-100)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '300px' }}>
          <div style={{ width: '72px', height: '72px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <img src={ipo.logo} alt={ipo.name} style={{ width: '75%', height: '75%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.2px' }}>{ipo.name}</h3>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, background: ipo.statusBg, color: ipo.statusColor, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.5px', boxShadow: '0 2px 8px ' + ipo.statusBg }}>
                {ipo.status}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16} style={{opacity: 0.7}} /> {ipo.sector}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart2 size={16} style={{opacity: 0.7}} /> {ipo.exchange}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}><Clock size={14} color="var(--primary)" /> Offer Period</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateStart.split(',')[0]} - {ipo.dateEnd.split(',')[0]}</div>
          </div>
          
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0, transition: 'all 0.2s' }} className="ipo-arrow">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function IPOModal({ ipo, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return createPortal(
    <div style={{ 
      position: 'fixed', inset: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(8px)',
      zIndex: 9999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div 
        className="animate-scale-up"
        style={{ 
          background: 'var(--bg)', 
          borderRadius: '28px', 
          width: '100%', maxWidth: '680px', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(to bottom, var(--bg-section) 0%, var(--bg) 100%)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <img src={ipo.logo} alt={ipo.name} style={{ width: '75%', height: '75%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.2px' }}>{ipo.name}</h3>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, background: ipo.statusBg, color: ipo.statusColor, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.5px', boxShadow: '0 2px 8px ' + ipo.statusBg }}>
                  {ipo.status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial Public Offering Details</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-section)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-dark)'; e.currentTarget.style.background = 'var(--border)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-section)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Clock size={16} /> Offer Starts
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateStart}</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Clock size={16} /> Offer Ends
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateEnd}</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <DollarSign size={16} /> Share Price
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.price}</div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--primary)" /> Overview
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              {ipo.description}
            </p>
          </div>

          {/* Additional Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Valuation</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.valuation}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.capacity}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listing Location</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.listingLocation}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', background: 'linear-gradient(135deg, var(--halal-bg) 0%, rgba(255,255,255,0) 100%)', padding: '24px', borderRadius: '20px', color: 'var(--text-dark)', border: '1px solid var(--halal-border)' }}>
            <Shield size={28} color="var(--halal)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 900, color: 'var(--halal)' }}>Preliminary Shariah Assessment</strong>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                {ipo.shariahAssessment}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UpdatesIPO() {
  const [selectedIPO, setSelectedIPO] = useState(null);

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {IPO_LIST.map(ipo => (
          <IPOCard key={ipo.id} ipo={ipo} onClick={() => setSelectedIPO(ipo)} />
        ))}
        {IPO_LIST.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-section)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            No upcoming IPOs found.
          </div>
        )}
      </div>

      {selectedIPO && (
        <IPOModal ipo={selectedIPO} onClose={() => setSelectedIPO(null)} />
      )}
    </div>
  );
}
