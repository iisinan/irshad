import React from 'react';
import { FileText, Shield, AlertTriangle, Scale, Lock, CheckCircle } from 'lucide-react';
import Footer from './Footer';

const TermsPage = () => {
  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} color="var(--primary)" />
              Legal & Compliance
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px', marginBottom: '16px' }}>
              Terms of Service
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
              Last updated: August 2026. Please read these terms carefully before accessing or using Irshad's Islamic financial analytics platform.
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div style={{
            background: 'var(--bg-section)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <Shield size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px 0' }}>
                Summary of Key Terms
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Irshad provides automated Shariah screening tools based on AAOIFI Standard No. 21 and audited regulatory data from the Nigerian Exchange (NGX). <strong>Irshad is not an investment advisor or broker-dealer.</strong> All content is provided for informational and religious screening purposes.
              </p>
            </div>
          </div>

          {/* Document Content */}
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

            {/* Section 1 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>1</span>
                Acceptance of Terms
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                By accessing, registering for, or using the Irshad platform (web, mobile, API, or email notifications), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service. If you do not agree to all terms, you must immediately discontinue use of the platform.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>2</span>
                Nature of the Service & No Financial Advice
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                Irshad is an Islamic financial technology information service. We extract public corporate disclosures from Nigerian Exchange (NGX) listed companies and apply computational screening logic in accordance with Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) Shariah Standard No. 21.
              </p>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6 }}>
                  <strong>Important Regulatory Disclaimer:</strong> Irshad does NOT offer investment recommendations, portfolio management, stock broking, or personalized financial advice. You are solely responsible for evaluating the risks and merits associated with the use of any information provided.
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>3</span>
                Shariah Compliance Methodology & Scope
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                Irshad screens companies against two primary stages:
              </p>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '24px', margin: 0 }}>
                <li><strong>Stage 1 (Business Activities):</strong> Excludes businesses primarily involved in conventional finance, alcohol, pork, gambling, adult media, and weapons.</li>
                <li><strong>Stage 2 (Financial Ratios):</strong> Enforces the 30% Debt/Market Cap, 30% Cash/Market Cap, and 5% Impure Revenue thresholds based on latest public filings.</li>
              </ul>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginTop: '12px' }}>
                While our algorithms strictly mirror AAOIFI guidelines, Islamic scholars may differ on specific edge cases (such as preferred share treatment or market cap averaging). Users are encouraged to consult their personal scholars for specific fatwas.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>4</span>
                User Accounts & Security
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                When creating an account, you must provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account. You agree to notify us immediately of any unauthorized use.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>5</span>
                Subscription, Billing & Refunds
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Certain premium features (e.g., automated portfolio dividend purification tracking, advanced alerts, full historical screening exports) require a paid subscription. Subscriptions renew automatically at the specified interval unless cancelled prior to the renewal date. Payments are billed in Nigerian Naira (NGN) or USD and are non-refundable except where required by law.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>6</span>
                Intellectual Property
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                The Irshad name, logo, algorithm implementations, purification engine, user interface design, and aggregated screening database are the exclusive intellectual property of Irshad Financial Services Ltd. You may not scrape, redistribute, or reverse engineer any portion of the service without express written permission.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>7</span>
                Limitation of Liability
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                To the fullest extent permitted by Nigerian and international law, Irshad and its affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from investment decisions, market price fluctuations, delays in corporate filing releases, or temporary platform outages.
              </p>
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Questions regarding our terms? Contact our compliance department at <a href="mailto:legal@iirshad.com" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>legal@iirshad.com</a>.
              </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
