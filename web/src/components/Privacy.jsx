import React from 'react';
import { ShieldCheck, Lock, Eye, Server, Database, CheckCircle, FileText } from 'lucide-react';
import Footer from './Footer';

const PrivacyPage = () => {
  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '80px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="var(--primary)" />
              Privacy & Security
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px', marginBottom: '16px' }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
              Last updated: August 2026. Your financial privacy, portfolio confidentiality, and trust are fundamental to Irshad.
            </p>
          </div>

          {/* Privacy Commitments Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
                <Eye size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Zero Data Selling</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                We will never sell, rent, or monetize your portfolio holdings, watchlist entries, or identity to third-party advertisers or hedge funds.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>End-to-End Encryption</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                All user traffic and database transactions are secured using TLS 1.3 encryption in transit and AES-256 encryption at rest.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>NDPR & GDPR Aligned</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Fully compliant with the Nigeria Data Protection Regulation (NDPR) and international privacy best practices.
              </p>
            </div>
          </div>

          {/* Privacy Policy Detailed Clauses */}
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

            {/* 1. Information We Collect */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>1</span>
                Information We Collect
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                We collect only the minimum necessary information to provide Islamic screening and portfolio tracking services:
              </p>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '24px', margin: 0 }}>
                <li><strong>Account Registration Data:</strong> Name, email address, password hash, and optional phone number.</li>
                <li><strong>User Portfolio & Watchlist Data:</strong> Tickers tracked, custom share quantities, and dividend calculation preferences.</li>
                <li><strong>Mobile App & Device Data:</strong> When you use our Android or iOS applications, we collect device-specific information (such as hardware model, operating system version, unique device identifiers, and crash logs) to ensure app stability and provide troubleshooting support.</li>
                <li><strong>Technical & Usage Logs:</strong> IP address, device operating system, browser type, and interaction timestamps for fraud prevention and performance optimization.</li>
              </ul>
            </div>

            {/* 2. How We Use Your Data */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>2</span>
                How We Use Your Data
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                We process your information exclusively for the following lawful purposes:
              </p>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '24px', margin: 0 }}>
                <li>To calculate your portfolio's Shariah compliance status and dividend purification totals.</li>
                <li>To deliver requested price and compliance status alert notifications.</li>
                <li>To authenticate your identity and protect against unauthorized account takeovers.</li>
                <li>To comply with regulatory audit requirements and security audits.</li>
              </ul>
            </div>

            {/* 3. Data Storage & International Transfers */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>3</span>
                Data Storage, Security & Retention
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Your data is stored in enterprise-grade, encrypted PostgreSQL clusters hosted in ISO 27001 certified data centers. We retain your personal data for as long as your account remains active. If you delete your account, your personal information and portfolio records are completely and permanently purged from active databases within 30 days.
              </p>
            </div>

            {/* 4. Cookies & Tracking Technologies */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>4</span>
                Cookies & Local Storage
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                We use secure browser cookies and local storage tokens strictly for session authentication, theme preferences (light/dark mode), and CSRF token protection. We do not use third-party behavioral cross-site tracking cookies.
              </p>
            </div>

            {/* 5. Your Privacy Rights & Account Deletion */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '8px', fontWeight: 900 }}>5</span>
                Your Privacy Rights & Account Deletion
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '12px' }}>
                Under applicable data protection laws and Google Play's User Data policy, you have the right to manage and delete your data:
              </p>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '24px', margin: 0 }}>
                <li><strong>Account Deletion:</strong> You can permanently delete your account directly from within the Mobile App by navigating to <em>Profile Settings &gt; Delete Account</em>, or by submitting a request to <a href="mailto:privacy@iirshad.com" style={{ color: 'var(--primary)' }}>privacy@iirshad.com</a>.</li>
                <li><strong>Data Erasure:</strong> Upon deletion, all personal information, watchlists, and portfolio records are completely and permanently purged from active databases within 30 days.</li>
                <li><strong>Access and Export:</strong> Request a copy of all personal and financial tracking data we hold about you.</li>
                <li><strong>Opt-out:</strong> Opt out of marketing communications at any time with a single click.</li>
              </ul>
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                To exercise any of your privacy rights or contact our Data Protection Officer, email <a href="mailto:privacy@iirshad.com" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>privacy@iirshad.com</a>.
              </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPage;
