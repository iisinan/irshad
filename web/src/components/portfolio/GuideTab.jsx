import React, { useState } from 'react';
import {
  BookOpen, HelpCircle, Navigation, PlayCircle,
  ChevronDown, ChevronRight, LifeBuoy, Lightbulb,
  Briefcase, BarChart2, Star, Bell, Settings, ShieldCheck, Calculator,
  FileText, CheckCircle2, AlertTriangle, Mail
} from 'lucide-react';

/* ── Collapsible FAQ Item ── */
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: '14px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 18px', background: 'none',
          border: 'none', cursor: 'pointer', gap: '12px',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.4 }}>{question}</span>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: open ? 'var(--primary)' : 'var(--bg-section)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.2s',
        }}>
          <ChevronDown size={14} color={open ? 'white' : 'var(--text-muted)'} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

/* ── Nav Menu Card ── */
const NavCard = ({ icon: Icon, title, description, color = 'var(--primary)' }) => (
  <div className="animate-slide-up" style={{
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
    padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
  >
    <div style={{
      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
    </div>
  </div>
);

/* ── Getting Started Step ── */
const Step = ({ number, title, description }) => (
  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
      background: 'var(--primary)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.82rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,109,100,0.25)',
    }}>
      {number}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</div>
    </div>
  </div>
);

/* ── Section Header ── */
const SectionHeader = ({ icon: Icon, title, color = 'var(--primary)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} color={color} />
    </div>
    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{title}</h2>
  </div>
);

/* ── Tutorial Card ── */
const TutorialCard = ({ icon: Icon, title, description, type, link }) => (
  <a
    href={link || '#'}
    target={link ? '_blank' : undefined}
    rel="noopener noreferrer"
    style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px',
      padding: '16px', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}
    className="animate-slide-up"
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color="var(--primary)" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{description}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
      <span style={{ fontSize: '0.66rem', padding: '3px 8px', borderRadius: '8px', background: 'var(--primary-50)', fontWeight: 800 }}>{type}</span>
      <ChevronRight size={14} />
    </div>
  </a>
);

/* ── Contact Support Card ── */
const SupportCard = ({ icon: Icon, title, description, buttonLabel, onClick, color = 'var(--primary)' }) => (
  <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 30%, transparent)`; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `color-mix(in srgb, ${color} 10%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
    </div>
    <button
      onClick={onClick}
      style={{
        marginTop: 'auto', padding: '10px 16px', borderRadius: '12px',
        border: `1px solid ${color}`, background: `color-mix(in srgb, ${color} 8%, transparent)`,
        color, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={e => { e.currentTarget.style.background = `color-mix(in srgb, ${color} 8%, transparent)`; e.currentTarget.style.color = color; }}
    >
      {buttonLabel}
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export default function GuideTab() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'methodology',     label: 'AAOIFI Standards', icon: ShieldCheck },
    { id: 'navigation',      label: 'Navigation Guide', icon: Navigation },
    { id: 'faq',             label: 'FAQs', icon: HelpCircle },
    { id: 'tutorials',       label: 'Tutorials & Guides', icon: PlayCircle },
    { id: 'support',         label: 'Support', icon: LifeBuoy },
  ];

  const navItems = [
    { icon: Briefcase,   title: 'Portfolio',        description: 'View your holdings and their Shariah compliance status, track portfolio performance and allocation.',  color: 'var(--primary)' },
    { icon: BarChart2,   title: 'Market Screener',  description: 'Check the Shariah compliance of all Nigerian stocks. View AAOIFI ratios and detailed screening reports.', color: '#8b5cf6' },
    { icon: Star,        title: 'Alert (Watchlist)', description: 'Monitor companies you are interested in. Set price alerts and receive notifications on status changes.', color: 'var(--gold)' },
    { icon: FileText,    title: 'Statement',         description: 'View a detailed financial statement of your portfolio activity and holdings over time.',                color: '#0ea5e9' },
    { icon: Calculator,  title: 'Zakat',             description: 'Automatically calculate your Zakat obligation based on your current portfolio holdings.',               color: 'var(--doubtful)' },
    { icon: ShieldCheck, title: 'Purification',      description: 'Calculate and track income purification amounts for any Non-Halal revenue earned from your investments.', color: 'var(--halal)' },
    { icon: BookOpen,    title: 'Resources',         description: 'Access Islamic finance educational content, lectures, and scholarship resources.',                      color: '#ec4899' },
    { icon: Bell,        title: 'Updates',           description: 'Stay informed with compliance changes, business activity updates, market intelligence and your inbox.',  color: 'var(--review)' },
    { icon: Settings,    title: 'Settings',          description: 'Manage notifications, account preferences, and personalise your Irshad experience.',                   color: 'var(--text-muted)' },
  ];

  const faqs = [
    {
      question: 'How is a stock screened for Shariah compliance?',
      answer: 'Irshad implements AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) Shariah Standard No. 21. Screening involves two distinct stages: (1) Business Activity Screen (Rule 3/4/1) — the company must not operate in prohibited sectors like conventional banking, alcohol, pork, gambling, adult media, tobacco, or weapons. (2) Quantitative Financial Ratios — interest-bearing debt must be ≤ 30% of Market Cap, cash & interest-bearing securities must be ≤ 30% of Market Cap, and impermissible/interest income must be ≤ 5% of total revenue.',
    },
    {
      question: 'Why is it permissible to invest in companies with minor interest or debt?',
      answer: 'Under AAOIFI Standard No. 21 (Appendix B), senior Islamic scholars established that investing in mixed companies is permissible based on classical jurisprudence: (1) Removal of Hardship (Al-Mashaqqah Tajlib At-Taysir) — requiring zero contact with interest would lock Muslims out of equity markets. (2) Majority-Halal Wealth (Ghalabat al-Halal) — when 95%+ of revenue is lawful, the company is predominantly halal. (3) Separation of Bargains (Tafriq al-Safqah) — the lawful operating equity stands valid, while the impermissible fraction is isolated and purified.',
    },
    {
      question: 'What does "Near Limit" (Dashed Badge) mean?',
      answer: 'When a company\'s debt or cash ratio is approaching the 30% ceiling (e.g. 26% to 29.9%), Irshad applies a "Near Limit" proximity warning with a dashed border. The stock is currently compliant, but market price drops or next quarter\'s borrowings could cause it to exceed the threshold.',
    },
    {
      question: 'What does "Purification Required" mean and how is it calculated?',
      answer: 'If a compliant company earns up to 5% non-permissible income (such as treasury interest on bank deposits), investors must cleanse their dividend earnings. The purification percentage = (Impermissible Income ÷ Total Revenue). For example, if a stock has a 2.00% purification rate and you receive ₦100,000 in dividends, you must donate ₦2,000 to charity without expecting spiritual reward (thawab).',
    },
    {
      question: 'Why does AAOIFI use Market Capitalisation instead of Total Assets?',
      answer: 'AAOIFI Standard 21 specifies Market Capitalisation (or the 12/36-month average market cap) as the denominator because it represents the actual enterprise market valuation of the company\'s equity, avoiding book-value distortions from historical depreciation.',
    },
    {
      question: 'Does Irshad allow Short Selling, Options, or Margin Trading?',
      answer: 'No. AAOIFI Standard No. 21 strictly prohibits conventional short selling (selling shares one does not own — Bay\' ma la Yamlik), options & derivatives contracts (due to Gharar/excessive uncertainty), and margin loans (interest-based leverage). Irshad exclusively screens spot cash equity ownership.',
    },
    {
      question: 'How often are compliance determinations updated?',
      answer: 'Screenings are updated automatically whenever quarterly (10-Q equivalent) and annual (10-K equivalent) financial statements are published to the NGX and NGX Pulse. Additionally, corporate announcements are parsed daily for major business activity or restructuring changes.',
    },
    {
      question: 'Is Irshad certified by AAOIFI or a registered financial advisor?',
      answer: 'Irshad is an independent financial technology platform. We implement a rigorous, auditable computational interpretation of AAOIFI Shariah Standard No. 21 using verified public filings. Irshad is not affiliated with or certified by AAOIFI and does not provide bespoke financial advice.',
    },
  ];

  const tutorials = [
    { icon: BookOpen,   title: 'AAOIFI Standard 21 Breakdown',      description: 'The 4 juristic pillars & 3 quantitative screening ratios',  type: 'Guide',   link: '/shariah' },
    { icon: ShieldCheck,title: 'How to Purify Dividend Income',      description: 'Step-by-step calculation & charitable disbursement guide', type: 'Guide',   link: null },
    { icon: FileText,   title: 'How to Read a Screening Report',    description: 'Understanding filing sources, headroom, and debt math',    type: 'Guide',   link: null },
    { icon: Calculator, title: 'Calculating Portfolio Zakat',       description: 'How Irshad computes your annual equity Zakat obligation',  type: 'Guide',   link: null },
    { icon: PlayCircle, title: 'Getting Started with Irshad',      description: '3-minute walkthrough of the Nigerian stock screener',       type: 'Video',   link: null },
    { icon: PlayCircle, title: 'Setting Up Your Watchlist & Alerts', description: 'Monitor compliance shifts across NGX tickers in real time', type: 'Video',   link: null },
  ];

  return (
    <div>
      {/* Section Nav */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', padding: '4px' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '12px',
              border: `1px solid ${activeSection === s.id ? 'var(--primary)' : 'var(--border)'}`,
              background: activeSection === s.id ? 'var(--primary)' : 'var(--bg)',
              color: activeSection === s.id ? 'white' : 'var(--text-muted)',
              fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <s.icon size={13} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Getting Started ─── */}
      {activeSection === 'getting-started' && (
        <div className="animate-slide-up stagger-1">
          <SectionHeader icon={BookOpen} title="Getting Started with Irshad" />
          
          {/* What is Irshad */}
          <div style={{ background: 'linear-gradient(135deg, rgba(0,109,100,0.06) 0%, rgba(212,160,23,0.04) 100%)', border: '1px solid var(--primary-100)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>What is Irshad?</h3>
            </div>
            <p style={{ fontSize: '0.79rem', color: 'var(--text-body)', lineHeight: 1.7, margin: '0 0 14px' }}>
              Irshad is Nigeria's first automated Shariah compliance screening platform for the stock market. It helps Muslim investors determine whether NSE-listed companies meet the requirements for halal investing under the globally recognised AAOIFI standard.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Screen any NGX stock', icon: CheckCircle2, color: 'var(--halal)' },
                { label: 'Track portfolio compliance', icon: CheckCircle2, color: 'var(--halal)' },
                { label: 'Calculate Zakat automatically', icon: CheckCircle2, color: 'var(--halal)' },
                { label: 'Monitor compliance changes', icon: CheckCircle2, color: 'var(--halal)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <item.icon size={13} color={item.color} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What is AAOIFI */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Lightbulb size={16} color="var(--gold)" />
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>What is AAOIFI Screening?</h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) is the leading international standard-setter for Islamic finance. Their Shariah Standard No. 21 defines two tests every stock must pass: a business activity purity test and a financial ratio test. Irshad applies these automatically to all NGX-listed companies.
            </p>
          </div>

          {/* Steps */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 20px' }}>How Screening Works</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Step number={1} title="Company Data Collection" description="Irshad collects annual reports, audited financial statements, and business disclosure documents from the NSE, company websites, and verified data sources." />
              <Step number={2} title="Financial Data Extraction" description="Irshad analyses the financial statements to extract revenue by business segment, total debt, interest income, and other key metrics required for AAOIFI screening." />
              <Step number={3} title="Business Activity Review" description="Irshad reviews corporate announcements and news to detect any involvement in prohibited activities (alcohol, tobacco, conventional banking, entertainment, etc.)." />
              <Step number={4} title="AAOIFI Ratio Calculation" description="Irshad calculates the three core AAOIFI financial ratios: interest-bearing debt, interest income, and liquid assets — each relative to total assets." />
              <Step number={5} title="Final Status Assignment" description="Based on both tests, the company is assigned a status: Halal, Non-Halal, or Doubtful. The status is updated whenever new financial data becomes available." />
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation Guide ─── */}
      {activeSection === 'navigation' && (
        <div className="animate-slide-up stagger-1">
          <SectionHeader icon={Navigation} title="Navigation Guide" />
          <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
            Here is a quick explanation of each section in Irshad.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {navItems.map(item => <NavCard key={item.title} {...item} />)}
          </div>
        </div>
      )}

      {/* ─── FAQs ─── */}
      {activeSection === 'faq' && (
        <div className="animate-slide-up stagger-1">
          <SectionHeader icon={HelpCircle} title="Frequently Asked Questions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, i) => <FaqItem key={i} {...faq} />)}
          </div>
        </div>
      )}

      {/* ─── Tutorials ─── */}
      {activeSection === 'tutorials' && (
        <div className="animate-slide-up stagger-1">
          <SectionHeader icon={PlayCircle} title="Tutorials & Guides" />
          <div style={{ background: 'linear-gradient(135deg, rgba(0,109,100,0.05) 0%, transparent 100%)', border: '1px solid var(--primary-100)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={16} color="var(--doubtful)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Video tutorials are coming soon. Written guides are available now.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tutorials.map((t, i) => <TutorialCard key={i} {...t} />)}
          </div>
        </div>
      )}

      {/* ─── Support ─── */}
      {activeSection === 'support' && (
        <div className="animate-slide-up stagger-1">
          <SectionHeader icon={LifeBuoy} title="Contact Support" />
          <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
            We're here to help. Choose how you'd like to reach us.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <SupportCard
              icon={AlertTriangle}
              title="Report an Issue"
              description="Found a bug or incorrect compliance data? Let us know immediately."
              buttonLabel="Report Issue"
              color="var(--non-halal)"
              onClick={() => window.open('mailto:support@irshad.app?subject=Bug Report', '_blank')}
            />
            <SupportCard
              icon={Lightbulb}
              title="Suggest a Feature"
              description="Have an idea that would make Irshad better for Muslim investors?"
              buttonLabel="Submit Suggestion"
              color="var(--doubtful)"
              onClick={() => window.open('mailto:support@irshad.app?subject=Feature Suggestion', '_blank')}
            />
            <SupportCard
              icon={Mail}
              title="Contact Support"
              description="For general inquiries, account help, or any other questions."
              buttonLabel="Email Support"
              color="var(--primary)"
              onClick={() => window.open('mailto:support@irshad.app', '_blank')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
