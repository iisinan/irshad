import React from 'react';
import { Droplet, Info, BookOpen, HandHeart, AlertCircle } from 'lucide-react';

export default function UpdatesPurification() {
  return (
    <div className="animate-fade-in" style={{ padding: '8px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: 'white',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
          <Droplet size={200} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
              <Droplet size={28} color="white" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Understanding Purification
            </h2>
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Purification (Tathir) is the process of cleansing your investment returns from impermissible (haram) sources. 
            Even in Shariah-compliant companies, a small portion of revenue may come from interest or non-compliant activities.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Why Purify */}
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--primary-50)', padding: '10px', borderRadius: '12px' }}>
              <BookOpen size={20} color="var(--primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Why Do We Purify?</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
            According to the <strong>AAOIFI Shariah Standard No. 21</strong>, it is permissible to invest in companies that are primarily engaged in halal activities but have a small portion of impermissible income (e.g., interest from bank deposits), provided this income does not exceed 5% of total revenue.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            However, any income derived from these impermissible sources must be calculated and given away to charity to "purify" the overall returns.
          </p>
        </div>

        {/* How It's Calculated */}
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--gold-10)', padding: '10px', borderRadius: '12px' }}>
              <Info size={20} color="var(--gold)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>How is it Calculated?</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
            Irshad automates this calculation for you based on the company's latest financial statements. The formula is:
          </p>
          <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>
              Impure Revenue Ratio = (Non-Compliant Revenue) ÷ (Total Revenue)
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            When you receive dividends, we multiply the total dividend amount by the <strong>Impure Revenue Ratio</strong> to determine the exact amount you owe for purification.
          </p>
        </div>

        {/* What To Do With It */}
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <HandHeart size={20} color="#22c55e" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>What Should I Do With Purified Funds?</h3>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              The calculated purification amount must be disbursed to charitable causes (e.g., giving to the poor, disaster relief, or public utility projects).
            </p>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--primary-50)', padding: '16px', borderRadius: '16px', border: '1px solid var(--primary-100)' }}>
              <AlertCircle size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>Important Shariah Ruling</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)', opacity: 0.9, lineHeight: 1.6 }}>
                  When disbursing purified funds, the intention (niyyah) should <strong>not</strong> be to seek religious reward (thawab) for giving charity (Sadaqah), because Allah is pure and only accepts what is pure. The intention must solely be to rid oneself of impermissible wealth.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
