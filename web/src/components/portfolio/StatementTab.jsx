import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, Building2 } from 'lucide-react';
import { toastSuccess, toastInfo } from '../../utils/toast';

export default function StatementTab({ data }) {
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('all');

  // Synthesize transactions from holdings data for a complete bank-style statement
  const transactions = useMemo(() => {
    let trxs = [];
    let balance = 0;
    
    if (data?.holdings && data.holdings.length > 0) {
      // 1. Holdings
      data.holdings.forEach(h => {
        const val = h.shares * h.current_price;
        trxs.push({
          id: `HLD-${h.id || Math.floor(Math.random()*10000)}`,
          date: new Date(h.purchase_date || h.created_at || h.updated_at || Date.now()).toISOString(),
          desc: `Asset Holding - ${h.symbol} (${h.shares} units @ ₦${h.current_price})`,
          type: 'holding',
          amount: val,
          icon: Building2,
          color: 'var(--primary)'
        });
      });

    }

    // Sort ascending for balance calculation
    trxs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    trxs = trxs.map(t => {
      balance += t.amount;
      return { ...t, balance };
    });

    // Sort descending for display
    return trxs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (type !== 'all') result = result.filter(t => t.type === type);
    return result;
  }, [transactions, type]);

  const handleDownload = () => {
    toastSuccess(`Preparing PDF Statement...`);
    setTimeout(() => {
      window.print();
      toastInfo("Select 'Save as PDF' in the print dialog.");
    }, 800);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="var(--primary)" />
            </div>
            Account Statement
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Generate a bank-style statement containing holdings, zakat, and purification records.
          </p>
        </div>
        <button onClick={handleDownload} className="btn-primary hover-lift print-hide" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}>
          <Download size={16} /> Download Statement
        </button>
      </div>

      <div className="print-hide" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--primary)" /> Statement Parameters
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '10px' }}>Date Range</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'thisYear', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' }
                ].map(r => (
                  <button key={r.id} onClick={() => setDateRange(r.id)} style={{
                    padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
                    background: dateRange === r.id ? 'var(--primary-10)' : 'var(--bg-section)',
                    border: `1.5px solid ${dateRange === r.id ? 'var(--primary)' : 'transparent'}`,
                    color: dateRange === r.id ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {dateRange === 'custom' && (
              <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-section)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '10px' }}>Record Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.9rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Records</option>
                <option value="holding">Holdings</option>
                <option value="purification">Purifications</option>
                <option value="zakat">Zakat Payments</option>
              </select>
            </div>
          </div>
        </div>


      </div>

      {/* Statement Print Container */}
      <div className="statement-print-area" style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
        
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', background: 'var(--bg)' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Account Statement
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Date Generated:</strong> {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>Irshad Platform</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Islamic Wealth Management</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-section)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '16px 32px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '16px 32px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                <th style={{ padding: '16px 32px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Amount (₦)</th>
                <th style={{ padding: '16px 32px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Running Balance (₦)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                    No records found for the selected parameters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, i) => {
                  const Icon = trx.icon;
                  return (
                    <tr key={trx.id} style={{ borderBottom: i === filteredTransactions.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{new Date(trx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>{trx.id}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${trx.color}15`, color: trx.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)' }}>{trx.desc}</div>
                            <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: trx.color, padding: '2px 0', marginTop: '2px' }}>
                              {trx.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '1rem', fontWeight: 800, textAlign: 'right', color: trx.amount > 0 ? 'var(--text-dark)' : 'var(--non-halal)' }}>
                        {trx.amount > 0 ? '+' : ''}{trx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '1rem', fontWeight: 700, textAlign: 'right', color: 'var(--text-muted)' }}>
                        {trx.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .statement-print-area, .statement-print-area * {
            visibility: visible;
          }
          .statement-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hide { display: none !important; }
        }
      `}} />
    </div>
  );
}

