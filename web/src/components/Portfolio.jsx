import React, { useEffect, useState } from 'react';
import { Wallet, PieChart, TrendingUp, AlertCircle, ShieldAlert, Plus, X, Trash2 } from 'lucide-react';
import { fetchPortfolio, addHolding, removeHolding } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PortfolioItem = ({ id, symbol, name, shares, value, change, isHalal, purificationDue, onDelete }) => (
  <div style={{
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    position: 'relative'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
      <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
        {symbol.substring(0, 2)}
      </div>
      <div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)' }}>{symbol}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{name}</p>
      </div>
    </div>
    
    <div style={{ textAlign: 'right', flex: 1 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>SHARES</p>
      <p style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{Number(shares).toLocaleString()}</p>
    </div>

    <div style={{ textAlign: 'right', flex: 1 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>TOTAL VALUE</p>
      <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>₦ {Number(value).toLocaleString()}</p>
    </div>

    <div style={{ textAlign: 'right', flex: 1 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>RETURN</p>
      <p style={{ fontWeight: '700', color: change >= 0 ? 'var(--primary)' : 'var(--non-halal)' }}>
        {change >= 0 ? '+' : ''}{change}%
      </p>
    </div>
    
    <div style={{ width: '140px', textAlign: 'right', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
      {isHalal ? (
        purificationDue > 0 ? (
          <div className="status-badge status-doubtful" style={{ fontSize: '0.75rem', justifyContent: 'center' }}>
            <AlertCircle size={12} /> Purify ₦ {Number(purificationDue).toLocaleString()}
          </div>
        ) : (
          <div className="status-badge status-halal" style={{ fontSize: '0.75rem', justifyContent: 'center' }}>COMPLIANT</div>
        )
      ) : (
        <div className="status-badge status-non-halal" style={{ fontSize: '0.75rem', justifyContent: 'center' }}>
          <ShieldAlert size={12} /> NON-HALAL
        </div>
      )}
    </div>

    <button 
      onClick={() => onDelete(id)}
      style={{
        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
        padding: '8px', marginLeft: '16px'
      }}
      title="Remove Holding"
    >
      <Trash2 size={18} />
    </button>
  </div>
);

const Portfolio = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState({ holdings: [], summary: { total_balance: 0, purification_due: 0, health_percentage: 100 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ symbol: '', shares: '', average_buy_price: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      loadPortfolio();
    }
  }, [user, authLoading, navigate]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetchPortfolio();
      setData(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await addHolding({
        symbol: form.symbol,
        shares: parseFloat(form.shares),
        average_buy_price: form.average_buy_price ? parseFloat(form.average_buy_price) : null
      });
      setIsModalOpen(false);
      setForm({ symbol: '', shares: '', average_buy_price: '' });
      await loadPortfolio();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add holding');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this holding?')) {
      try {
        await removeHolding(id);
        await loadPortfolio();
      } catch (err) {
        alert('Failed to remove holding');
      }
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Loading portfolio...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '12px' }}>Dashboard</div>
          <h1 style={{ fontSize: '2.6rem', fontWeight: '800', letterSpacing: '-1px', color: 'var(--text-dark)' }}>Your Portfolio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '8px' }}>Track your investments and purification obligations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--text-dark)' }}>
            <Plus size={18} /> Add Holding
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} /> Connect Broker
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Total Balance</h3>
          <div style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--text-dark)', letterSpacing: '-1px', marginBottom: '8px' }}>₦ {Number(data.summary.total_balance).toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
            Based on current market prices
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Purification Due</h3>
          <div style={{ fontSize: '2.8rem', fontWeight: '900', color: data.summary.purification_due > 0 ? 'var(--doubtful)' : 'var(--primary)', letterSpacing: '-1px', marginBottom: '8px' }}>₦ {Number(data.summary.purification_due).toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>
            {data.summary.purification_due > 0 ? <><AlertCircle size={16} /> Requires your attention</> : 'All clear!'}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Portfolio Health</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: data.summary.health_percentage < 100 ? '8px solid var(--doubtful)' : '8px solid var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={32} color={data.summary.health_percentage < 100 ? "var(--doubtful)" : "var(--primary)"} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-dark)' }}>{data.summary.health_percentage}%</div>
              <div style={{ color: data.summary.health_percentage < 100 ? 'var(--doubtful)' : 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                {data.summary.health_percentage < 100 ? 'NEEDS ATTENTION' : 'SHARIAH COMPLIANT'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-dark)' }}>Your Assets</h3>
        
        {data.holdings.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You haven't added any holdings yet.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">Add Your First Holding</button>
          </div>
        ) : (
          data.holdings.map(holding => (
            <PortfolioItem 
              key={holding.id}
              id={holding.id}
              symbol={holding.symbol} 
              name={holding.name} 
              shares={holding.shares} 
              value={holding.total_value}
              change={holding.return_percentage} 
              isHalal={holding.is_halal} 
              purificationDue={holding.purification_due} 
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add Holding Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', padding: '32px', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Add Holding</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddHolding}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Stock Symbol (e.g. MTNN)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={form.symbol} 
                  onChange={e => setForm({...form, symbol: e.target.value})}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Number of Shares</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  value={form.shares} 
                  onChange={e => setForm({...form, shares: e.target.value})}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Average Buy Price (₦)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  value={form.average_buy_price} 
                  onChange={e => setForm({...form, average_buy_price: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={formLoading}>
                {formLoading ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
