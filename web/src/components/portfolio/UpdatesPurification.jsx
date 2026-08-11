import React, { useState } from 'react';
import {
  Droplet, BookOpen, HandHeart, AlertCircle, ShieldCheck, Scale,
  Sparkles, AlertTriangle, X, Calculator, ChevronDown, ChevronUp,
  Heart, CheckCircle2, Landmark, Coins, BarChart2, Quote
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Do I need to purify my capital gains when I sell a stock?',
    a: 'No. According to the majority of contemporary scholars, capital gains (profit earned from selling shares at a higher price) do not require purification. Only dividends — income paid out by the company — need to be cleansed, since dividends are a direct distribution of the company\'s earnings, which may include trace impure income.'
  },
  {
    q: 'Do I have to sell a stock because it earns some interest?',
    a: 'No. As long as the core business is halal and the impermissible income (e.g., interest on bank deposits) is below 5% of total revenue, you may continue to hold the stock. The obligation is simply to purify the corresponding portion of dividends you receive.'
  },
  {
    q: 'What if I forget to purify for a past year?',
    a: 'You should purify retroactively as soon as you become aware. The obligation does not expire. Calculate the impure portion of all dividends received and donate that amount at your earliest convenience.'
  },
  {
    q: 'Can I donate purified funds to my local masjid?',
    a: 'Most scholars permit donating to mosques for operational expenses (utilities, maintenance), but not for construction projects. The safest scholarly opinion is to direct purification funds to the poor and needy directly, or to general public welfare causes.'
  },
  {
    q: 'Is purification the same as Zakat?',
    a: 'No. Zakat is a mandatory act of worship (ibadah) with its own set of conditions, nisab, and reward. Purification (Tathir) is a separate obligation specifically to rid impermissible wealth — it carries no spiritual reward, whereas Zakat is one of the pillars of Islam and carries immense reward.'
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--bg)',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        borderColor: open ? 'var(--primary-100)' : 'var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', gap: '16px' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', flex: 1, lineHeight: 1.4 }}>{q}</span>
        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 24px 20px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function UpdatesPurification() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '48px' }}>

      {/* ── 1. Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #3b0764 100%)',
        borderRadius: '32px',
        padding: '44px 40px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(91,41,113,0.3)'
      }}>
        <div style={{ position: 'absolute', right: '-60px', top: '-60px', opacity: 0.06, transform: 'rotate(-20deg)' }}>
          <Droplet size={360} />
        </div>
        <div style={{ position: 'absolute', left: '8%', top: '25%', width: '5px', height: '5px', background: 'white', borderRadius: '50%', opacity: 0.5, boxShadow: '0 0 12px white' }} />
        <div style={{ position: 'absolute', right: '20%', bottom: '18%', width: '7px', height: '7px', background: 'white', borderRadius: '50%', opacity: 0.25, boxShadow: '0 0 18px white' }} />
        <div style={{ position: 'absolute', left: '35%', bottom: '10%', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.3 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 18px', borderRadius: '100px', marginBottom: '28px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <ShieldCheck size={15} color="var(--gold)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.92)' }}>
              AAOIFI Standard No. 21 · Islamic Finance
            </span>
          </div>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 900, margin: '0 0 20px 0', letterSpacing: '-1.2px', lineHeight: 1.05 }}>
            The Essence of <br /><span style={{ color: 'var(--gold)' }}>Wealth Purification</span>
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', margin: 0, fontWeight: 400, maxWidth: '580px' }}>
            Purification (<em>Tathir / تطهير</em>) is the spiritual and financial obligation of cleansing your investment returns from trace amounts of impermissible income. It is not optional — it is a religious duty every Muslim investor must fulfil.
          </p>
        </div>
      </div>

      {/* ── 2. Why We Need Purification ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Why Do We Need Purification?</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Reason 1 */}
          <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--primary-50)', padding: '10px', borderRadius: '14px' }}>
                <Coins size={22} color="var(--primary)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>No Company is Perfectly Pure</h4>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              In the modern economy, virtually every listed company keeps cash in conventional bank accounts that generate interest. They may also have short-term investments in fixed-income instruments. This is unavoidable — even the most halal-intentioned company does it.
            </p>
          </div>

          {/* Reason 2 */}
          <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '14px' }}>
                <Landmark size={22} color="var(--gold)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Dividends Carry Trace Impurity</h4>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              When you receive dividends, you receive a proportional slice of <em>all</em> of the company's earnings — including the tiny amount from interest. Even if the proportion is 0.3%, that fraction of money is not yours to keep. You must give it away without expectation of reward.
            </p>
          </div>

          {/* Reason 3 */}
          <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', padding: '10px', borderRadius: '14px' }}>
                <Heart size={22} color="#22c55e" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>It Fulfils Your Religious Obligation</h4>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              Allah (SWT) says: <em>"O you who believe! Give of the good things which you have earned"</em> (Al-Baqarah: 267). Scholars explain this includes ensuring wealth is free from impermissible sources. Purification is how you honour that command as a stock market investor.
            </p>
          </div>

          {/* Reason 4 */}
          <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '14px' }}>
                <BarChart2 size={22} color="#6366f1" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Barakah in Your Portfolio</h4>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              Leaving impure income in your wealth can remove barakah (divine blessing) from all your earnings. Scholars advise that prompt purification is a cause for Allah's barakah in your financial affairs, your health, and your family's provision.
            </p>
          </div>

        </div>
      </div>

      {/* ── 3. Quranic / Hadith Quote ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(91,41,113,0.04) 0%, rgba(91,41,113,0.1) 100%)',
        borderRadius: '28px',
        padding: '36px 40px',
        border: '1px solid var(--primary-100)',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', left: '20px', top: '20px', opacity: 0.08 }}>
          <Quote size={80} color="var(--primary)" />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--text-dark)', lineHeight: 1.7, fontWeight: 600, marginBottom: '16px' }}>
            "Allah does not accept charity from wealth acquired through wrongdoing."
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>— Sahih Muslim, Book of Zakat</div>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--primary-100)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              This is why purification funds cannot be given with the intention of charity (Sadaqah). They are not charity — they are the removal of what is not rightfully yours. The two are fundamentally different in both ruling and intention.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. The 5% Rule & Misconceptions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>

        <div style={{ background: 'var(--bg)', borderRadius: '28px', padding: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03 }}>
            <Scale size={200} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}>
              <Scale size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>The AAOIFI 5% Rule</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            Islamic scholars recognise that in the modern economy, almost no public company is 100% free from conventional banking. Therefore, AAOIFI Standard No. 21 permits investment in a company if its impermissible income is <strong>less than 5%</strong> of total revenue — but that portion must be purified.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(34,197,94,0.07)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 size={18} color="#22c55e" />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}><strong style={{ color: 'var(--text-dark)' }}>≤ 5% impure revenue</strong> → Permissible to invest, must purify dividends</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.07)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <X size={18} color="#ef4444" />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}><strong style={{ color: 'var(--text-dark)' }}>{'>'} 5% impure revenue</strong> → Stock is non-compliant (Haram to invest)</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '28px', padding: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '16px', color: 'var(--gold)' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Common Misconceptions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { myth: 'I must sell the stock if it earns any interest.', fact: 'False. Below 5% impure income, you keep the stock and only purify the dividends.' },
              { myth: 'I must purify capital gains from selling shares.', fact: 'False. Capital gains do not require purification per the majority of scholars.' },
              { myth: 'Purification is optional if the amount is tiny.', fact: 'False. Even a fraction of ₦1 that is impure must be removed. There is no minimum threshold.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 5px', borderRadius: '50%', marginTop: '1px', flexShrink: 0 }}>
                  <X size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '3px' }}>{item.myth}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.fact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. How Irshad Automates It ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>How Irshad Does It Automatically</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { step: 1, title: 'Dividend Declared', desc: 'A company in your portfolio announces a cash dividend payout.', icon: Sparkles, color: 'var(--primary)' },
            { step: 2, title: 'Financials Scanned', desc: 'Irshad reads the company\'s annual reports to extract impure revenue figures.', icon: BookOpen, color: '#6366f1' },
            { step: 3, title: 'Ratio Calculated', desc: 'We compute the exact AAOIFI impure income ratio for that financial year.', icon: Calculator, color: 'var(--gold)' },
            { step: 4, title: 'Amount Due', desc: 'Your dividend × impure ratio = the exact naira amount you must donate.', icon: Coins, color: '#ef4444' },
            { step: 5, title: 'You Purify', desc: 'Tap "Purify" in the app and donate the amount. Your wealth is cleansed.', icon: HandHeart, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px 20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', left: '14px', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', opacity: 0.4 }}>0{s.step}</div>
              <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <s.icon size={24} />
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-dark)' }}>{s.title}</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Where to Donate ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(34,197,94,0.12) 100%)',
        borderRadius: '28px',
        padding: '36px',
        border: '1px solid rgba(34,197,94,0.18)',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.08 }}>
          <HandHeart size={200} color="#22c55e" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#22c55e', padding: '12px', borderRadius: '16px', color: 'white', flexShrink: 0 }}>
              <HandHeart size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Where Should Purified Funds Go?</h3>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '760px' }}>
            The purification amount must be given away to charitable causes. It cannot benefit you or your family. Here are the accepted channels:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {['The poor & needy', 'Disaster relief', 'Supporting orphans', 'Public utility projects', 'Free medical care', 'Clean water projects'].map((use, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.7)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{use}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', maxWidth: '760px' }}>
            <AlertCircle size={28} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>Critical: The Intention (Niyyah) Must Be Correct</h4>
              <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                You <strong>must not</strong> intend this as Sadaqah (voluntary charity) for which you seek reward (thawab). Allah is pure and only accepts what is pure. Your sole intention must be to <strong>rid yourself of impermissible wealth</strong>. This distinction is what separates Tathir from charity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. FAQ ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>Frequently Asked Questions</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQ_ITEMS.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </div>

    </div>
  );
}
