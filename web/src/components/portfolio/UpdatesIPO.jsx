import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Rocket, FileText, BarChart2, Building, Calendar, Info, X, DollarSign, Clock, Shield } from 'lucide-react';

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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Dangote_Group_Logo.svg',
    timeline: 'Q4 2026 - Q1 2027 (Est.)',
    capacity: '650,000 barrels per day',
    listingLocation: 'Nigerian Exchange (NGX), London (LSE)',
    shariahAssessment: 'As a refining business, the core activity (petroleum processing) is generally considered permissible (Halal). A full AAOIFI screening regarding debt ratios (which may be substantial given the project size) and interest-bearing assets will be conducted once the official prospectus and financial statements are released.',
    description: "The Dangote Petroleum Refinery and Petrochemicals FZE initial public offering is now live. The offering involves 4.1 billion ordinary shares aimed at raising ₦2.15 trillion ($1.6 billion), representing one of the largest IPOs in African history. Minimum subscription is 10 shares (₦5,250), with subsequent multiples of 10. Irshad will provide a comprehensive Shariah compliance breakdown of the offer based on the official prospectus.",
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
        background: 'var(--bg-section)', 
        borderRadius: '16px', 
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = 'var(--primary-100)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={ipo.logo} alt={ipo.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{ipo.name}</h3>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: ipo.statusBg, color: ipo.statusColor, padding: '4px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>{ipo.status}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={14} /> {ipo.sector}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={14} /> {ipo.exchange}</span>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Expected Valuation</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.valuation}</div>
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
      backgroundColor: 'rgba(0,0,0,0.5)', 
      backdropFilter: 'blur(4px)',
      zIndex: 9999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div 
        className="animate-slide-up"
        style={{ 
          background: 'var(--bg)', 
          borderRadius: '24px', 
          width: '100%', maxWidth: '650px', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <img src={ipo.logo} alt={ipo.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{ipo.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initial Public Offering Details</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-section)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-dark)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Clock size={14} /> Offer Starts
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ipo.dateStart}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Clock size={14} /> Offer Ends
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ipo.dateEnd}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <DollarSign size={14} /> Share Price
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ipo.price}</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>Overview</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {ipo.description}
            </p>
          </div>

          {/* Additional Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Target Timeline</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="var(--primary)" /> {ipo.timeline}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Capacity</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ipo.capacity}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Listing Location</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{ipo.listingLocation}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'var(--primary-50)', padding: '20px', borderRadius: '16px', color: 'var(--primary)', border: '1px solid var(--primary-100)' }}>
            <Shield size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '6px', fontSize: '1rem', fontWeight: 800 }}>Preliminary Shariah Assessment</strong>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
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
