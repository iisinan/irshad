import React, { useState } from 'react';
import {
  BookOpen, HelpCircle, Navigation, PlayCircle, MessageCircle,
  ChevronDown, ChevronRight, ExternalLink, LifeBuoy, Lightbulb,
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
export default function UpdatesGuide() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'navigation',      label: 'Navigation Guide', icon: Navigation },
    { id: 'faq',             label: 'FAQs', icon: HelpCircle },
    { id: 'tutorials',       label: 'Tutorials', icon: PlayCircle },
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
      answer: 'Irshad uses the AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) standard. Each company is assessed on two levels: (1) Business Activity — the company must not earn significant revenue from prohibited sectors such as alcohol, tobacco, conventional banking, or entertainment. (2) Financial Ratios — the company\'s interest-bearing debt, interest income, and receivables must each fall below 33% of its total assets or revenue. If both tests pass, the company is classified as Halal.',
    },
    {
      question: 'Why did a stock become Non-Halal?',
      answer: 'A stock typically becomes Non-Halal when its latest financial statements show that one or more AAOIFI ratios have been breached — for example, interest-bearing debt exceeds 33% of total assets. It may also become Non-Halal if the company enters a prohibited business activity. You can view the specific reason on the company\'s screening report or in the Compliance Changes section of News & Insights.',
    },
    {
      question: 'How often is screening updated?',
      answer: 'Irshad runs automated screening cycles whenever new annual reports or audited financial statements are published by NSE-listed companies. Additionally, Irshad\'s AI Engine monitors news and corporate disclosures daily for business activity changes that might affect compliance status.',
    },
    {
      question: 'What does "Purification Required" mean?',
      answer: 'If you hold a stock that was Halal for part of a year but became Non-Halal, or if the company earns a small amount of incidental Non-Halal income (e.g., interest from cash deposits), you may be required to purify a proportionate amount of your dividends or capital gains by donating it to charity. Irshad calculates this for you in the Purification tab.',
    },
    {
      question: 'How are confidence scores calculated?',
      answer: 'Confidence scores reflect how certain Irshad is about a detected business activity or screening result. A High score means the information comes from official filings, annual reports, or verified regulatory announcements. A Medium score means the data comes from reputable news sources or AI-analysed disclosures. A Low score indicates the information is unverified and should be independently confirmed.',
    },
    {
      question: 'Can compliance status change after I buy a stock?',
      answer: 'Yes. Shariah compliance is dynamic and changes with a company\'s financial performance and business activities. Irshad monitors your holdings and will notify you via the Inbox and Updates section if any of your stocks change status. It is your responsibility to act on these changes according to your Shariah advisors\' guidance.',
    },
    {
      question: 'What is the AAOIFI standard?',
      answer: 'AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) is the leading international standard-setting body for Islamic finance. Irshad follows AAOIFI\'s Shariah Standard No. 21 for equity screening, which is widely accepted by Islamic scholars and Shariah supervisory boards across the world.',
    },
    {
      question: 'Is Irshad a financial advisor?',
      answer: 'No. Irshad is a Shariah compliance screening tool, not a financial advisor. It helps you understand whether a company meets generally accepted AAOIFI standards for Islamic investing. Always consult a qualified Islamic scholar or financial advisor for specific investment decisions.',
    },
  ];

  const tutorials = [
    { icon: PlayCircle, title: 'Getting Started with Irshad',      description: '3-minute walkthrough of key features',                  type: 'Video',   link: null },
    { icon: PlayCircle, title: 'Understanding AAOIFI Screening',    description: 'Learn how the AAOIFI ratios work',                     type: 'Video',   link: null },
    { icon: BookOpen,   title: 'How to Read a Screening Report',    description: 'Step-by-step written guide',                           type: 'Guide',   link: null },
    { icon: PlayCircle, title: 'Setting Up Your Portfolio',         description: 'Add holdings and track your investments',              type: 'Video',   link: null },
    { icon: BookOpen,   title: 'Calculating Your Zakat',            description: 'How Irshad computes your Zakat obligation',            type: 'Guide',   link: null },
    { icon: BookOpen,   title: 'Understanding Income Purification',  description: 'When and how to purify Non-Halal income',             type: 'Guide',   link: null },
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
              Irshad is Nigeria's first AI-powered Shariah compliance screening platform for the stock market. It helps Muslim investors determine whether NSE-listed companies meet the requirements for halal investing under the globally recognised AAOIFI standard.
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
              <Step number={2} title="AI-Powered Analysis" description="Our AI Engine analyses the financial statements to extract revenue by business segment, total debt, interest income, and other key metrics required for AAOIFI screening." />
              <Step number={3} title="AAOIFI Ratio Calculation" description="Irshad calculates the three core AAOIFI financial ratios: interest-bearing debt, interest income, and liquid assets — each relative to total assets." />
              <Step number={4} title="Business Activity Review" description="The AI reviews corporate announcements and news to detect any involvement in prohibited activities (alcohol, tobacco, conventional banking, entertainment, etc.)." />
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
