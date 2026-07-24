import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, FileSpreadsheet, FileDigit, Clock, CheckCircle2 } from 'lucide-react';
import { toastSuccess, toastInfo } from '../../utils/toast';

export default function StatementTab({ data }) {
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, thisMonth, thisYear, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('all'); // all, deposit, withdrawal, buy, sell, dividend
  const [format, setFormat] = useState('pdf'); // pdf, csv, excel

  const MOCK_TRANSACTIONS = [
    { id: 'TRX-98234', date: '2026-07-22', desc: 'Dividend Payment - DANGCEM', type: 'dividend', amount: 45000.00, balance: 1450000.50 },
    { id: 'TRX-98233', date: '2026-07-18', desc: 'Buy - MTNN (1,000 units)', type: 'buy', amount: -285000.00, balance: 1405000.50 },
    { id: 'TRX-98231', date: '2026-07-15', desc: 'Bank Deposit - GTBank', type: 'deposit', amount: 500000.00, balance: 1690000.50 },
    { id: 'TRX-98228', date: '2026-07-10', desc: 'Sell - ZENITHBANK (500 units)', type: 'sell', amount: 18500.00, balance: 1190000.50 },
    { id: 'TRX-98225', date: '2026-07-02', desc: 'Withdrawal to Bank', type: 'withdrawal', amount: -100000.00, balance: 1171500.50 }
  ];

  const handleDownload = () => {
    toastSuccess(`Generating ${format.toUpperCase()} statement...`);
    setTimeout(() => {
      toastInfo("Statement download is ready. Check your downloads folder.");
    }, 2000);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="var(--primary)" />
            </div>
            Account Statement
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Generate and download your transaction history for accounting and tax purposes.
          </p>
        </div>
        <button onClick={handleDownload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Generate Statement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Filters Card */}
        <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--primary)" /> Statement Parameters
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Date Range Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '10px' }}>Date Range</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { id: '7days', label: 'Last 7 Days' },
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

            {/* Custom Date Inputs (only show if custom is selected) */}
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

            {/* Transaction Type Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '10px' }}>Transaction Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.9rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="buy">Purchases (Buy)</option>
                <option value="sell">Sales (Sell)</option>
                <option value="dividend">Dividends</option>
              </select>
            </div>
          </div>
        </div>

        {/* Format Selection Card */}
        <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDigit size={16} color="var(--primary)" /> Format Options
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {[
              { id: 'pdf', label: 'PDF Document', icon: FileText, desc: 'Best for printing and official records' },
              { id: 'csv', label: 'CSV File', icon: FileSpreadsheet, desc: 'Best for importing into accounting software' },
              { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, desc: 'Best for custom analysis and editing' }
            ].map(f => (
              <div key={f.id} onClick={() => setFormat(f.id)} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '14px', cursor: 'pointer',
                background: format === f.id ? 'var(--primary-10)' : 'var(--bg-section)',
                border: `1.5px solid ${format === f.id ? 'var(--primary)' : 'transparent'}`,
                transition: 'all 0.2s'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: format === f.id ? 'var(--primary)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: format === f.id ? 'white' : 'var(--text-muted)' }}>
                  <f.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: format === f.id ? 'var(--primary)' : 'var(--text-dark)', marginBottom: '2px' }}>{f.label}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
                {format === f.id && <CheckCircle2 size={20} color="var(--primary)" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--text-muted)" /> Statement Preview
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            Showing sample data
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction Details</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (₦)</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance (₦)</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.map((trx, i) => (
                <tr key={trx.id} style={{ borderBottom: i === MOCK_TRANSACTIONS.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(trx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{trx.id}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{trx.desc}</div>
                    <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--bg)', background: trx.type === 'buy' || trx.type === 'withdrawal' ? 'var(--non-halal)' : trx.type === 'deposit' || trx.type === 'dividend' ? 'var(--halal)' : 'var(--doubtful)', padding: '2px 8px', borderRadius: '10px', marginTop: '4px' }}>
                      {trx.type}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 800, color: trx.amount > 0 ? 'var(--halal)' : 'var(--text-dark)' }}>
                    {trx.amount > 0 ? '+' : ''}{trx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {trx.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
