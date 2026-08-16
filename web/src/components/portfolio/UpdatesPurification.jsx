import React, { useState } from 'react';
import {
  Droplet, HandHeart, AlertCircle, ShieldCheck, Scale,
  Sparkles, AlertTriangle, X, Calculator, ChevronDown, ChevronUp,
  Heart, CheckCircle2, Landmark, Coins, BarChart2, BookOpen, Quote
} from 'lucide-react';

/* ──────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────── */
const SectionHeading = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
    <div style={{
      width: '5px', height: '36px', borderRadius: '6px',
      background: 'linear-gradient(180deg, var(--primary), var(--gold))'
    }} />
    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
      {children}
    </h3>
  </div>
);

const InfoCard = ({ icon: Icon, iconColor, iconBg, title, children }) => (
  <div style={{
    background: 'var(--bg)',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid var(--border)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ background: iconBg, padding: '11px', borderRadius: '14px', flexShrink: 0 }}>
        <Icon size={22} color={iconColor} />
      </div>
      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.3 }}>
        {title}
      </h4>
    </div>
    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
      {children}
    </p>
  </div>
);

const FAQ_ITEMS = [
  {
    q: 'Do I need to purify capital gains when I sell a stock?',
    a: 'No. According to the majority of contemporary scholars, capital gains — profit earned from selling shares at a higher price — do not require purification. Only dividends need to be cleansed, since they are a direct distribution of the company\'s earnings which may include trace impure income.'
  },
  {
    q: 'Do I have to sell a stock because it earns some interest?',
    a: 'No. As long as the core business is halal and the impermissible income (e.g., interest on bank deposits) is below 5% of total revenue, you may continue to hold the stock. Your obligation is simply to purify the corresponding portion of any dividends you receive.'
  },
  {
    q: 'What if I forgot to purify for a previous year?',
    a: 'You should purify retroactively as soon as you become aware. The obligation does not expire. Calculate the impure portion of all dividends received during that period and donate that amount at your earliest convenience without delay.'
  },
  {
    q: 'Can I donate purified funds to my local masjid?',
    a: 'Most scholars permit giving to mosques for operational costs (utilities, maintenance), but not for construction. The safest scholarly opinion is to direct purification funds to the poor and needy, or general public welfare causes, and not to personal or family benefit.'
  },
  {
    q: 'Is purification the same as Zakat?',
    a: 'No. Zakat is a mandatory pillar of Islam with its own nisab threshold and immense spiritual reward. Purification (Tathir) is a separate obligation specifically to remove impermissible wealth from your hands — it carries no spiritual reward (thawab) and should not be confused with Sadaqah either.'
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        border: '1px solid',
        borderColor: open ? 'var(--primary-100)' : 'var(--border)',
        borderRadius: '18px',
        overflow: 'hidden',
        background: open ? 'var(--primary-50)' : 'var(--bg)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 24px', gap: '16px'
      }}>
        <span style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--text-dark)', flex: 1, lineHeight: 1.45 }}>
          {q}
        </span>
        <div style={{
          color: open ? 'var(--primary)' : 'var(--text-muted)',
          background: open ? 'var(--primary-100)' : 'var(--bg-section)',
          padding: '6px',
          borderRadius: '10px',
          transition: 'all 0.2s',
          flexShrink: 0
        }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {open && (
        <div style={{
          padding: '0 24px 20px',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          lineHeight: 1.75,
          borderTop: '1px solid var(--primary-100)',
          paddingTop: '16px',
          background: 'var(--bg)',
          marginTop: 0
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────── */
export default function UpdatesPurification() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '56px', maxWidth: '960px' }}>

      {/* ── 1. Hero ── */}
      <div style={{
        background: 'linear-gradient(140deg, #5B2971 0%, #3b0764 60%, #1e003d 100%)',
        borderRadius: '28px',
        padding: '48px 44px',
        color: 'white',
        marginBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(59,7,100,0.35)'
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(209,165,98,0.15) 0%, transparent 70%)', right: '-80px', top: '-80px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,76,158,0.3) 0%, transparent 70%)', left: '-60px', bottom: '-60px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', opacity: 0.05 }}>
          <Droplet size={280} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)',
            padding: '7px 18px', borderRadius: '100px',
            marginBottom: '28px',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <ShieldCheck size={14} color="#E0B040" />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.9)' }}>
              AAOIFI Standard No. 21 · Islamic Finance
            </span>
          </div>

          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 20px 0', letterSpacing: '-1.5px', lineHeight: 1.05 }}>
            The Essence of
            <br />
            <span style={{ background: 'linear-gradient(90deg, #E6C893, #D1A562)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Wealth Purification
            </span>
          </h2>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.78)', margin: '0 0 28px 0', fontWeight: 400 }}>
            Purification (<em>Tathir / تطهير</em>) is the spiritual and financial obligation of cleansing your investment returns from trace amounts of impermissible income. It is not optional — it is a religious duty every Muslim investor must fulfil.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Religious Obligation', icon: ShieldCheck },
              { label: 'Dividends Only', icon: Coins },
              { label: 'AAOIFI Standard', icon: Scale },
            ].map(({ label, icon: Icon }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'rgba(255,255,255,0.1)', padding: '7px 14px',
                borderRadius: '100px', border: '1px solid rgba(255,255,255,0.12)',
                fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)'
              }}>
                <Icon size={13} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Why We Need Purification ── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeading>Why Do We Need Purification?</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          <InfoCard icon={Coins} iconColor="#8A4C9E" iconBg="var(--primary-50)" title="No Company is Perfectly Pure">
            In the modern economy, virtually every listed company keeps cash in conventional bank accounts that generate interest. This is unavoidable — even the most halal-intentioned business does it. The impure income is a by-product of participation in the global financial system.
          </InfoCard>
          <InfoCard icon={Landmark} iconColor="#D1A562" iconBg="rgba(209,165,98,0.1)" title="Dividends Carry Trace Impurity">
            When you receive dividends, you receive a proportional slice of <em>all</em> of the company's earnings — including the tiny amount from interest. Even if the proportion is 0.3%, that fraction is not yours to keep. You must give it away without expectation of reward.
          </InfoCard>
          <InfoCard icon={Heart} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" title="Fulfils Your Religious Obligation">
            Allah (SWT) says: <em>"O you who believe! Give of the good things which you have earned"</em> (Al-Baqarah: 267). Scholars explain this includes ensuring wealth is free from impermissible sources. Purification is how you honour that command as an investor.
          </InfoCard>
          <InfoCard icon={BarChart2} iconColor="#6366f1" iconBg="rgba(99,102,241,0.1)" title="Preserves Barakah in Your Wealth">
            Leaving impure income in your portfolio can remove barakah (divine blessing) from all your earnings. Scholars consistently advise that prompt purification is a direct cause of Allah's barakah in your finances, health, and family's provision.
          </InfoCard>
        </div>
      </div>

      {/* ── 3. Scholarly Quote ── */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '24px',
        padding: '36px 40px',
        border: '1px solid var(--border)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
        textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', left: '20px', top: '20px', opacity: 0.06 }}>
          <Quote size={90} color="var(--primary)" />
        </div>
        <div style={{ position: 'absolute', right: '20px', bottom: '20px', opacity: 0.06, transform: 'rotate(180deg)' }}>
          <Quote size={90} color="var(--primary)" />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-50)', padding: '6px 14px', borderRadius: '100px', marginBottom: '20px' }}>
            <BookOpen size={13} color="var(--primary)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Hadith</span>
          </div>
          <p style={{ fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--text-dark)', lineHeight: 1.65, fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
            "Allah does not accept charity from wealth acquired through wrongdoing."
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '20px' }}>
            — Sahih Muslim, Book of Zakat
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              This is precisely why purification funds cannot be given with the intention of charity (Sadaqah). They are not charity — they are the return of what is not rightfully yours. The two are fundamentally different in both ruling and intention.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. 5% Rule & Misconceptions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginBottom: '40px' }}>

        {/* 5% Rule */}
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'var(--primary-50)', padding: '11px', borderRadius: '14px' }}>
              <Scale size={22} color="var(--primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>The AAOIFI 5% Rule</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
            Islamic scholars recognise that in the modern economy, almost no public company is 100% free from conventional banking. AAOIFI Standard No. 21 permits investment if impermissible income is <strong style={{ color: 'var(--text-dark)' }}>less than 5%</strong> of total revenue — but that portion must be purified from dividends.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(34,197,94,0.07)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-dark)' }}>≤ 5% impure revenue</strong> — Permissible to invest, must purify dividends
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.07)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.18)' }}>
              <X size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-dark)' }}>{'>'} 5% impure revenue</strong> — Non-compliant; haram to invest
              </div>
            </div>
          </div>
        </div>

        {/* Misconceptions */}
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '11px', borderRadius: '14px' }}>
              <AlertTriangle size={22} color="#D1A562" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>Common Misconceptions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { myth: 'I must sell the stock if it earns any interest.', fact: 'False. Below 5% impure income, you keep the stock and only purify dividends received.' },
              { myth: 'I must purify capital gains from selling shares.', fact: 'False. Capital gains do not require purification per the majority of scholars.' },
              { myth: 'Purification is optional if the amount is tiny.', fact: 'False. Even a fraction of ₦1 that is impure must be removed. There is no minimum.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '5px', borderRadius: '50%', marginTop: '1px', flexShrink: 0, display: 'flex' }}>
                  <X size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '3px' }}>{item.myth}</div>
                  <div style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.fact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. How Irshad Automates It ── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeading>How Irshad Does It Automatically</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {[
            { step: 1, title: 'Dividend Declared', desc: 'A company in your portfolio announces a cash payout.', icon: Sparkles, color: 'var(--primary)', bg: 'var(--primary-50)' },
            { step: 2, title: 'Financials Scanned', desc: "Irshad reads the company's annual reports for impure revenue figures.", icon: BookOpen, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { step: 3, title: 'Ratio Calculated', desc: 'We compute the exact AAOIFI impure income ratio for that year.', icon: Calculator, color: '#D1A562', bg: 'rgba(209,165,98,0.1)' },
            { step: 4, title: 'Amount Due', desc: 'Dividend × impure ratio = exact naira amount you must donate.', icon: Coins, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
            { step: 5, title: 'You Purify', desc: 'Tap "Purify" in the app and donate. Your wealth is cleansed.', icon: HandHeart, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              {/* connector line */}
              {i < arr.length - 1 && (
                <div style={{ position: 'absolute', top: '30px', left: '62%', width: '76%', height: '2px', background: 'linear-gradient(90deg, var(--primary-100), transparent)', zIndex: 0, display: 'none' }} />
              )}
              <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px 16px', border: '1px solid var(--border)', width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-muted)', opacity: 0.45 }}>0{s.step}</div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <s.icon size={22} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{s.title}</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Where to Donate ── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeading>Where Should Purified Funds Go?</SectionHeading>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(34,197,94,0.1) 100%)',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid rgba(34,197,94,0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-24px', bottom: '-24px', opacity: 0.07 }}>
            <HandHeart size={180} color="#22c55e" />
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '700px', position: 'relative', zIndex: 1 }}>
            The purification amount must be given away to charitable causes. It cannot benefit you or your family in any way. The following are accepted channels approved by Shariah scholars:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '10px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            {['The poor & needy', 'Disaster relief', 'Supporting orphans', 'Public utilities', 'Free medical care', 'Clean water projects'].map((use, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.8)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.15)', backdropFilter: 'blur(4px)' }}>
                <CheckCircle2 size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-dark)' }}>{use}</span>
              </div>
            ))}
          </div>

          {/* Niyyah warning */}
          <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '20px 22px', borderRadius: '18px', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', position: 'relative', zIndex: 1 }}>
            <AlertCircle size={26} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.93rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Critical Shariah Ruling: Intention (Niyyah) Must Be Correct
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                You <strong style={{ color: 'var(--text-dark)' }}>must not</strong> intend this as Sadaqah (voluntary charity) or expect any spiritual reward (thawab). Allah is pure and only accepts what is pure. Your sole intention must be to <strong style={{ color: 'var(--text-dark)' }}>rid yourself of impermissible wealth</strong>. This is what separates Tathir from charity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. FAQ ── */}
      <div>
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQ_ITEMS.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </div>

    </div>
  );
}
