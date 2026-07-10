import React from 'react';
import { Shield, Target, Users, BookOpen } from 'lucide-react';

const AboutPage = () => (
  <div className="animate-fade-in page-wrapper">
    {/* Header */}
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' }}>
      <div className="section-label">About Irshad</div>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 24px', color: 'var(--text-dark)' }}>
        Empowering Muslim Investors in Nigeria
      </h1>
      <p style={{ fontSize: '1.15rem', lineHeight: 1.85, color: 'var(--text-muted)' }}>
        Irshad was founded to solve a critical problem: the complete lack of transparent, accessible, and automated Shariah compliance data for the local stock market. We bridge the gap between modern investing and Islamic principles.
      </p>
    </div>

    {/* Vision Section */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', marginBottom: '80px' }}>
      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
        position: 'relative', overflow: 'hidden'
      }}>
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: '-40px', right: '-40px',
            width: '200px', opacity: 0.05, filter: 'saturate(0)'
          }}
        />
        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-dark)' }}>Our Vision</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
          To become the most trusted Islamic financial technology platform in Africa, starting with the Nigerian equities market.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          We believe that growing wealth and adhering to one's faith should not be mutually exclusive. Our platform provides the clarity needed to invest confidently.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[
          { icon: <Target size={24} />, title: 'Accuracy', desc: 'Strict AAOIFI standards' },
          { icon: <Shield size={24} />, title: 'Trust', desc: 'Scholar-backed methodology' },
          { icon: <Users size={24} />, title: 'Community', desc: 'Built for the Ummah' },
          { icon: <BookOpen size={24} />, title: 'Education', desc: 'Financial literacy' },
        ].map(val => (
          <div key={val.title} style={{ background: 'var(--bg-alt)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}>{val.icon}</div>
            <h4 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>{val.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{val.desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '80px' }}>
      {[
        { num: '2023', label: 'Founded' },
        { num: '5,000+', label: 'Active Users' },
        { num: '150+', label: 'Stocks Screened' },
      ].map(item => (
        <div key={item.label} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '8px' }}>{item.num}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default AboutPage;
