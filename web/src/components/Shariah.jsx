import React from 'react';
import { ShieldCheck, FileText, CheckCircle, Scale, XCircle, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import Footer from './Footer';

/* Ratio gauge bar component */
const RatioGauge = ({ threshold, label, note }) => (
  <div style={{ background: 'var(--bg)', borderRadius: '14px', padding: '18px 20px', border: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-dark)' }}>{label}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-50)', padding: '3px 10px', borderRadius: '20px', border: '1px solid var(--primary-100)' }}>
        &lt; {threshold}%
      </span>
    </div>
    <div style={{ height: '8px', background: 'var(--bg-section)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        height: '100%', width: `${threshold}%`, borderRadius: '99px',
        background: 'linear-gradient(90deg, var(--halal) 0%, var(--primary) 100%)',
        boxShadow: '0 0 8px rgba(34,197,94,0.4)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: `${threshold}%`, transform: 'translateX(-50%) translateY(-50%)',
        width: '14px', height: '14px', background: 'var(--bg)', border: '2px solid var(--primary)', borderRadius: '50%',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }} />
    </div>
    {note && <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>{note}</p>}
  </div>
);

const ShariahPage = () => (
  <>
  <div className="animate-fade-in page-wrapper">
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>

      {/* ─── Hero ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)',
        borderRadius: '28px', padding: '64px 56px', marginBottom: '48px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', padding: '6px 18px', borderRadius: '40px', marginBottom: '24px' }}>
            <BookOpen size={14} color="var(--gold)" />
            <span style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Methodology</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-1px', color: 'white', lineHeight: 1.1, marginBottom: '20px' }}>
            AAOIFI Screening<br />
            <span style={{ background: 'linear-gradient(90deg, var(--gold), #F5D06A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Standards
            </span>
          </h1>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.75)', maxWidth: '600px', margin: '0 auto' }}>
            Irshad employs the globally recognized standards set by the <strong style={{ color: 'white' }}>AAOIFI</strong> to ensure your investments remain 100% halal — automatically, without guesswork.
          </p>
        </div>

        {/* 3-phase pill strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '36px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {['Business Screen', 'Financial Ratios', 'Purification'].map((phase, i) => (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '40px' }}>
              <div style={{ width: '22px', height: '22px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, color: '#1A1208' }}>{i + 1}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white' }}>{phase}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Phase 1: Business Activity ─── */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--non-halal)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', background: '#fee2e2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #fecaca' }}>
            <XCircle size={26} color="var(--non-halal)" />
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--non-halal)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phase 1</div>
            <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Business Activity Screen</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.88rem', marginBottom: '28px' }}>
          Before looking at any financial metrics, we analyze a company's core business activities. A company is immediately marked as <strong style={{ color: 'var(--non-halal)' }}>NON-HALAL</strong> if its primary business involves any of the following:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {[
            'Conventional Banking & Insurance',
            'Alcohol Production or Sales',
            'Pork & Non-Halal Meat',
            'Gambling & Casinos',
            'Adult Entertainment',
            'Weapons & Defense',
            'Tobacco',
            'Interest-based Lending',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: '12px', padding: '12px 16px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-halal)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.77rem' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Phase 2: Financial Ratio Screen ─── */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--primary-100)' }}>
            <Scale size={26} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phase 2</div>
            <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Financial Ratio Screen</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.88rem', marginBottom: '28px' }}>
          If a company passes the business screen, we analyze its balance sheet. Per <strong>AAOIFI Rule 21</strong>, companies must pass three strict financial thresholds. The compliance threshold is shown on each bar below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <RatioGauge
            threshold={30}
            label="1. Debt Ratio — Interest-bearing debt vs. Market Cap"
            note="Total interest-bearing debt must not exceed 30% of the 12-month trailing average market capitalization."
          />
          <RatioGauge
            threshold={30}
            label="2. Liquidity Ratio — Cash & Interest Investments vs. Market Cap"
            note="Interest-bearing securities and deposits must not exceed 30% of the trailing market capitalization."
          />
          <RatioGauge
            threshold={5}
            label="3. Impermissible Income Ratio — Non-compliant income vs. Total Revenue"
            note="Income from impermissible activities (e.g. interest on cash reserves) must not exceed 5% of total gross revenue."
          />
        </div>
      </div>

      {/* ─── Phase 3: Purification ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F5257 0%, #0D1B2A 100%)',
        borderRadius: '24px', padding: '40px', boxShadow: 'var(--shadow-md)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(201,168,76,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(201,168,76,0.3)' }}>
            <Sparkles size={26} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phase 3</div>
            <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Dividend Purification</h2>
          </div>
        </div>

        <p style={{ lineHeight: 1.8, fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          Even fully Halal companies often have trace amounts of interest income from cash stored in conventional banks. AAOIFI requires investors to <strong style={{ color: 'white' }}>"purify"</strong> their earnings by calculating the exact percentage of impermissible income and donating it to charity.
        </p>
        <p style={{ lineHeight: 1.8, fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', position: 'relative', zIndex: 1, marginBottom: '28px' }}>
          Irshad automatically calculates the <strong style={{ color: 'white' }}>Purification Rate</strong> for every stock on the market — removing the guesswork so your dividends remain 100% clean.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {[
            { icon: CheckCircle, label: 'Auto-calculated', sub: 'Per holding, per dividend' },
            { icon: ShieldCheck, label: 'AAOIFI compliant', sub: 'Globally recognized standard' },
            { icon: FileText, label: 'Charity guidance', sub: 'Irshad tracks your total due' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '18px 20px', backdropFilter: 'blur(4px)' }}>
              <Icon size={20} color="var(--gold)" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 800, color: 'white', fontSize: '0.81rem', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '0.69rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
  <Footer />
  </>
);

export default ShariahPage;
