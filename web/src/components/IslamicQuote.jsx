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

  const isDua = quote.type === 'dua';

  const wrapperStyle = merged
    ? {
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px dashed var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }
    : {
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
      };

  return (
    <div style={wrapperStyle}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={13} color="var(--primary)" style={{ opacity: 0.8 }} />
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            opacity: 0.85,
          }}>
            {quote.label} of the day
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
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
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Narrator (hadith only) */}
      {quote.narrator && (
        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          margin: 0,
          fontStyle: 'italic',
        }}>
          {quote.narrator}
        </p>
      )}

      {/* Arabic */}
      {quote.arabic && (
        <div
          dir="rtl"
          style={{
            fontFamily: '"Amiri", "Scheherazade New", serif',
            fontSize: '1.35rem',
            lineHeight: 2,
            color: 'var(--text-dark)',
            textAlign: 'right',
          }}
        >
          {quote.arabic}
        </div>
      )}

      {/* Translation */}
      <p style={{
        margin: 0,
        fontSize: '0.88rem',
        fontWeight: 600,
        color: 'var(--text-dark)',
        lineHeight: 1.65,
        fontStyle: isDua ? 'italic' : 'normal',
        borderLeft: '3px solid var(--primary)',
        paddingLeft: '12px',
        opacity: 0.92,
      }}>
        {quote.translation}
      </p>

      {/* Transliteration */}
      {quote.transliteration && (
        <p style={{
          margin: 0,
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
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'var(--primary)',
        opacity: 0.75,
        letterSpacing: '0.02em',
      }}>
        {quote.source}
      </p>
    </div>
  );
}
