const fs = require('fs');

let content = fs.readFileSync('src/components/portfolio/UpdatesIPO.jsx', 'utf8');

const oldModal = `function IPOModal({ ipo, onClose }) {
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
}`;

const newModal = `function IPOModal({ ipo, onClose }) {
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
        <div style={{ padding: '28px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <img src={ipo.logo} alt={ipo.name} style={{ width: '75%', height: '75%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.2px' }}>{ipo.name}</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: ipo.statusBg, color: ipo.statusColor, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.5px', boxShadow: '0 2px 8px ' + ipo.statusBg }}>
                  {ipo.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Initial Public Offering Details</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Clock size={16} /> Offer Starts
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateStart}</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Clock size={16} /> Offer Ends
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateEnd}</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <DollarSign size={16} /> Share Price
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.price}</div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--primary)" /> Overview
            </h4>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              {ipo.description}
            </p>
          </div>

          {/* Additional Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Valuation</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.valuation}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.capacity}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listing Location</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.listingLocation}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', background: 'linear-gradient(135deg, var(--halal-bg) 0%, rgba(255,255,255,0) 100%)', padding: '24px', borderRadius: '20px', color: 'var(--text-dark)', border: '1px solid var(--halal-border)' }}>
            <Shield size={28} color="var(--halal)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1.1rem', fontWeight: 900, color: 'var(--halal)' }}>Preliminary Shariah Assessment</strong>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                {ipo.shariahAssessment}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('src/components/portfolio/UpdatesIPO.jsx', content);
