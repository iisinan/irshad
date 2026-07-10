import React from 'react';
import { ShieldCheck, FileText, CheckCircle, Scale } from 'lucide-react';

const ShariahPage = () => (
  <div className="animate-fade-in page-wrapper">
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div className="section-label">Our Methodology</div>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 24px', color: 'var(--text-dark)' }}>
          AAOIFI Screening Standards
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.85, color: 'var(--text-muted)' }}>
          Irshad employs the globally recognized standards set by the Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) to ensure your investments remain 100% halal.
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '48px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} color="var(--primary)" /> Phase 1: Business Activity Screen
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '24px' }}>
          Before looking at any financial metrics, we analyze a company's core business activities. A company is immediately marked as <strong>NON-HALAL</strong> if its primary business involves:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            'Conventional Banking & Insurance',
            'Alcohol Production or Sales',
            'Pork & Non-Halal Meat',
            'Gambling & Casinos',
            'Adult Entertainment',
            'Weapons & Defense',
            'Tobacco',
            'Interest-based Lending'
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontWeight: 600 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-halal)' }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '48px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale size={28} color="var(--primary)" /> Phase 2: Financial Ratio Screen
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '32px' }}>
          If a company passes the business screen, we analyze its balance sheet. According to AAOIFI Rule 21, companies must pass three strict financial thresholds. A company is marked <strong>QUESTIONABLE</strong> or <strong>NON-HALAL</strong> if it fails these metrics:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>1. Debt Ratio</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total interest-bearing debt must not exceed <strong>30%</strong> of the 12-month trailing average market capitalization.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
              <CheckCircle size={16} /> Debt / Market Cap &lt; 30%
            </div>
          </div>

          <div style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>2. Liquidity Ratio</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Interest-bearing securities and deposits must not exceed <strong>30%</strong> of the trailing market capitalization.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
              <CheckCircle size={16} /> Cash & Interest Investments / Market Cap &lt; 30%
            </div>
          </div>

          <div style={{ background: 'var(--bg-section)', padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>3. Impermissible Income</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Income generated from impermissible activities (like interest on cash reserves) must not exceed <strong>5%</strong> of total gross revenue.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
              <CheckCircle size={16} /> Non-compliant Income / Total Revenue &lt; 5%
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-xl)', padding: '48px', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} /> Phase 3: Dividend Purification
        </h2>
        <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', marginBottom: '24px' }}>
          Even fully Halal companies often have trace amounts of interest income from cash stored in conventional banks. AAOIFI requires investors to "purify" their earnings by calculating this exact percentage and donating it to charity.
        </p>
        <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)' }}>
          Irshad's platform automatically calculates this <strong>Purification Rate</strong> for every stock on the market, removing the guesswork so your dividends remain 100% clean.
        </p>
      </div>
    </div>
  </div>
);

export default ShariahPage;
