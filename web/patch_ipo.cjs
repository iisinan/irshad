const fs = require('fs');

let content = fs.readFileSync('src/components/portfolio/UpdatesIPO.jsx', 'utf8');

// Ensure ChevronRight is imported
if (!content.includes('ChevronRight')) {
  content = content.replace('DollarSign, Clock, Shield }', 'DollarSign, Clock, Shield, ChevronRight }');
}

// Update IPOCard to be much nicer
const oldCard = `function IPOCard({ ipo, onClick }) {
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
        
      </div>
    </div>
  );
}`;

const newCard = `function IPOCard({ ipo, onClick }) {
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
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.2px' }}>{ipo.name}</h3>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: ipo.statusBg, color: ipo.statusColor, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.5px', boxShadow: '0 2px 8px ' + ipo.statusBg }}>
                {ipo.status}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16} style={{opacity: 0.7}} /> {ipo.sector}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart2 size={16} style={{opacity: 0.7}} /> {ipo.exchange}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}><Clock size={14} color="var(--primary)" /> Offer Period</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{ipo.dateStart.split(',')[0]} - {ipo.dateEnd.split(',')[0]}</div>
          </div>
          
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0, transition: 'all 0.2s' }} className="ipo-arrow">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(oldCard, newCard);
fs.writeFileSync('src/components/portfolio/UpdatesIPO.jsx', content);
