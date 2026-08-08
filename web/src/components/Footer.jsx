import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Globe, ArrowUpRight } from 'lucide-react';

const NAV = [
  {
    title: 'Platform',
    links: [
      { label: 'Market Explorer', to: '/portfolio#market' },
      { label: 'Portfolio Tracker', to: '/portfolio' },
      { label: 'Halal Baskets', to: '/portfolio#market' },
      { label: 'Purification Calc', to: '/portfolio#market' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'Shariah Method', to: '/shariah' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Resources', to: '/resources' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Shariah Standards', to: '/shariah' },
      { label: 'Disclosures', to: '/disclosure' },
    ],
  },
];

const Footer = () => (
  <footer className="site-footer">
    {/* Top shimmer line */}
    <div className="footer-shimmer-line" />

    <div className="footer-inner">
      {/* ── Brand column ── */}
      <div className="footer-brand-col">
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'var(--gold-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.1rem', color: '#1A0E00',
            flexShrink: 0,
          }}>إ</div>
          <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.5px' }}>
            Irshad
          </span>
        </div>

        <p className="footer-desc">
          Nigeria's premier platform for Shariah-compliant stock screening and market analytics on the NGX.
        </p>

        {/* Contact */}
        <a
          href="mailto:hello@iirshad.com"
          className="footer-contact-link"
        >
          <Mail size={15} />
          hello@iirshad.com
        </a>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '28px', flexWrap: 'wrap' }}>
          <span className="footer-badge">
            <Shield size={12} />
            AAOIFI Compliant
          </span>
          <span className="footer-badge">
            <Globe size={12} />
            Nigeria
          </span>
        </div>
      </div>

      {/* ── Nav columns ── */}
      {NAV.map(col => (
        <div key={col.title} className="footer-col">
          <h4>{col.title}</h4>
          <ul>
            {col.links.map(l => (
              <li key={l.label}>
                <Link to={l.to} className="footer-link">
                  {l.label}
                  <ArrowUpRight size={12} className="footer-link-icon" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* Disclaimer */}
    <div className="footer-disclaimer">
      Disclaimer: Irshad provides AAOIFI screening based on publicly available information and audited financial statements. It is intended for informational purposes only and does not constitute financial or investment advice.
    </div>

    {/* Bottom bar */}
    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Irshad Financial Services Ltd. All rights reserved.</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/privacy" className="footer-bottom-link">Privacy</Link>
        <Link to="/terms" className="footer-bottom-link">Terms</Link>
        <Link to="/disclosure" className="footer-bottom-link">Disclosure</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
