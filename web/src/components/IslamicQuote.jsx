import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';

const quotes = [
  {
    arabic: "",
    transliteration: "",
    translation: "And I said, 'Seek your Lord's forgiveness, for He is truly Most Forgiving. He will shower you with abundant rain, and He will supply you with wealth and children, and give you gardens as well as rivers.'",
    source: "Surah Nuh (71:10–12)"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "And when the prayer has been concluded, disperse within the land and seek from the bounty of Allah, and remember Allah often that you may succeed.",
    source: "Surah Al-Jumu'ah (62:10)"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "It is He who made the earth tame for you - so walk among its slopes and eat of His provision [rizq], and to Him is the resurrection.",
    source: "Surah Al-Mulk (67:15)"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "If you are grateful, I will surely increase you [in favor]",
    source: "Surah Ibrahim (14:7)"
  },
  {
    arabic: "",
    transliteration: "",
    translation: "And whoever relies on Allah, He will make a way out for them, and provide for them from sources they could never imagine. And whoever puts their trust in Allah, then He alone is sufficient for them.",
    source: "Surah At-Talaq (65:2-3)"
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
        padding: '12px 18px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ color: 'var(--primary)', flexShrink: 0, opacity: 0.8 }}>
          <BookOpen size={16} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.2px' }}>
            "{quote.translation}"
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.9 }}>
            — {quote.source}
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', opacity: 0.5 }}>
          <X size={14} strokeWidth={2.5} />
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
