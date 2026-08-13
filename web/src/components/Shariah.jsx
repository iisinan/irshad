import React from 'react';
import { ShieldCheck, FileText, CheckCircle, Scale, XCircle, Sparkles, BookOpen } from 'lucide-react';
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
        background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, var(--text-dark) 100%)',
        borderRadius: '28px', padding: '64px 56px', marginBottom: '48px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid rgba(209, 165, 98, 0.2)'
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: 'rgba(209, 165, 98, 0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '200px', height: '200px', background: 'rgba(209, 165, 98, 0.04)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(209, 165, 98, 0.12)', border: '1px solid rgba(209, 165, 98, 0.3)', padding: '6px 18px', borderRadius: '40px', marginBottom: '24px' }}>
            <BookOpen size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Methodology</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-1px', color: 'white', lineHeight: 1.1, marginBottom: '20px' }}>
            AAOIFI Screening<br />
            <span style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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

      {/* ─── Jurisprudential Foundations ─── */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '36px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <BookOpen size={24} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>The 4 Juristic Foundations (Appendix B)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, fontSize: '0.86rem', marginBottom: '20px' }}>
          Why is investing in mixed companies permitted in modern capital markets? Classical Islamic jurisprudence provides four distinct legal principles under AAOIFI Standard 21:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            { name: '1. Removal of Hardship (Al-Mashaqqah Tajlib At-Taysir)', desc: 'Requiring absolute 0.00% contact with conventional interest would isolate Muslims from global enterprise and modern wealth creation.' },
            { name: '2. Predominance of Halal (Ghalabat al-Halal)', desc: 'When 95%+ of revenue is derived from permissible trade, the company\'s wealth is predominantly lawful to co-own.' },
            { name: '3. Separation of Bargains (Tafriq al-Safqah)', desc: 'Permissible commercial equity ownership remains valid, while the minor impermissible revenue is segregated and purified.' },
            { name: '4. Subordinate Follows Primary (At-Tabi\' Tabi\')', desc: 'Incidental cash deposits in conventional banks are subordinate to the primary operating commercial activity.' },
          ].map((item, idx) => (
            <div key={idx} style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>{item.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Phase 1: Business Activity ─── */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--non-halal)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--non-halal-bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--non-halal-border)' }}>
            <XCircle size={26} color="var(--non-halal)" />
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--non-halal)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phase 1</div>
            <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Business Activity Screen</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.88rem', marginBottom: '28px' }}>
          Before analyzing financial ratios, we examine a company's core operations. A company is immediately marked as <strong style={{ color: 'var(--non-halal)' }}>Shariah Non-Compliant</strong> if its primary business involves:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {[
            'Conventional Banking & Insurance',
            'Alcohol Production or Sales',
            'Pork & Non-Halal Meat',
            'Gambling & Casinos',
            'Adult Entertainment & Media',
            'Weapons & Defense Manufacturing',
            'Tobacco & Tobacco Products',
            'Interest-based Lending & Usury',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--non-halal-bg)', border: '1px solid var(--non-halal-border)',
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
          Companies passing the business activity screen are tested against <strong>AAOIFI Standard 21</strong> quantitative thresholds using live Market Capitalization:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <RatioGauge
            threshold={30}
            label="1. Debt Ratio — Total Interest-Bearing Debt / Market Cap × 100"
            note="Excludes trade payables, supplier credit, and non-interest operating liabilities. Must not exceed 30.00%."
          />
          <RatioGauge
            threshold={30}
            label="2. Cash Ratio — (Cash + Interest Securities) / Market Cap × 100"
            note="Ensures the company is an operating enterprise and not a cash holding shell. Must not exceed 30.00%."
          />
          <RatioGauge
            threshold={5}
            label="3. Impure Revenue — Non-Permissible Income / Total Revenue × 100"
            note="Incidental interest and minor prohibited revenue must not exceed 5.00%. Requires dividend purification."
          />
        </div>
      </div>

      {/* ─── Phase 3: Purification ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, var(--text-dark) 100%)',
        borderRadius: '24px', padding: '40px', boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(209, 165, 98, 0.2)',
        position: 'relative', overflow: 'hidden', marginBottom: '24px'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(209, 165, 98, 0.08)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(209, 165, 98, 0.12)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(209, 165, 98, 0.35)' }}>
            <Sparkles size={26} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phase 3</div>
            <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Dividend Purification</h2>
          </div>
        </div>

        <p style={{ lineHeight: 1.8, fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          Even compliant companies often earn trace interest from cash stored in conventional commercial banks. AAOIFI requires investors to <strong style={{ color: 'white' }}>purify</strong> their dividend earnings by donating the exact non-halal fraction to charity.
        </p>
        <p style={{ lineHeight: 1.8, fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', position: 'relative', zIndex: 1, marginBottom: '28px' }}>
          Irshad computes the exact <strong style={{ color: 'white' }}>Purification Rate</strong> (to two decimal places, e.g. 2.00%) for every stock on the NGX — removing guesswork so your returns remain 100% halal.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {[
            { icon: CheckCircle, label: 'Auto-Calculated', sub: 'Per stock dividend distribution' },
            { icon: ShieldCheck, label: 'AAOIFI Standard 21', sub: 'Strict scholar-approved math' },
            { icon: FileText, label: 'Charity Disbursement', sub: 'Track your total due across portfolios' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '18px 20px', backdropFilter: 'blur(4px)' }}>
              <Icon size={20} color="var(--gold)" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 800, color: 'white', fontSize: '0.81rem', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '0.69rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Prohibited Trading Mechanisms ─── */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '36px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '12px' }}>
          Trading Rules under Standard 21
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '20px' }}>
          A stock may be Halal, but how you trade it must also comply with Islamic law:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--non-halal)', marginBottom: '6px' }}>No Short Selling</h4>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Selling unowned borrowed shares (<em>Bay' ma la Yamlik</em>) is strictly prohibited. You may only sell shares you legitimately own.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--non-halal)', marginBottom: '6px' }}>No Margin Leverage</h4>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Trading on borrowed funds with interest charges is prohibited. All equity purchases must be cash-funded.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--non-halal)', marginBottom: '6px' }}>No Options or Derivatives</h4>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Financial options, futures, and synthetic swaps contain excessive uncertainty (<em>Gharar</em>) and speculation.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
  <Footer />
  </>
);

export default ShariahPage;
