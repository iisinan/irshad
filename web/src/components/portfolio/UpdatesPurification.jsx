import React from 'react';
import { Droplet, Info, BookOpen, HandHeart, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Scale, Sparkles, AlertTriangle, X } from 'lucide-react';

export default function UpdatesPurification() {
  return (
    <div className="animate-fade-in" style={{ padding: '8px 4px', paddingBottom: '40px' }}>
      
      {/* ── 1. Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #3b0764 100%)',
        borderRadius: '32px',
        padding: '40px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(91,41,113,0.25)'
      }}>
        {/* Background Decorative Elements */}
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
          <Droplet size={300} />
        </div>
        <div style={{ position: 'absolute', left: '10%', top: '20%', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.5, boxShadow: '0 0 10px white' }} />
        <div style={{ position: 'absolute', right: '25%', bottom: '15%', width: '6px', height: '6px', background: 'white', borderRadius: '50%', opacity: 0.3, boxShadow: '0 0 15px white' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '100px', marginBottom: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ShieldCheck size={16} color="var(--gold)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.9)' }}>
              AAOIFI Standard No. 21
            </span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 16px 0', letterSpacing: '-1px', lineHeight: 1.1 }}>
            The Essence of <br/><span style={{ color: 'var(--gold)' }}>Wealth Purification</span>
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 400 }}>
            Purification (<em>Tathir</em>) is the spiritual and financial process of cleansing your investment returns from trace amounts of impermissible (haram) income. Even Halal companies occasionally earn interest on cash reserves, and we must cleanse our wealth of it.
          </p>
        </div>
      </div>

      {/* ── 2. The 5% Rule (Grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div style={{ background: 'var(--bg)', borderRadius: '28px', padding: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03 }}>
            <Scale size={180} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}>
              <Scale size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>The 5% Tolerance Rule</h3>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            Islamic scholars (via AAOIFI) recognize that in the modern economy, almost no public company is 100% free from conventional banking. Therefore, it is permissible to invest in a company if its impermissible income (like interest) is <strong>less than 5%</strong> of its total revenue.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-section)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>&gt; 5%</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>If impure revenue exceeds 5%, the stock becomes entirely non-compliant (Haram).</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '28px', padding: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--gold-10)', padding: '12px', borderRadius: '16px', color: 'var(--gold)' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>Common Misconceptions</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px', borderRadius: '50%', marginTop: '2px' }}><X size={14} /></div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>I have to sell the stock if it earns interest.</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>False. As long as the core business is halal and impure income is &lt; 5%, you can keep it. You just purify the dividends.</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px', borderRadius: '50%', marginTop: '2px' }}><X size={14} /></div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>I must purify capital gains.</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>False. According to the majority of scholars, capital gains (profit from selling the stock) do not require purification.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. How Irshad Automates It (Timeline/Process) ── */}
      <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '24px', letterSpacing: '-0.5px', textAlign: 'center' }}>How Irshad Automates This For You</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {[
          { step: 1, title: 'Dividend Declared', desc: 'A company in your portfolio declares a cash dividend payout.', icon: Sparkles },
          { step: 2, title: 'Ratio Calculated', desc: 'Irshad scans their financials to find the exact % of non-compliant revenue.', icon: Calculator },
          { step: 3, title: 'Amount Due', desc: 'We multiply your dividend by the impure ratio to get your exact due amount.', icon: Info },
          { step: 4, title: 'You Donate', desc: 'You click "Purify" in the app and donate the sum to cleanse your wealth.', icon: HandHeart }
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', opacity: 0.5 }}>0{s.step}</div>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <s.icon size={24} />
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>{s.title}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── 4. The Final Step (Shariah Warning) ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.15) 100%)', borderRadius: '32px', padding: '40px', border: '1px solid rgba(34, 197, 94, 0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
          <HandHeart size={200} color="#22c55e" />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#22c55e', padding: '12px', borderRadius: '16px', color: 'white' }}>
              <HandHeart size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>What Should I Do With Purified Funds?</h3>
          </div>
          
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', maxWidth: '800px' }}>
            The calculated purification amount must be disbursed to charitable causes. This can include giving to the poor, disaster relief, supporting orphans, or public utility projects. It cannot be used to pay taxes or for personal benefit.
          </p>

          <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid rgba(34, 197, 94, 0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', maxWidth: '800px' }}>
            <AlertCircle size={32} color="#22c55e" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Crucial Shariah Ruling on Intention (Niyyah)</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                When disbursing purified funds, the intention (niyyah) should <strong>never</strong> be to seek religious reward (thawab) for giving charity (Sadaqah), because Allah is pure and only accepts what is pure. The intention must strictly be to <strong>rid oneself of impermissible wealth</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
