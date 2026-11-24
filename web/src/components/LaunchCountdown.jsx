import React, { useEffect, useState } from 'react';
import { Rocket, X, Sparkles } from 'lucide-react';

// December 1st, 2026 at 00:00 WAT (+01:00)
const LAUNCH_TARGET_MS = Date.parse('2026-12-01T00:00:00+01:00');
const LIVE_CELEBRATION_WINDOW_MS = 72 * 60 * 60 * 1000;
const DISMISS_KEY = 'irshad_launch_countdown_dismissed';

function computeRemaining(nowMs) {
  const diff = LAUNCH_TARGET_MS - nowMs;
  if (diff > 0) {
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { phase: 'countdown', days, hours, minutes, seconds };
  }
  if (Math.abs(diff) <= LIVE_CELEBRATION_WINDOW_MS) {
    return { phase: 'live', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return { phase: 'expired', days: 0, hours: 0, minutes: 0, seconds: 0 };
}

const pad2 = (n) => String(n).padStart(2, '0');

export default function LaunchCountdown({ variant = 'hero' }) {
  const [timeLeft, setTimeLeft] = useState(() => computeRemaining(Date.now()));
  const [dismissed, setDismissed] = useState(() => {
    if (variant !== 'bar') return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (timeLeft.phase === 'expired') return undefined;
    const id = setInterval(() => {
      setTimeLeft(computeRemaining(Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft.phase]);

  if (timeLeft.phase === 'expired' || (variant === 'bar' && dismissed)) {
    return null;
  }

  if (variant === 'bar') {
    return (
      <div
        role="region"
        aria-label="Irshad Launch Countdown"
        className="no-print"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 109, 100, 0.1) 0%, rgba(209, 165, 98, 0.12) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '9px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-dark)' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 9px', borderRadius: '999px',
            background: 'var(--primary)', color: '#fff',
            fontSize: '0.67rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            <Rocket size={11} /> Dec 1, 2026
          </span>
          {timeLeft.phase === 'live' ? (
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              Irshad is officially live! Explore full AAOIFI screening, baskets &amp; Zakat tools.
            </span>
          ) : (
            <span style={{ fontWeight: 600 }}>
              Full Public Launch in{' '}
              <strong style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                {timeLeft.days}d : {pad2(timeLeft.hours)}h : {pad2(timeLeft.minutes)}m : {pad2(timeLeft.seconds)}s
              </strong>
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss launch countdown"
          onClick={() => {
            setDismissed(true);
            try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
          }}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: '4px', borderRadius: '6px',
          }}
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Public Launch Countdown"
      className="animate-slide-up stagger-2"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 18px',
        borderRadius: '16px',
        background: 'var(--bg-section)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 8px 24px rgba(0, 109, 100, 0.06)',
        marginBottom: '28px',
        maxWidth: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 9px', borderRadius: '999px',
          background: 'rgba(209, 165, 98, 0.14)', border: '1px solid rgba(209, 165, 98, 0.35)',
          color: 'var(--gold)', fontSize: '0.67rem', fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase',
        }}>
          <Sparkles size={11} /> Going Live · Dec 1, 2026
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {timeLeft.phase === 'live' ? 'Irshad is officially live!' : 'Official Public Launch Countdown'}
        </span>
      </div>

      {timeLeft.phase === 'countdown' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Days', value: pad2(timeLeft.days) },
            { label: 'Hrs',  value: pad2(timeLeft.hours) },
            { label: 'Mins', value: pad2(timeLeft.minutes) },
            { label: 'Secs', value: pad2(timeLeft.seconds) },
          ].map((unit, idx) => (
            <React.Fragment key={unit.label}>
              <div style={{
                minWidth: '56px',
                padding: '7px 10px',
                borderRadius: '11px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '1.22rem',
                  fontWeight: 900,
                  lineHeight: 1.05,
                  color: idx === 0 ? 'var(--primary)' : 'var(--text-dark)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {unit.value}
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: '2px',
                }}>
                  {unit.label}
                </div>
              </div>
              {idx < 3 && (
                <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '1rem' }}>:</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
