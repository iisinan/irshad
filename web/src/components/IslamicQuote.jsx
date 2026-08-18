import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const quotes = [
  {
    type: 'dua',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allaahumma 'innee 'as'aluka 'ilman naafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
    translation: 'O Allaah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
    source: 'Ibn Majah 5:925',
    label: 'Dua',
  },
  {
    type: 'hadith',
    arabic: '',
    transliteration: '',
    translation:
      'When the verses of Surat Al-Baqara about the usury (Riba) were revealed, the Prophet ﷺ went to the mosque and recited them in front of the people and then banned the trade of alcohol.',
    source: 'Sahih al-Bukhari 459',
    narrator: 'Narrated by ʿAisha (رضي الله عنها)',
    label: 'Hadith',
  },
  {
    type: 'dua',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Allaahumma 'innee 'as'aluka min fadhlika.",
    translation: 'O Allah, I ask You from Your bounty and generosity.',
    source: 'Abu Dawud 2:465',
    label: 'Dua',
  },
  {
    type: 'hadith',
    arabic: '',
    transliteration: '',
    translation:
      '"O Messenger of Allah, tell me something about Islam which I can ask of no one but you." He ﷺ said: "Say: I believe in Allah — and then be steadfast."',
    source: '40 Hadith an-Nawawi, Hadith 21',
    narrator: 'On the authority of Abu ʿAmr (رضي الله عنه)',
    label: 'Hadith',
  },
  {
    type: 'dua',
    arabic: 'اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَاجْبُرْنِي، وَعَافِنِي، وَارْزُقْنِي، وَارْفَعْنِي',
    transliteration: "Allaahum-maghfir lee, warhamnee, wahdinee, wajburnee, wa 'aafinee, warzuqnee, warfa'nee.",
    translation:
      'O Allaah, forgive me, have mercy on me, guide me, strengthen me, grant me well-being, provide for me, and elevate me.',
    source: 'Ibn Majah 34:3845 · At-Tirmidhi 2:284',
    label: 'Dua',
  },
];

export default function IslamicQuote({ merged = false }) {
  const [quote, setQuote] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (!visible || !quote) return null;

  /* ── Standalone card wrapper (when not merged) ── */
  if (!merged) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--bg) 0%, color-mix(in srgb, var(--primary) 4%, var(--bg)) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <QuoteBody quote={quote} onDismiss={() => setVisible(false)} />
      </div>
    );
  }

  /* ── Merged mode: no outer card ── */
  return (
    <div style={{ paddingTop: '18px' }}>
      <QuoteBody quote={quote} onDismiss={() => setVisible(false)} />
    </div>
  );
}

/* ── Inner content shared between modes ── */
function QuoteBody({ quote, onDismiss }) {
  const hasArabic = !!quote.arabic;

  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

      {/* Left: content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: hasArabic ? '14px' : '10px' }}>
          <Sparkles size={12} color="var(--primary)" style={{ opacity: 0.75, flexShrink: 0 }} />
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            opacity: 0.8,
          }}>
            {quote.label} of the day
          </span>
        </div>

        {/* Narrator (hadith only) */}
        {quote.narrator && (
          <p style={{
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
            margin: '0 0 10px',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            {quote.narrator}
          </p>
        )}

        {/* Arabic */}
        {hasArabic && (
          <div
            dir="rtl"
            style={{
              fontFamily: '"Amiri", "Scheherazade New", serif',
              fontSize: '1.3rem',
              lineHeight: 2,
              color: 'var(--text-dark)',
              textAlign: 'right',
              marginBottom: '12px',
              opacity: 0.95,
            }}
          >
            {quote.arabic}
          </div>
        )}

        {/* Translation — left-border accent */}
        <p style={{
          margin: '0 0 8px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-dark)',
          lineHeight: 1.7,
          borderLeft: '3px solid var(--primary)',
          paddingLeft: '12px',
          opacity: 0.9,
        }}>
          {quote.translation}
        </p>

        {/* Transliteration */}
        {quote.transliteration && (
          <p style={{
            margin: '0 0 8px',
            paddingLeft: '15px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            {quote.transliteration}
          </p>
        )}

        {/* Source */}
        <p style={{
          margin: 0,
          paddingLeft: '15px',
          fontSize: '0.68rem',
          fontWeight: 800,
          color: 'var(--primary)',
          opacity: 0.65,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {quote.source}
        </p>
      </div>

      {/* Right: dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '50%',
          opacity: 0.45,
          transition: 'opacity 0.2s',
          flexShrink: 0,
          marginTop: '1px',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
      >
        <X size={15} />
      </button>

    </div>
  );
}
