import React from 'react';
import { Shield, Target, Users, BookOpen, Sparkles, Globe, Award } from 'lucide-react';

const STATS = [
  { num: '2023', label: 'Founded', icon: '🚀' },
  { num: '5,000+', label: 'Active Users', icon: '👥' },
  { num: '150+', label: 'Stocks Screened', icon: '📊' },
];

const VALUES = [
  { icon: Target,   color: '#0F5257', bg: 'var(--primary-50)',  border: 'var(--primary-100)', title: 'Accuracy',   desc: 'Strict AAOIFI standards applied to every single stock automatically.' },
  { icon: Shield,   color: '#0F5257', bg: 'var(--primary-50)',  border: 'var(--primary-100)', title: 'Trust',      desc: 'Scholar-backed methodology, transparent and auditable at every step.' },
  { icon: Users,    color: '#8b5cf6', bg: '#ede9fe',            border: '#ddd6fe',            title: 'Community',  desc: 'Built specifically for the Nigerian Muslim investor community.' },
  { icon: BookOpen, color: '#d97706', bg: 'var(--gold-50)',     border: 'var(--gold-border)', title: 'Education',  desc: 'Financial literacy tools that help you invest with full understanding.' },
];

const AboutPage = () => (
  <div className="animate-fade-in page-wrapper">
    <div style={{ maxWidth: '940px', margin: '0 auto' }}>

      {/* ─── Hero Header ─── */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div className="section-label" style={{ marginBottom: '16px' }}>About Irshad</div>
        <h1 className="about-hero-h1">
          Empowering Muslim Investors<br />
          <span style={{ color: 'var(--primary)' }}>in Nigeria</span>
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.85, color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
          Irshad was founded to solve a critical problem: the complete lack of transparent, accessible, and automated Shariah compliance data for the local stock market.
        </p>
      </div>

      {/* ─── Stats Strip ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        background: 'white', borderRadius: '24px', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)', overflow: 'hidden', marginBottom: '48px',
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            padding: '36px', textAlign: 'center',
            borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Vision + Values ─── */}
      <div className="about-vision-grid" style={{ marginBottom: '48px' }}>
        {/* Vision card */}
        <div style={{
          background: 'linear-gradient(145deg, #0F5257 0%, #0D1B2A 100%)',
          borderRadius: '24px', padding: '40px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', padding: '5px 14px', borderRadius: '40px', marginBottom: '24px' }}>
              <Globe size={13} color="var(--gold)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Vision</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '16px', letterSpacing: '-0.5px' }}>Africa's Most Trusted Islamic FinTech</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: '16px', fontSize: '0.97rem' }}>
              To become the most trusted Islamic financial technology platform in Africa, starting with the Nigerian equities market.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontSize: '0.92rem' }}>
              We believe growing wealth and adhering to one's faith should not be mutually exclusive. Our platform provides the clarity needed to invest confidently.
            </p>
          </div>
        </div>

        {/* Values grid */}
        <div className="about-values-grid">
          {VALUES.map(v => (
            <div key={v.title} style={{
              background: 'white', padding: '24px', borderRadius: '18px',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '44px', height: '44px', background: v.bg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${v.border}` }}>
                <v.icon size={22} color={v.color} />
              </div>
              <h4 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', fontSize: '1rem' }}>{v.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Mission CTA ─── */}
      <div style={{
        borderRadius: '24px', padding: '56px 48px', textAlign: 'center',
        background: '#1A1208',
        boxShadow: '0 16px 48px rgba(201,168,76,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', background: 'rgba(201,168,76,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', padding: '6px 18px', borderRadius: '40px', marginBottom: '24px' }}>
            <Sparkles size={14} color="var(--gold)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Mission</span>
          </div>
          <h2 style={{ color: 'white', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Shariah-Compliant Investing,<br />Made Effortless
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            To make Shariah-compliant investing accessible, transparent, and effortless for every Muslim on the Nigerian Exchange — so you can grow your wealth without compromising your faith.
          </p>
        </div>
      </div>

    </div>
  </div>
);

export default AboutPage;
