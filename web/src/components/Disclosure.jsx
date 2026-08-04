import React from 'react';
import { AlertOctagon, TrendingDown, Info, ShieldAlert, FileSearch, HelpCircle, ExternalLink, CheckCircle } from 'lucide-react';
import Footer from './Footer';

const DisclosurePage = () => {
  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AlertOctagon size={14} color="var(--primary)" />
              Transparency & Risk
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px', marginBottom: '16px' }}>
              General Disclosures & Risk Notice
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
              Crucial information regarding financial risks, data sources, calculation methodologies, and Islamic jurisprudential considerations.
            </p>
          </div>

          {/* Callout Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '18px', padding: '24px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#d97706' }}>
                <TrendingDown size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', marginBottom: '6px' }}>Capital Risk</h3>
              <p style={{ fontSize: '0.8rem', color: '#b45309', lineHeight: 1.6, margin: 0 }}>
                Stock investing involves the risk of loss of capital. Shariah compliance screening does not guarantee investment profitability or shield against market losses.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
                <FileSearch size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Data Latency</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Financial ratios are calculated from quarterly/annual NGX filings. Changes in market cap or inter-quarter debt shifts may alter compliance between reports.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Scholarly Differences</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                While AAOIFI Standard No. 21 is a premier global standard, other standards (FTSE, MSCI, S&P, DJIM) use slightly different denominator metrics.
              </p>
            </div>
          </div>

          {/* Detailed Disclosures */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '40px 48px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px'
          }}>

            {/* 1. Regulatory Non-Advisory Status */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>1</span>
                Regulatory Non-Advisory Status
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Irshad Financial Services Ltd is a financial data and Shariah technology provider. Irshad is <strong>not registered as an Investment Adviser, Broker-Dealer, Portfolio Manager, or Rating Agency</strong> with the Securities and Exchange Commission (SEC) Nigeria or any international securities authority. None of the content, ratings, scores, or lists constitutes a solicitation, recommendation, endorsement, or offer to buy or sell any security.
              </p>
            </div>

            {/* 2. AAOIFI Screening Framework & Denominator Methodology */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>2</span>
                AAOIFI Standard No. 21 Implementation Specifics
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                Under AAOIFI Shariah Standard No. 21 (Investment in Shares), financial ratios are benchmarked against <strong>Total Market Capitalization</strong> (or 12-month average market cap). Specifically:
              </p>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '24px', margin: 0 }}>
                <li><strong>Interest-Bearing Debt Ratio:</strong> Total conventional interest-bearing borrowings ÷ Total Market Capitalization must remain below <strong>30%</strong>.</li>
                <li><strong>Interest-Bearing Deposits Ratio:</strong> Total cash and short-term interest-earning deposits ÷ Total Market Capitalization must remain below <strong>30%</strong>.</li>
                <li><strong>Prohibited / Impure Revenue Ratio:</strong> Total non-permissible interest income or non-compliant subsidiary revenue ÷ Total Revenue must remain below <strong>5%</strong>.</li>
              </ul>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginTop: '12px' }}>
                Please note that standard FTSE or SEC Nigeria Shariah indices may use <em>Total Assets</em> as the denominator rather than <em>Market Capitalization</em>. Consequently, compliance outcomes may vary across differing benchmark providers.
              </p>
            </div>

            {/* 3. Dividend Purification Methodology */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>3</span>
                Dividend Purification Calculation & Obligation
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                When a company with compliant primary activities earns minor non-compliant revenue (e.g. interest on short-term treasury deposits &lt; 5%), the investor is religiously required under AAOIFI Rule 3/4/2 to <strong>purify</strong> that percentage from received dividends by donating it to charitable causes without expecting spiritual reward (*thawab*). Irshad calculates this exact ratio per share; however, the execution of dividend cleansing remains the personal religious obligation of the individual shareholder.
              </p>
            </div>

            {/* 4. Financial Data Verification & Source Traceability */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>4</span>
                Financial Data Verification & Source Traceability
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Irshad’s financial ratios are derived from officially published corporate financial statements submitted to the Nigerian Exchange (NGX) via NGX Issuers' Portal. While every effort is made to maintain complete fidelity and verify mathematical computations against audited balance sheets, corporate disclosures may contain restatements or errors originating with the reporting entity. Every stock on Irshad features a direct link to its source filing for independent verification.
              </p>
            </div>

            {/* 5. User Responsibility */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>5</span>
                Independent Financial & Legal Advice
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Before executing any transaction, users must evaluate their financial situation, risk tolerance, and investment horizon, and should seek counsel from an authorized financial adviser licensed by the Securities and Exchange Commission (SEC) of Nigeria, as well as a qualified Islamic scholar regarding specific religious questions.
              </p>
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                For questions regarding these disclosures or our algorithmic calculations, please contact our research desk at <a href="mailto:research@iirshad.com" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>research@iirshad.com</a>.
              </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DisclosurePage;
