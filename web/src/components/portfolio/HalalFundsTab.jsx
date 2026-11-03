import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Building2, ChevronDown, ChevronUp, Shield, 
  Activity, Droplet, Landmark, ExternalLink, Layers, CheckCircle2, 
  MapPin, Sparkles, Umbrella
} from 'lucide-react';
import { fetchHalalDirectory, fetchNgxStocks } from '../../services/api';

const STATIC_BANKING = [
  {
    id: 'jaiz-bank',
    name: 'Jaiz Bank Plc',
    short_name: 'Jaiz Bank',
    category: 'Banking',
    sub_type: 'Full Commercial Bank',
    regulator: 'Central Bank of Nigeria (CBN)',
    license_type: 'National Non-Interest Banking License',
    deposit_insurance: 'NDIC Insured',
    launched: '2012',
    headquarters: 'Jaiz Bank House, Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
    website: 'https://jaizbankplc.com',
    tagline: 'The Pioneer Non-Interest Bank in Nigeria',
    description: "Nigeria's pioneer full-fledged non-interest (Islamic) commercial bank, providing ethical retail, commercial, corporate banking, trade finance and Sukuk financing across Nigeria.",
    shariah_board: 'Advisory Committee of Experts (ACE) chaired by Dr. Muhammad Bashir',
    key_products: [
      'Qard (Non-interest Current Account)',
      'Mudarabah (Profit-sharing Savings & Term Deposits)',
      'Murabaha (Cost-plus asset & trade financing)',
      'Ijarah (Lease-to-own equipment & vehicle financing)',
      'Istisna\'a (Project & real estate construction financing)',
      'JaizMobile & Digital Banking Services'
    ]
  },
  {
    id: 'lotus-bank',
    name: 'Lotus Bank Limited',
    short_name: 'Lotus Bank',
    category: 'Banking',
    sub_type: 'Commercial Bank',
    regulator: 'Central Bank of Nigeria (CBN)',
    license_type: 'Non-Interest Banking License',
    deposit_insurance: 'NDIC Insured',
    launched: 'July 2021',
    headquarters: '16 Billings Way, Oregun, Ikeja / Victoria Island, Lagos',
    website: 'https://lotusbank.com',
    tagline: 'Ethical, Inclusive & Digitally-Driven Non-Interest Banking',
    description: 'A dynamic non-interest bank dedicated to ethical principles, financial inclusion, digital convenience, and shared prosperity for individuals, SMEs, and corporate entities.',
    shariah_board: 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI & CBN standards',
    key_products: [
      'Lotus Current & Savings Accounts',
      'Lotus Business & SME Financing',
      'Asset Acquisition Finance (Ijarah)',
      'Working Capital & Trade Finance (Murabaha)',
      'Import & Export Ethical Trade Solutions',
      'Lotus Digital Banking Mobile App'
    ]
  },
  {
    id: 'taj-bank',
    name: 'TAJBank Limited',
    short_name: 'Taj Bank',
    category: 'Banking',
    sub_type: 'Full Commercial Bank',
    regulator: 'Central Bank of Nigeria (CBN)',
    license_type: 'National Non-Interest Banking License',
    deposit_insurance: 'NDIC Insured',
    launched: '2019',
    headquarters: 'Plot 72 Ahmadu Bello Way, Central Business District, Abuja',
    website: 'https://tajbank.com',
    tagline: 'Bank with Peace of Mind',
    description: 'Leading non-interest bank recognized for innovative Sukuk issuances, high-yield ethical investments, customer-centric services, and seamless digital banking.',
    shariah_board: 'Advisory Committee of Experts (ACE) overseeing product governance',
    key_products: [
      'TAJ Savings & Current Accounts',
      'Mudarabah Term Deposit Accounts',
      'TAJ Mudarabah Sukuk Series',
      'Auto & Equipment Finance (Ijarah wa Iqtina)',
      'Corporate & SME Working Capital Financing',
      'TAJWay Mobile Banking Application'
    ]
  },
  {
    id: 'summit-bank',
    name: 'Summit Non-Interest Bank',
    short_name: 'Summit Bank',
    category: 'Banking',
    sub_type: 'Non-Interest Commercial Bank',
    regulator: 'Central Bank of Nigeria (CBN)',
    license_type: 'Non-Interest Banking License',
    deposit_insurance: 'NDIC Insured',
    launched: '2023',
    headquarters: 'Abuja / Lagos, Nigeria',
    website: 'https://summitbank.ng',
    tagline: 'Empowering Ethical Financial Growth',
    description: 'Specialized non-interest banking institution focused on financing productive real-sector commerce, small and medium enterprises, and ethical consumer needs.',
    shariah_board: 'Advisory Committee of Experts (ACE) in accordance with CBN regulations',
    key_products: [
      'Ethical Personal Accounts',
      'Commercial & SME Shariah Financing',
      'Agricultural & Commodity Trade Financing',
      'Asset Acquisition & Leasing Facilities',
      'Electronic Payment & Collection Services'
    ]
  },
  {
    id: 'alternative-bank',
    name: 'The Alternative Bank Limited',
    short_name: 'Alternative Bank',
    category: 'Banking',
    sub_type: 'Full Commercial Bank',
    regulator: 'Central Bank of Nigeria (CBN)',
    license_type: 'Non-Interest Commercial Banking License',
    deposit_insurance: 'NDIC Insured',
    launched: '2023',
    headquarters: 'Sterling Towers, 20 Marina, Lagos, Nigeria',
    website: 'https://altbank.ng',
    tagline: 'Banking on Human Flourishing',
    description: 'Evolved from Sterling Alternative Finance into a standalone ethical bank offering transformative Islamic financial solutions, zero-interest consumer e-commerce, and sustainable wealth creation.',
    shariah_board: 'Advisory Committee of Experts (ACE) overseeing all Shariah structures',
    key_products: [
      'AltBank App & Digital Accounts',
      'AltInvest (Shariah-compliant investment marketplace)',
      'AltMall (Zero-interest asset & electronics purchase financing)',
      'Commodity & Real Sector Trade Finance',
      'Corporate Murabaha & Mudarabah Partnerships',
      'Women & SME Ethical Business Support'
    ]
  }
];

const STATIC_TAKAFUL = [
  {
    id: 'jaiz-takaful',
    name: 'Jaiz Takaful Insurance Plc',
    short_name: 'Jaiz Takaful',
    category: 'Takaful',
    sub_type: 'Composite Takaful Operator',
    regulator: 'National Insurance Commission (NAICOM)',
    license_type: 'Full Composite Takaful License',
    operational_model: 'Hybrid Mudarabah & Wakala Model',
    launched: '2016',
    headquarters: 'Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
    website: 'https://jaiztakafulinsurance.com',
    tagline: 'Solidarity and Ethical Protection for All',
    description: 'Premier Takaful operator established to deliver cooperative risk protection based on mutual assistance, social solidarity, and transparent surplus distribution.',
    shariah_board: 'Advisory Committee of Experts (ACE) supervising underwriting & investment pools',
    key_products: [
      'General Takaful: Motor, Fire & Special Perils, Burglary, Marine Cargo',
      'Family Takaful: Group Family Plan, Education Plan, Credit Life Protection',
      'Engineering & Contractors\' All-Risk Takaful',
      'Micro-Takaful for Individuals and Small Businesses',
      'Annual Participant Underwriting Surplus Sharing'
    ]
  },
  {
    id: 'noor-takaful',
    name: 'Noor Takaful Insurance Ltd',
    short_name: 'Noor Takaful',
    category: 'Takaful',
    sub_type: 'Composite Takaful Operator',
    regulator: 'National Insurance Commission (NAICOM)',
    license_type: 'Full Composite Takaful License',
    operational_model: 'Wakala-Waqf Model',
    launched: '2016',
    headquarters: '170 Awolowo Road, Ikoyi / Victoria Island, Lagos',
    website: 'https://noortakaful.ng',
    tagline: 'Your Ethical Financial Security Partner',
    description: "Nigeria's pioneer composite Takaful operator with an established track record of prompt claim settlements and consecutive surplus cash back payments to participants.",
    shariah_board: 'Advisory Council of Experts (ACE) led by prominent international and local scholars',
    key_products: [
      'Family Takaful: Tahfeez Plan, Family Shield, Education Plan, Group Life Takaful',
      'General Takaful: Motor Vehicle, Home Protection, Marine Cargo, Commercial Assets',
      'Travel Takaful: Hajj, Umrah & Worldwide Shariah Travel Protection',
      'Agric & SME Takaful Solutions',
      'Cash Surplus Sharing (Refunds to policyholders)'
    ]
  },
  {
    id: 'crown-takaful',
    name: 'Crown Takaful Insurance Limited',
    short_name: 'Crown Takaful',
    category: 'Takaful',
    sub_type: 'Composite Takaful Operator',
    regulator: 'National Insurance Commission (NAICOM)',
    license_type: 'Composite Takaful Operator License',
    operational_model: 'Wakala & Mudarabah Model',
    launched: 'December 2023',
    headquarters: 'Victoria Island, Lagos, Nigeria',
    website: 'https://crowntakaful.com',
    tagline: 'Redefining Insurance with Dignity & Trust',
    description: 'Modern ethical insurance firm providing forward-thinking General and Family Takaful policies backed by digital underwriting and equitable community risk pooling.',
    shariah_board: 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI governance',
    key_products: [
      'Motor Takaful (Comprehensive & Third Party)',
      'Fire & Industrial Risk Takaful',
      'Family Life Protection & Child Education Takaful',
      'Marine Cargo & Aviation Takaful Coverage',
      'Community Participant Surplus Fund'
    ]
  },
  {
    id: 'hilal-takaful',
    name: 'Hilal Takaful Nigeria Limited',
    short_name: 'Hilal Takaful',
    category: 'Takaful',
    sub_type: 'Composite Takaful Operator',
    regulator: 'National Insurance Commission (NAICOM)',
    license_type: 'Composite Takaful Operator License',
    operational_model: 'Mudarabah & Wakala Model',
    launched: '2020',
    headquarters: '21 Water Corporation Drive, Victoria Island, Lagos',
    website: 'https://hilaltakafulng.com',
    tagline: 'The Crescent of Ethical Security',
    description: 'A premier subsidiary of Cornerstone Insurance Plc providing specialized Shariah-compliant risk mitigation and family financial planning across Nigeria.',
    shariah_board: 'Advisory Committee of Experts (ACE)',
    key_products: [
      'Hilal Education Takaful Plan',
      'Hilal Golden Family Plan (Savings & Life Cover)',
      'Hilal Motor & Commercial Vehicle Takaful',
      'Property, Fire & Burglary Takaful Protection',
      'Travel & Medical Takaful Plans'
    ]
  },
  {
    id: 'salam-takaful',
    name: 'Salam Takaful Insurance Limited',
    short_name: 'Salam Takaful',
    category: 'Takaful',
    sub_type: 'Composite Takaful Operator',
    regulator: 'National Insurance Commission (NAICOM)',
    license_type: 'Composite Takaful Operator License',
    operational_model: 'Wakala & Mudarabah Model',
    launched: '2019',
    headquarters: 'Kano / Abuja, Nigeria',
    website: 'https://salamtakaful.com',
    tagline: 'Peace of Mind through Islamic Solidarity',
    description: 'Northern Nigeria-rooted composite Takaful operator offering grassroots and corporate non-interest insurance, agricultural safety nets, and cooperative family security.',
    shariah_board: 'Advisory Committee of Experts (ACE) monitoring all Tabarru\' allocations',
    key_products: [
      'Family Takaful: Education Support, Individual Family Term, Group Life',
      'General Takaful: Motor, Agribusiness & Livestock, Fire, Marine',
      'Micro-Takaful for Smallholder Farmers and Traders',
      'Public Liability & Personal Accident Coverage',
      'Participant Surplus Distribution'
    ]
  }
];

const FUND_TYPE_CONFIG = {
  'Fixed Income': { bg: 'var(--primary-50)',   color: 'var(--primary)',  label: 'Fixed Income' },
  'Balanced':     { bg: 'var(--halal-bg)',      color: 'var(--halal)',    label: 'Balanced' },
  'Equity':       { bg: 'var(--primary-100)',   color: 'var(--primary)',  label: 'Equity' },
  'ETF':          { bg: 'var(--gold-50)',        color: 'var(--accent)',   label: 'ETF' },
  'Endowment':    { bg: 'var(--gold-100)',       color: 'var(--accent)',   label: 'Endowment' },
  'Commodities':  { bg: 'var(--gold-50)',        color: 'var(--accent)',   label: 'Commodities' },
  'Ethical':      { bg: 'var(--halal-bg)',       color: 'var(--halal)',    label: 'Ethical' },
};

const ALL_FUND_TYPES = ['All Types', ...Object.keys(FUND_TYPE_CONFIG)];

function FundCard({ fund }) {
  const [expanded, setExpanded] = useState(false);
  const typeStr = fund.sector || 'Balanced';
  const type = FUND_TYPE_CONFIG[typeStr] || FUND_TYPE_CONFIG['Balanced'];
  const fd = fund.fund_details || {};
  const hasMeta = fd.trustee || fd.custodian;
  const history = fd.purification_history || [];

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: type.color }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: type.bg, color: type.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
        }}>
          {fund.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {fund.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: type.bg, color: type.color,
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {type.label}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-section)', color: 'var(--text-muted)',
              fontSize: '0.65rem', fontWeight: 700
            }}>
              SEC Registered
            </span>
            {fd.launched && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> Est. {fd.launched}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building2 size={13} color="var(--text-muted)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fd.provider || 'N/A'}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      <p style={{
        fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
        display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {fd.investment_components_target || 'No strategy details provided.'}
      </p>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="#3b82f6" /> Asset Mix
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {fd.asset_mix || 'Not available.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplet size={13} color="var(--doubtful, #eab308)" /> Purification Details
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {fd.purification_note || 'Not disclosed.'}
            </p>
            {history.length > 0 && (
              <div style={{ marginTop: '8px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-section)' }}>
                      <th style={{ padding: '6px 10px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Year</th>
                      <th style={{ padding: '6px 10px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Per Unit (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.year} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{h.year}</td>
                        <td style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--doubtful, #eab308)' }}>₦{Number(h.per_unit).toFixed(5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {hasMeta && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {fd.trustee && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  <Shield size={10} />
                  <span style={{ opacity: 0.7 }}>Trustee:</span> {fd.trustee}
                </span>
              )}
              {fd.custodian && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  <Building2 size={10} />
                  <span style={{ opacity: 0.7 }}>Custodian:</span> {fd.custodian}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
          width: 'fit-content', marginTop: '4px'
        }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Show less' : 'Show full details'}
      </button>
    </div>
  );
}

function BankCard({ bank }) {
  const [expanded, setExpanded] = useState(false);
  const themeColor = '#059669'; // Emerald bank theme
  const themeBg = 'rgba(5, 150, 105, 0.08)';

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: themeColor }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: themeBg, color: themeColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1.2rem', flexShrink: 0
        }}>
          <Landmark size={20} color={themeColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {bank.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: themeBg, color: themeColor,
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {bank.sub_type}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', color: '#2563eb',
              fontSize: '0.65rem', fontWeight: 800
            }}>
              CBN Licensed
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-section)', color: 'var(--text-muted)',
              fontSize: '0.65rem', fontWeight: 700
            }}>
              {bank.deposit_insurance}
            </span>
            {bank.launched && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> Est. {bank.launched}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} color="var(--text-muted)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{bank.headquarters}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      <p style={{
        fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
        display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {bank.description}
      </p>

      {/* Key Products Preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {bank.key_products.slice(0, expanded ? undefined : 3).map((prod, idx) => (
          <span key={idx} style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
            background: 'var(--bg-section)', color: 'var(--text-dark)', border: '1px solid var(--border)'
          }}>
            {prod}
          </span>
        ))}
        {!expanded && bank.key_products.length > 3 && (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: themeColor, padding: '3px 6px' }}>
            +{bank.key_products.length - 3} more
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} color={themeColor} /> Shariah Governance
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {bank.shariah_board}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#2563eb" /> License &amp; Safety
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {bank.license_type} • Regulated by the {bank.regulator} • Deposits secured by the NDIC.
            </p>
          </div>

          {bank.website && (
            <a
              href={bank.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                background: themeBg, color: themeColor,
                fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none',
                width: 'fit-content', border: `1px solid ${themeColor}33`,
                transition: 'all 0.2s ease', marginTop: '4px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Visit Official Website <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700, color: themeColor,
          width: 'fit-content', marginTop: '4px'
        }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Show less' : 'Show full details'}
      </button>
    </div>
  );
}

function TakafulCard({ takaful }) {
  const [expanded, setExpanded] = useState(false);
  const themeColor = '#7c3aed'; // Violet / Royal Purple Takaful theme
  const themeBg = 'rgba(124, 58, 237, 0.08)';

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: themeColor }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: themeBg, color: themeColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1.2rem', flexShrink: 0
        }}>
          <Umbrella size={20} color={themeColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {takaful.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: themeBg, color: themeColor,
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {takaful.sub_type}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.1)', color: '#d97706',
              fontSize: '0.65rem', fontWeight: 800
            }}>
              NAICOM Licensed
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.08)', color: 'var(--halal)',
              fontSize: '0.65rem', fontWeight: 800
            }}>
              Surplus Sharing
            </span>
            {takaful.launched && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> Est. {takaful.launched}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} color="var(--text-muted)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{takaful.headquarters}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      <p style={{
        fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
        display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {takaful.description}
      </p>

      {/* Operational model badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Model:</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: themeColor, background: themeBg, padding: '2px 8px', borderRadius: '6px' }}>
          {takaful.operational_model}
        </span>
      </div>

      {/* Key Products Preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {takaful.key_products.slice(0, expanded ? undefined : 3).map((prod, idx) => (
          <span key={idx} style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
            background: 'var(--bg-section)', color: 'var(--text-dark)', border: '1px solid var(--border)'
          }}>
            {prod}
          </span>
        ))}
        {!expanded && takaful.key_products.length > 3 && (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: themeColor, padding: '3px 6px' }}>
            +{takaful.key_products.length - 3} more
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} color={themeColor} /> Shariah Supervisory Board
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {takaful.shariah_board}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#d97706" /> Surplus Sharing Mechanism
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Under the Shariah cooperative model, any underwriting surplus remaining in the Tabarru' (mutual assistance) fund after claims &amp; reserves is distributed back to eligible participants.
            </p>
          </div>

          {takaful.website && (
            <a
              href={takaful.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                background: themeBg, color: themeColor,
                fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none',
                width: 'fit-content', border: `1px solid ${themeColor}33`,
                transition: 'all 0.2s ease', marginTop: '4px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Visit Official Website <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700, color: themeColor,
          width: 'fit-content', marginTop: '4px'
        }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Show less' : 'Show full details'}
      </button>
    </div>
  );
}

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');
  const [activeGrouping, setActiveGrouping] = useState('all'); // 'all' | 'funds' | 'banking' | 'takaful'
  const [activeFundType, setActiveFundType] = useState('All Types');
  
  const [funds, setFunds] = useState([]);
  const [banking, setBanking] = useState(STATIC_BANKING);
  const [takaful, setTakaful] = useState(STATIC_TAKAFUL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Attempt to fetch unified directory from API
    fetchHalalDirectory()
      .then(res => {
        if (res) {
          if (Array.isArray(res.funds) && res.funds.length > 0) {
            setFunds(res.funds);
          }
          if (Array.isArray(res.banking) && res.banking.length > 0) {
            setBanking(res.banking);
          }
          if (Array.isArray(res.takaful) && res.takaful.length > 0) {
            setTakaful(res.takaful);
          }
          setLoading(false);
          return;
        }
        // Fallback to fetchNgxStocks if directory endpoint isn't ready
        return fetchNgxStocks().then(stockRes => {
          const data = stockRes?.data || [];
          const mutualFunds = data.filter(s => s.asset_class === 'mutual_fund');
          setFunds(mutualFunds);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error('Error fetching directory data:', err);
        // Fallback to fetchNgxStocks
        fetchNgxStocks()
          .then(stockRes => {
            const data = stockRes?.data || [];
            const mutualFunds = data.filter(s => s.asset_class === 'mutual_fund');
            setFunds(mutualFunds);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, []);

  // Filtered lists
  const filteredFunds = funds.filter(f => {
    const q = search.toLowerCase();
    const provider = f.fund_details?.provider || '';
    const desc = f.fund_details?.investment_components_target || '';
    const matchSearch = !q || f.name.toLowerCase().includes(q) || provider.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    const matchType = activeFundType === 'All Types' || f.sector === activeFundType;
    return matchSearch && matchType;
  });

  const filteredBanking = banking.filter(b => {
    const q = search.toLowerCase();
    const name = b.name.toLowerCase();
    const tagline = (b.tagline || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const hq = (b.headquarters || '').toLowerCase();
    const products = (b.key_products || []).join(' ').toLowerCase();
    return !q || name.includes(q) || tagline.includes(q) || desc.includes(q) || hq.includes(q) || products.includes(q);
  });

  const filteredTakaful = takaful.filter(t => {
    const q = search.toLowerCase();
    const name = t.name.toLowerCase();
    const tagline = (t.tagline || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const hq = (t.headquarters || '').toLowerCase();
    const products = (t.key_products || []).join(' ').toLowerCase();
    return !q || name.includes(q) || tagline.includes(q) || desc.includes(q) || hq.includes(q) || products.includes(q);
  });

  const totalCount = funds.length + banking.length + takaful.length;
  const filteredTotal = (activeGrouping === 'all' ? filteredFunds.length + filteredBanking.length + filteredTakaful.length :
    activeGrouping === 'funds' ? filteredFunds.length :
    activeGrouping === 'banking' ? filteredBanking.length : filteredTakaful.length);

  const GROUPINGS = [
    { id: 'all', label: 'All', count: totalCount, icon: Layers },
    { id: 'funds', label: 'Ethical Funds', count: funds.length, icon: Activity },
    { id: 'banking', label: 'Banking', count: banking.length, icon: Landmark },
    { id: 'takaful', label: 'Takaful', count: takaful.length, icon: Umbrella },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>
            Halal Directory
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Comprehensive directory of Shariah-compliant mutual funds, non-interest banks &amp; Takaful operators in Nigeria
          </p>
        </div>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '300px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search funds, banks, takaful..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: '12px',
              border: '1px solid var(--border-strong)', background: 'var(--bg)',
              fontSize: '0.83rem', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Main Grouping Switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-section)',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        gap: '6px',
        overflowX: 'auto',
        maxWidth: '100%',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {GROUPINGS.map(g => {
          const isActive = activeGrouping === g.id;
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGrouping(g.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                background: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Icon size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>{g.label}</span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '8px',
                background: isActive ? 'var(--primary-10)' : 'var(--border)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {g.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-type filter pills (Visible when in 'funds' grouping or in 'all' when searching funds) */}
      {(activeGrouping === 'funds' || activeGrouping === 'all') && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Fund Types:
          </span>
          {ALL_FUND_TYPES.map(type => {
            const cfg = FUND_TYPE_CONFIG[type];
            const isActive = activeFundType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveFundType(type)}
                style={{
                  padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '0.74rem', fontWeight: 700, border: '1.5px solid',
                  transition: 'all 0.15s',
                  borderColor: isActive ? (cfg ? cfg.color : 'var(--primary)') : 'var(--border)',
                  background: isActive ? (cfg ? cfg.bg : 'var(--primary-50)') : 'transparent',
                  color: isActive ? (cfg ? cfg.color : 'var(--primary)') : 'var(--text-muted)',
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}

      {/* Result feedback */}
      {(search || activeFundType !== 'All Types' || activeGrouping !== 'all') && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {filteredTotal} {filteredTotal === 1 ? 'entry' : 'entries'} found
        </p>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading directory...
        </div>
      ) : filteredTotal === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            No directory entries found for "{search}"
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION: BANKING */}
          {(activeGrouping === 'all' || activeGrouping === 'banking') && filteredBanking.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} color="#059669" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                  Islamic Banking &amp; Non-Interest Financial Institutions
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 800 }}>
                  {filteredBanking.length} Licensed Banks
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                {filteredBanking.map(bank => (
                  <BankCard key={bank.id} bank={bank} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION: TAKAFUL */}
          {(activeGrouping === 'all' || activeGrouping === 'takaful') && filteredTakaful.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Umbrella size={18} color="#7c3aed" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                  Takaful (Islamic Insurance) Operators
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontWeight: 800 }}>
                  {filteredTakaful.length} Composite Operators
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                {filteredTakaful.map(tak => (
                  <TakafulCard key={tak.id} takaful={tak} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION: ETHICAL FUNDS */}
          {(activeGrouping === 'all' || activeGrouping === 'funds') && filteredFunds.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                  Ethical Mutual Funds &amp; ETFs
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--primary-10)', color: 'var(--primary)', fontWeight: 800 }}>
                  {filteredFunds.length} SEC-Approved Funds
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                {filteredFunds.map((fund, i) => (
                  <FundCard key={fund.id || i} fund={fund} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
