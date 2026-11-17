import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ShieldCheck, Upload, Droplet,
  FileText, Building2, CheckCircle2, AlertTriangle, ArrowRight, Sparkles
} from 'lucide-react';
import { LOTUS_FALLBACK_DATA, NORRENBERGER_FALLBACK_DATA, formatNaira } from './institutionalFixtures';

export default function InstitutionalPresentationDeck({
  lotusData,
  mixedData,
  onJumpToTab,
  onSelectPreset,
}) {
  const [slide, setSlide] = useState(0);

  const lotusSummary = lotusData?.screening_result?.summary || {};
  const removedNascon = lotusData?.rebalance_removed;
  const mixedSummary = mixedData?.summary || {};

  const slides = [
    {
      id: 'overview',
      eyebrow: '01 / IRSHAD INSTITUTIONAL INFRASTRUCTURE',
      title: 'Shariah Compliance, Purification & Factsheet Engine for Nigerian Institutions',
      subtitle: 'Built for Asset Managers, Non-Interest Banks, Stockbrokers & Custodians — automating AAOIFI screening across NGX equities & Islamic funds.',
      render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {[
            {
              icon: Upload,
              color: 'var(--primary)',
              title: 'Universal Document Ingestion',
              desc: 'Drop PDF, Excel (.XLSX/.ODS), CSV, Word (.DOCX), JSON, HTML tables, or screenshots — auto-detected and screened in seconds.',
              actionLabel: 'Open Smart Uploader',
              onClick: () => onJumpToTab('screening'),
            },
            {
              icon: ShieldCheck,
              color: '#059669',
              title: 'Live AAOIFI Financial Audits',
              desc: 'Automated 3-stage verification against Q2/Q3 NGX filings: Business Activity, Debt <30%, Cash <30%, Impermissible Income <5%.',
              actionLabel: 'Inspect Verdicts',
              onClick: () => { onSelectPreset('lotus_etf'); onJumpToTab('screening'); },
            },
            {
              icon: Droplet,
              color: '#856527',
              title: 'Purification & Zakat Engine',
              desc: 'Computes constituent & fund-level purification (₦/unit), indicative equity Zakat, and exportable charity schedules.',
              actionLabel: 'Open Purification Engine',
              onClick: () => onJumpToTab('purification'),
            },
            {
              icon: FileText,
              color: '#1E4D40',
              title: 'One-Page Summary & Factsheet',
              desc: 'Generates standardized Irshad One-Page Summaries and 7-Section SEC Fact Sheets with built-in reconciliation checks.',
              actionLabel: 'Open Factsheet Suite',
              onClick: () => onJumpToTab('factsheet'),
            },
          ].map((card) => (
            <div key={card.title} style={{
              background: 'var(--bg-section)',
              borderRadius: 18,
              padding: 20,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}>
              <div>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color, marginBottom: 12,
                }}>
                  <card.icon size={20} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{card.desc}</p>
              </div>
              <button
                type="button"
                onClick={card.onClick}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--primary)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                {card.actionLabel} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'lotus',
      eyebrow: '02 / CASE STUDY: LOTUS HALAL EQUITY ETF (LOTUSHAL15)',
      title: 'Live Constituent Audit & FY Purification Verification',
      subtitle: 'All 13 NGX-Lotus Islamic Index constituents screened against latest NGX filings — plus automated detection of non-compliant drift.',
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {[
              { label: 'Fund Size (Jul 2026)', val: LOTUS_FALLBACK_DATA.fund_size_label, sub: 'Ticker: LOTUSHAL15' },
              { label: 'Screened Compliance', val: `${Number(lotusSummary.compliant_pct || 100).toFixed(0)}%`, sub: `${lotusSummary.compliant_count || 13} / ${lotusSummary.holdings_count || 13} Constituents Halal` },
              { label: 'FY\'25 Purification / Unit', val: `₦${LOTUS_FALLBACK_DATA.purification_per_unit_fy25.toFixed(2)}`, sub: 'Published vs Live Ratio Math' },
              { label: 'Last Rebalancing', val: LOTUS_FALLBACK_DATA.last_rebalancing, sub: 'Next: 31st Dec, 2026' },
            ].map((k) => (
              <div key={k.label} style={{ padding: 16, borderRadius: 14, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#991B1B', margin: '4px 0' }}>{k.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: 18, borderRadius: 16,
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 360px' }}>
              <AlertTriangle size={22} color="#B91C1C" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#991B1B' }}>
                  Why Rebalancing Matters: Nascon Allied Industries (NASCON) Audit
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                  During the 30th June 2026 rebalancing, Nestlé &amp; Cadbury were added while Nascon was removed. Irshad&apos;s live Q3 2026 screening confirms{' '}
                  <strong>NASCON</strong> breaches the 5% AAOIFI impermissible income cap at{' '}
                  <strong>{removedNascon ? `${Number(removedNascon.impure_ratio).toFixed(2)}%` : '7.12%'}</strong> — giving Shariah boards real-time early warning before semi-annual reviews.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { onSelectPreset('lotus_etf'); onJumpToTab('factsheet'); }}
              style={{
                padding: '10px 16px', borderRadius: 12, background: '#991B1B', color: '#fff',
                border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              View Lotus ETF Factsheet
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'norrenberger',
      eyebrow: '03 / CASE STUDY: NORRENBERGER ISLAMIC FUND',
      title: 'Fixed Income, Sukuk Mandate Monitoring & Branded Factsheets',
      subtitle: 'Tracking Mudarabah, Murabaha, Ijarah/Wakalah & FGN Sukuk allocations against Shariah target bands and moving-average benchmarks.',
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            {NORRENBERGER_FALLBACK_DATA.kpis.map((k) => (
              <div key={k.label} style={{ padding: 16, borderRadius: 14, background: 'linear-gradient(135deg, #1E4D40 0%, #297D66 100%)', color: '#fff' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{k.value}</div>
                <div style={{ fontSize: '0.76rem', opacity: 0.9, marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: 8 }}>
                Automated Mandate Drift Detection
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Irshad compares actual asset weights daily against prospectus bands: e.g., flagging <strong>Federal Government Sukuk at 21.79%</strong> (below the <strong>30%–100%</strong> target band) while confirming Mudarabah (43.99%), Murabaha (25.34%), and Ijarah (7.23%) remain compliant.
              </p>
            </div>
            <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg-section)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: 8 }}>
                  One-Click Monthly Factsheet Publishing
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Replace manual InDesign/Excel production with live-synced factsheets showing YTD Yield vs 3-Yr FGN Sukuk Benchmark, Maturity Profile, and Distribution per Unit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onSelectPreset('norrenberger_fund'); onJumpToTab('factsheet'); }}
                style={{
                  alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 12,
                  background: '#1E4D40', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                Open Norrenberger Factsheet
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'broker_upload',
      eyebrow: '04 / LIVE WORKFLOW: BANK & BROKER BOOK AUDIT',
      title: 'Screen Any Existing Client or Proprietary Portfolio Instantly',
      subtitle: 'What happens when a conventional broker or wealth desk uploads an existing equity book into Irshad?',
      render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>STEP 1 → UPLOAD ANY FORMAT</div>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
              Upload a CSCS statement, broker PDF, Excel spreadsheet, or CSV export. Irshad normalizes ticker aliases (e.g. WAPCO → HBMNG) and evaluates every line item.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Sample Mixed Book AUM: <strong style={{ color: 'var(--text-dark)' }}>{formatNaira(mixedSummary.total_aum || 850000000, true)}</strong>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b45309', marginBottom: 8 }}>STEP 2 → INSTANT VERDICT &amp; PURIFICATION</div>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
              Automatically isolates non-compliant exposures (such as conventional banks <strong>ZENITHBANK</strong>, breweries <strong>NB</strong>, or threshold breaches like <strong>NASCON</strong>) and quantifies exact ₦ purification due.
            </p>
            <button
              type="button"
              onClick={() => { onSelectPreset('mixed_institutional_book'); onJumpToTab('screening'); }}
              style={{
                padding: '9px 14px', borderRadius: 10, background: 'var(--primary)',
                color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              Demo Mixed Book Screening Now
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'partnership',
      eyebrow: '05 / PARTNERSHIP & DEPLOYMENT MODEL',
      title: 'Dedicated Institution Role Ready in Irshad Today',
      subtitle: 'Banks, brokers, and Islamic asset managers log in with an Institution account for unlimited bulk screening, purification schedules, and factsheet exports.',
      render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              title: 'Institutional Login & Saved Mandates',
              items: ['Dedicated Institution Role & Workspace', 'Unlimited NGX AAOIFI Screens & Statements', 'Save multiple Client / Fund Portfolios'],
            },
            {
              title: 'ACE / Shariah Board Co-Pilot',
              items: ['Instant Q1–Q4 Filing Ratio Extraction', 'Watchlist & Near-Threshold Drift Alerts', 'Full Audit Trail with NGX PDF Source Links'],
            },
            {
              title: 'White-Label Factsheets & API',
              items: ['Lotus / Norrenberger-grade PDF Factsheets', 'Annual & Quarterly Per-Unit Purification Feeds', 'Direct Distribution to Retail Investors on Irshad'],
            },
          ].map((col) => (
            <div key={col.title} style={{ padding: 18, borderRadius: 16, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 12 }}>
                <Building2 size={17} color="var(--primary)" /> {col.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.items.map((it) => (
                  <li key={it} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.79rem', color: 'var(--text-body)' }}>
                    <CheckCircle2 size={14} color="var(--halal)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
  ];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') setSlide((s) => Math.min(slides.length - 1, s + 1));
      if (e.key === 'ArrowLeft') setSlide((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slides.length]);

  const current = slides[slide];

  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 22,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
    }}>
      {/* Top Slide Bar */}
      <div style={{
        padding: '14px 22px',
        background: 'linear-gradient(90deg, rgba(69,165,138,0.12) 0%, rgba(209,165,98,0.10) 100%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.8px' }}>
          <Sparkles size={14} /> {current.eyebrow}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              style={{
                width: idx === slide ? 26 : 10,
                height: 10,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: idx === slide ? 'var(--primary)' : 'var(--border-strong)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Slide Content */}
      <div style={{ padding: '28px 26px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
          {current.title}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 820, lineHeight: 1.55 }}>
          {current.subtitle}
        </p>

        {current.render()}
      </div>

      {/* Slide Navigation Footer */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-section)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
          disabled={slide === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: slide === 0 ? 'var(--text-light)' : 'var(--text-dark)',
            fontWeight: 700, fontSize: '0.78rem', cursor: slide === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={15} /> Previous Slide
        </button>

        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Slide {slide + 1} of {slides.length} (Use ← / → keys)
        </span>

        <button
          type="button"
          onClick={() => setSlide((s) => Math.min(slides.length - 1, s + 1))}
          disabled={slide === slides.length - 1}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: 'none', background: slide === slides.length - 1 ? 'var(--border)' : 'var(--primary)',
            color: '#fff', fontWeight: 700, fontSize: '0.78rem',
            cursor: slide === slides.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next Slide <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
