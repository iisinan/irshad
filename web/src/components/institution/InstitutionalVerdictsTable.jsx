import React, { useMemo, useState, useId } from 'react';
import {
  Search, ChevronDown, ChevronUp, ArrowUpDown, ExternalLink,
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, Droplet, Info, Download, Trash2
} from 'lucide-react';
import { formatNaira } from './institutionalFixtures';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function VerdictBadge({ status, purificationRequired, impureRatio }) {
  const s = (status || 'doubtful').toLowerCase();
  if (s === 'halal' || s === 'compliant') {
    const needsPurify = purificationRequired || Number(impureRatio) > 0;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999, fontSize: '0.71rem', fontWeight: 800,
        background: needsPurify ? 'rgba(245, 158, 11, 0.12)' : 'var(--halal-bg)',
        color: needsPurify ? '#b45309' : 'var(--halal)',
        border: `1px solid ${needsPurify ? 'rgba(245, 158, 11, 0.35)' : 'var(--halal-border)'}`,
        whiteSpace: 'nowrap',
      }}>
        <CheckCircle2 size={12} aria-hidden="true" />
        {needsPurify ? 'Compliant · Purify' : 'Shariah Compliant'}
      </span>
    );
  }
  if (s === 'non-compliant' || s === 'non_compliant' || s === 'non-halal') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999, fontSize: '0.71rem', fontWeight: 800,
        background: 'var(--non-compliant-bg)',
        color: 'var(--non-compliant)',
        border: '1px solid var(--non-compliant-border)',
        whiteSpace: 'nowrap',
      }}>
        <XCircle size={12} aria-hidden="true" />
        Non-Compliant
      </span>
    );
  }
  if (s === 'unmapped') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999, fontSize: '0.71rem', fontWeight: 800,
        background: 'var(--bg-section)', color: 'var(--text-muted)',
        border: '1px solid var(--border)', whiteSpace: 'nowrap',
      }}>
        <Info size={12} aria-hidden="true" />
        Unmapped Ticker
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999, fontSize: '0.71rem', fontWeight: 800,
      background: 'var(--doubtful-bg)', color: '#92400e',
      border: '1px solid var(--doubtful-border)', whiteSpace: 'nowrap',
    }}>
      <HelpCircle size={12} aria-hidden="true" />
      Doubtful
    </span>
  );
}

const RatioMeter = ({ label, value, threshold }) => {
  const num = value === null || value === undefined ? null : Number(value);
  const passed = num === null ? true : num < threshold;
  const pctFill = num === null ? 0 : Math.min(100, (num / threshold) * 100);
  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{
          fontSize: '0.74rem', fontWeight: 800,
          color: num === null ? 'var(--text-muted)' : (passed ? 'var(--halal)' : 'var(--non-compliant)'),
        }}>
          {num === null ? 'N/A' : `${num.toFixed(2)}%`} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>/ &lt;{threshold}%</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pctFill}%`,
          background: passed ? 'var(--halal)' : 'var(--non-compliant)',
          borderRadius: 999,
          transition: 'width 0.35s ease',
        }} />
      </div>
    </div>
  );
};

export default function InstitutionalVerdictsTable({
  holdings = [],
  title = 'Screened Holdings & AAOIFI Verdicts',
  onRemoveHolding,
}) {
  const captionId = useId();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortCol, setSortCol] = useState('weight_pct');
  const [sortDir, setSortDir] = useState('descending');
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [liveStatusText, setLiveStatusText] = useState('');

  const handleSort = (colKey, label) => {
    const nextDir = sortCol === colKey && sortDir === 'ascending' ? 'descending' : 'ascending';
    setSortCol(colKey);
    setSortDir(nextDir);
    setLiveStatusText(`Sorted by ${label}, ${nextDir}, ${filteredHoldings.length} rows`);
  };

  const filteredHoldings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = holdings.filter((h) => {
      if (q) {
        const hay = `${h.symbol} ${h.name} ${h.sector}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === 'halal') return h.status === 'halal';
      if (statusFilter === 'purify') return h.status === 'halal' && (h.purification_required || Number(h.impure_ratio) > 0);
      if (statusFilter === 'non-compliant') return h.status === 'non-compliant';
      if (statusFilter === 'doubtful') return h.status === 'doubtful' || h.status === 'unmapped';
      return true;
    });

    const factor = sortDir === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (['symbol', 'name', 'sector', 'status'].includes(sortCol)) {
        return factor * collator.compare(String(a[sortCol] || ''), String(b[sortCol] || ''));
      }
      const va = Number(a[sortCol] ?? 0);
      const vb = Number(b[sortCol] ?? 0);
      return factor * (va - vb);
    });
  }, [holdings, search, statusFilter, sortCol, sortDir]);

  const counts = useMemo(() => ({
    all: holdings.length,
    halal: holdings.filter(h => h.status === 'halal').length,
    purify: holdings.filter(h => h.status === 'halal' && (h.purification_required || Number(h.impure_ratio) > 0)).length,
    'non-compliant': holdings.filter(h => h.status === 'non-compliant').length,
    doubtful: holdings.filter(h => h.status === 'doubtful' || h.status === 'unmapped').length,
  }), [holdings]);

  const exportScreeningCsv = () => {
    const headers = ['Symbol', 'Name', 'Sector', 'Weight (%)', 'Units', 'Price (NGN)', 'Market Value (NGN)', 'Verdict', 'Debt Ratio (%)', 'Cash Ratio (%)', 'Impure Income Ratio (%)', 'Trailing Div/Share (NGN)', 'Purification Due (NGN)'];
    const lines = [headers.join(',')];
    filteredHoldings.forEach((h) => {
      lines.push([
        h.symbol,
        `"${String(h.name || '').replace(/"/g, '""')}"`,
        `"${String(h.sector || '').replace(/"/g, '""')}"`,
        Number(h.weight_pct ?? 0).toFixed(2),
        h.shares ?? 0,
        Number(h.current_price ?? 0).toFixed(2),
        Number(h.market_value ?? 0).toFixed(2),
        h.status,
        h.debt_ratio ?? '',
        h.cash_ratio ?? '',
        Number(h.impure_ratio ?? 0).toFixed(2),
        Number(h.trailing_dividend_per_share ?? 0).toFixed(4),
        Number(h.purification_due ?? 0).toFixed(2),
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'irshad-institutional-screening-verdicts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ colKey, label, align = 'left' }) => {
    const isSorted = sortCol === colKey;
    return (
      <th
        scope="col"
        aria-sort={isSorted ? sortDir : undefined}
        style={{
          padding: 0,
          textAlign: align,
          background: 'var(--bg-section)',
          borderBottom: '1px solid var(--border-strong)',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          type="button"
          onClick={() => handleSort(colKey, label)}
          style={{
            width: '100%',
            minHeight: 40,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            gap: 6,
            cursor: 'pointer',
            color: isSorted ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
            fontFamily: 'inherit',
          }}
        >
          <span>{label}</span>
          <ArrowUpDown size={12} aria-hidden="true" style={{ opacity: isSorted ? 1 : 0.45 }} />
        </button>
      </th>
    );
  };

  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Filter & Search Toolbar */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'halal', label: `Compliant (${counts.halal})` },
            { id: 'purify', label: `Needs Purification (${counts.purify})` },
            { id: 'non-compliant', label: `Flagged Non-Compliant (${counts['non-compliant']})` },
            ...(counts.doubtful > 0 ? [{ id: 'doubtful', label: `Doubtful/Other (${counts.doubtful})` }] : []),
          ].map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${statusFilter === pill.id ? 'var(--primary)' : 'var(--border)'}`,
                background: statusFilter === pill.id ? 'var(--primary-50)' : 'var(--bg-section)',
                color: statusFilter === pill.id ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap', flex: '0 1 auto', minWidth: 0 }}>
          <div style={{ position: 'relative', width: 250, minWidth: 180, flex: '1 1 220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker, company, sector..."
              aria-label="Filter screened holdings"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 34px',
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-section)',
                color: 'var(--text-dark)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="button"
            onClick={exportScreeningCsv}
            disabled={filteredHoldings.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
              color: 'var(--text-dark)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Visually-hidden live sort announcement */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {liveStatusText}
      </div>

      {/* Accessible scrollable region */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        style={{
          overflowX: 'auto',
          maxHeight: '620px',
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'separate', borderSpacing: 0 }}>
          <caption id={captionId} style={{
            textAlign: 'left',
            padding: '12px 20px 6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}>
            {title} — Click any row to inspect AAOIFI financial ratios &amp; business activity rationale
          </caption>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr>
              <SortHeader colKey="symbol" label="Security" />
              <SortHeader colKey="sector" label="Sector" />
              <SortHeader colKey="weight_pct" label="Weight" align="right" />
              <SortHeader colKey="shares" label="Units" align="right" />
              <SortHeader colKey="market_value" label="Market Value" align="right" />
              <SortHeader colKey="status" label="Irshad Verdict" />
              <SortHeader colKey="impure_ratio" label="Impure Inc %" align="right" />
              <SortHeader colKey="purification_due" label="Purification Due" align="right" />
              <th scope="col" style={{ padding: '10px 12px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border-strong)', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Audit
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No holdings match the active filter.
                </td>
              </tr>
            ) : filteredHoldings.map((h) => {
              const isExpanded = expandedSymbol === h.symbol;
              return (
                <React.Fragment key={`${h.symbol}-${h.input_symbol || ''}`}>
                  <tr
                    onClick={() => setExpandedSymbol(isExpanded ? null : h.symbol)}
                    style={{
                      cursor: 'pointer',
                      background: h.status === 'non-compliant' ? 'rgba(220, 38, 38, 0.03)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <th scope="row" style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'left',
                      position: 'sticky',
                      left: 0,
                      background: h.status === 'non-compliant' ? '#fef8f8' : 'var(--bg)',
                      zIndex: 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: h.status === 'non-compliant' ? 'var(--non-compliant-bg)' : 'var(--primary-50)',
                          color: h.status === 'non-compliant' ? 'var(--non-compliant)' : 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '0.72rem', flexShrink: 0,
                        }}>
                          {h.symbol.slice(0, 4)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.84rem' }}>{h.symbol}</span>
                            {h.is_near_threshold && (
                              <span title="Approaching AAOIFI threshold" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', fontWeight: 800, color: '#b45309', background: 'rgba(245,158,11,0.14)', padding: '1px 6px', borderRadius: 999 }}>
                                <AlertTriangle size={10} /> Watch
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                            {h.name}
                          </div>
                        </div>
                      </div>
                    </th>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontSize: '0.76rem', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
                      {h.sector}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(h.weight_pct ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(h.shares ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-dark)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatNaira(h.market_value)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                      <VerdictBadge status={h.status} purificationRequired={h.purification_required} impureRatio={h.impure_ratio} />
                    </td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      fontVariantNumeric: 'tabular-nums',
                      color: Number(h.impure_ratio) >= 5 ? 'var(--non-compliant)' : (Number(h.impure_ratio) > 0 ? '#b45309' : 'var(--halal)'),
                    }}>
                      {Number(h.impure_ratio ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {h.status === 'halal' ? (
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: Number(h.purification_due) > 0 ? '#b45309' : 'var(--text-muted)' }}>
                            {formatNaira(h.purification_due)}
                          </div>
                          {Number(h.purification_per_unit) > 0 && (
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                              ₦{Number(h.purification_per_unit).toFixed(4)}/unit
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.73rem', color: 'var(--non-compliant)', fontWeight: 700 }}>Divest / Flag</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedSymbol(isExpanded ? null : h.symbol); }}
                        aria-expanded={isExpanded}
                        aria-label={`Inspect ${h.symbol} screening breakdown`}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '1px solid var(--border)', background: 'var(--bg-section)',
                          color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={9} style={{ padding: '16px 20px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border-strong)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 14 }}>
                          <RatioMeter label="Interest-Bearing Debt / Market Cap" value={h.debt_ratio} threshold={30} />
                          <RatioMeter label="Cash & Interest Securities / Market Cap" value={h.cash_ratio} threshold={30} />
                          <RatioMeter label="Impermissible Income / Revenue" value={h.impure_ratio} threshold={5} />
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: '1 1 380px', fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                            <strong style={{ color: 'var(--text-dark)' }}>Business Screening ({h.reporting_period || 'Latest Filing'}):</strong>{' '}
                            {h.business_summary || 'Screened against AAOIFI Shariah Standard No. 21 qualitative and quantitative thresholds.'}
                            {Number(h.trailing_dividend_per_share) > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, color: '#b45309', fontWeight: 700 }}>
                                <Droplet size={12} /> Trailing Div: ₦{Number(h.trailing_dividend_per_share).toFixed(2)}/sh
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {onRemoveHolding && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemoveHolding(h.symbol); }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '8px 12px', borderRadius: 10,
                                  border: '1px solid var(--non-compliant-border)',
                                  background: 'var(--non-compliant-bg)',
                                  color: 'var(--non-compliant)',
                                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} /> Remove Position
                              </button>
                            )}
                            {h.status !== 'unmapped' && (
                              <a
                                href={`/market/${h.symbol}/aaoifi`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '8px 14px', borderRadius: 10,
                                  background: 'var(--primary)', color: '#fff',
                                  fontSize: '0.76rem', fontWeight: 700, textDecoration: 'none',
                                }}
                              >
                                Full AAOIFI Report <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
