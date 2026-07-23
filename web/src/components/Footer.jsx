import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="footer-logo-area">
          <img
            src="/logo.svg"
            alt="Irshad"
            style={{
              height: '48px',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.95,
            }}
          />
        </div>
        <p className="footer-desc">
          The premier platform for Shariah-compliant stock screening and market analytics on the Nigerian Exchange.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <a href="mailto:hello@irshad.com" style={{ color: '#9CA3AF', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
            <Mail size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Contact Us</span>
          </a>
        </div>
      </div>

      <div className="footer-col">
        <h4>Platform</h4>
        <ul>
          <li><Link to="/portfolio#market">Market Explorer</Link></li>
          <li><Link to="/portfolio">Portfolio Tracker</Link></li>
          <li><Link to="/portfolio#market">Halal Baskets</Link></li>
          <li><Link to="/portfolio#market">Purification Calc</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Company</h4>
        <ul>
          <li><Link to="/about">Our Story</Link></li>
          <li><Link to="/shariah">Shariah Method</Link></li>
          <li><Link to="/portfolio#market">Pricing</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><Link to="/terms">Terms of Service</Link></li>
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/shariah">Shariah Standards</Link></li>
          <li><Link to="/disclosure">Disclosures</Link></li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <span style={{ fontSize: '0.75rem' }}>© {new Date().getFullYear()} Irshad Financial Services Ltd. All rights reserved.</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, color: 'var(--gold)' }}>
          AAOIFI Compliant
        </span>
        <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700 }}>
          Nigeria
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
