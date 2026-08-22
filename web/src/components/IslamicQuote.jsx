import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';

const quotes = [
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allaahumma 'innee 'as'aluka 'ilman naafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
    translation: "O Allaah, I ask You for beneficial knowledge, good provision, and accepted deeds.",
    source: "Ibn Majah: 5:925"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "When the verses of Surat Al-Baqara about the usury (Riba) were revealed, the Prophet went to the mosque and recited them in front of the people and then banned the trade of alcohol.",
    source: "Sahih al-Bukhari 459 (Narrated `Aisha)"
  },
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allaahumma 'innee 'as'aluka min fadhlika.",
    translation: "O Allah, I ask You for Your bounty and generosity.",
    source: "Abu Dawud 2:465"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "I said, 'O Messenger of Allah, tell me something about Islam which I can ask of no one but you.' He said, 'Say I believe in Allah — and then be steadfast.'",
    source: "[Muslim] Hadith 21, 40 Hadith an-Nawawi"
  },
  {
    arabic: "اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَاجْبُرْنِي، وَعَافِنِي، وَارْزُقْنِي، وَارْفَعْنِي",
    transliteration: "Allaahum-maghfir lee, warhamnee, wahdinee, wajburnee, wa 'aafinee, warzuqnee, warfa'nee.",
    translation: "O Allaah, forgive me, have mercy on me, guide me, strengthen me, grant me well-being, provide for me, and elevate me.",
    source: "Ibn Majah 34:3845, At-Tirmidhi 2:284"
  }
];

export default function IslamicQuote({ merged = false, compact = false }) {
  const [quote, setQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Pick a random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  if (!isVisible || !quote) return null;

  if (compact) {
    return (
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '12px 16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
          <BookOpen size={16} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 600, fontStyle: 'italic' }}>
            "{quote.translation}"
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
            — {quote.source}
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={merged ? {
      position: 'relative',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid var(--border)'
    } : {
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start'
    }}>
      <div style={{
        background: 'var(--primary-50)',
        color: 'var(--primary)',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <BookOpen size={20} />
      </div>
      <div style={{ flex: 1 }}>
        {quote.arabic && (
          <div style={{ fontSize: '1.5rem', fontFamily: 'serif', textAlign: 'right', marginBottom: '12px', color: 'var(--text-dark)', lineHeight: 1.6 }} dir="rtl">
            {quote.arabic}
          </div>
        )}
        <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600, fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.6 }}>
          "{quote.translation}"
        </div>
        {quote.transliteration && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            {quote.transliteration}
          </div>
        )}
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
          {quote.source}
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginTop: '-4px',
          marginRight: '-4px'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}
