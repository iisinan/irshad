import React from 'react';
import { Shield, Target, Users, BookOpen, Sparkles, Globe } from 'lucide-react';
import Footer from './Footer';

const STATS = [
  { num: '2026', label: 'Founded', icon: '🚀' },
  { num: '5,000+', label: 'Active Users', icon: '👥' },
  { num: '150+', label: 'Stocks Screened', icon: '📊' },
];

const VALUES = [
  { icon: Target,   color: 'var(--primary)', bg: 'var(--primary-50)',  border: 'var(--primary-100)', title: 'Direct-Source Accuracy',   desc: 'Every screening is backed by official NGX Pulse filings and audited reports with verifiable timestamps.' },
  { icon: Shield,   color: 'var(--primary)', bg: 'var(--primary-50)',  border: 'var(--primary-100)', title: 'AAOIFI Standard 21', desc: 'Strict application of global Shariah Standard 21 thresholds with zero arbitrary buffer zones.' },
  { icon: Users,    color: '#8b5cf6', bg: '#ede9fe',            border: '#ddd6fe',            title: 'Community First',  desc: 'Engineered specifically for conscious Muslim retail and institutional investors in Nigeria.' },
  { icon: BookOpen, color: '#d97706', bg: 'var(--gold-50)',     border: 'var(--gold-border)', title: 'Dividend Purification',  desc: 'Automated math to isolate and cleanse incidental interest revenue down to two decimal places.' },
];

const AboutPage = () => (
  <>
  <div className="animate-fade-in page-wrapper">
    <div style={{ maxWidth: '940px', margin: '0 auto' }}>

      {/* ─── Hero Header ─── */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div className="section-label" style={{ marginBottom: '16px' }}>About Irshad</div>
        <h1 className="about-hero-h1">
          Empowering Muslim Investors<br />
          <span style={{ color: 'var(--primary)' }}>in Nigeria</span>
        </h1>
        <p style={{ fontSize: '0.97rem', lineHeight: 1.85, color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
          Irshad bridges faith and modern finance through automated, auditable AAOIFI Shariah screening for all Nigerian Exchange (NGX) listed equities.
        </p>
      </div>

      {/* ─── Stats Strip ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        background: 'var(--bg)', borderRadius: '24px', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)', overflow: 'hidden', marginBottom: '48px',
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            padding: '36px', textAlign: 'center',
            borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: '1.76rem', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.94rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Vision + Values ─── */}
      <div className="about-vision-grid" style={{ marginBottom: '48px' }}>
        {/* Vision card */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #131B2A 100%)',
          borderRadius: '24px', padding: '40px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201, 149, 42, 0.2)',
          border: '1px solid rgba(201, 149, 42, 0.15)'
        }}>
          <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(201, 149, 42, 0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', padding: '5px 14px', borderRadius: '40px', marginBottom: '24px', backdropFilter: 'blur(8px)' }}>
              <Globe size={13} color="var(--gold)" />
              <span style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Vision</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '16px', letterSpacing: '-0.5px' }}>Africa's Most Trusted Islamic FinTech</h3>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, marginBottom: '16px', fontSize: '0.88rem' }}>
              To become the standard for Islamic financial technology across Africa, starting with rigorous computational Shariah screening for the Nigerian capital market.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontSize: '0.84rem' }}>
              We eliminate black-box ratings by connecting every compliance verdict directly to audited financial statements, enabling Muslims to invest with absolute certainty.
            </p>
          </div>
        </div>

        {/* Values grid */}
        <div className="about-values-grid">
          {VALUES.map(v => (
            <div key={v.title} style={{
              background: 'var(--bg)', padding: '24px', borderRadius: '18px',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '44px', height: '44px', background: v.bg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${v.border}` }}>
                <v.icon size={22} color={v.color} />
              </div>
              <h4 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', fontSize: '0.88rem' }}>{v.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Methodology & Data Transparency Pillar ─── */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '14px' }}>
          Our Commitment to Shariah & Data Integrity
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>Auditable Filing Evidence</h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              No opaque scores. Every verdict displays the exact reporting period, filing date, and linkable regulatory source document from NGX Pulse.
            </p>
          </div>
          <div style={{ background: 'var(--bg-section)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>Mathematical Precision</h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              Strict enforcement of AAOIFI 30% debt/cash ceilings and 5% impure revenue limits, with precise 2-decimal dividend purification calculations.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Mission CTA ─── */}
      <div style={{
        borderRadius: '24px', padding: '56px 48px', textAlign: 'center',
        background: 'linear-gradient(135deg, #0A192F 0%, #0F3A40 50%, #0B4F55 100%)',
        border: '1.5px solid rgba(201,168,76,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden',
        marginBottom: '40px'
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', padding: '6px 18px', borderRadius: '40px', marginBottom: '24px', backdropFilter: 'blur(8px)' }}>
            <Sparkles size={14} color="var(--gold)" />
            <span style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Mission</span>
          </div>
          <h2 style={{ color: 'white', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Shariah-Compliant Investing,<br />Made Effortless
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.94rem', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            To make Shariah-compliant investing accessible, transparent, and effortless for every Muslim on the Nigerian Exchange — so you can grow your wealth without compromising your faith.
          </p>
        </div>
      </div>

      {/* ─── Scholarly & Independence Notice ─── */}
      <div style={{ padding: '20px 24px', background: 'var(--bg-section)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
          <strong>Independence & Shariah Notice:</strong> Irshad is an independent financial technology platform. We implement computational screening of public regulatory filings according to AAOIFI Shariah Standard No. 21. Irshad is not an official organ of AAOIFI nor a certified financial advisor. Investors are encouraged to consult qualified Shariah scholars for personalized financial rulings.
        </p>
      </div>

    </div>
  </div>
  <Footer />
  </>
);

export default AboutPage;
