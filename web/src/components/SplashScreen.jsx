import React, { useEffect, useState, useRef } from 'react';

/**
 * SplashScreen — Fast Edition
 *
 * Speed optimisations applied:
 *  1. MIN_DISPLAY_MS dropped from 2000 → 800ms (brand flash, not a wait screen)
 *  2. Arc driven by a single CSS @keyframes instead of 60fps RAF setState
 *  3. Exit sequence tightened to 350ms total (was 950ms)
 *  4. No re-renders during animation — progress bar width is CSS, not JS state
 *  5. "exiting" class applied as soon as auth is ready (no extra 300ms delay)
 *
 * Props:
 *   authReady (bool) — pass true when auth context has finished loading
 *   onDone    (fn)   — called after exit animation completes
 */
const SplashScreen = ({ authReady, onDone }) => {
  const MIN_DISPLAY_MS = 800;
  const [minElapsed, setMinElapsed] = useState(false);
  const [exiting, setExiting]       = useState(false);
  const exitTimerRef                 = useRef(null);

  // Minimum display timer
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  // When BOTH ready, start exit immediately
  useEffect(() => {
    if (minElapsed && authReady && !exiting) {
      setExiting(true);
    }
  }, [minElapsed, authReady]);

  // After CSS transition finishes, unmount
  useEffect(() => {
    if (!exiting) return;
    exitTimerRef.current = setTimeout(() => onDone?.(), 380);
    return () => clearTimeout(exitTimerRef.current);
  }, [exiting, onDone]);

  // SVG arc geometry (driven by CSS now, no JS state)
  const R             = 78;
  const SIZE          = 174;
  const cx            = SIZE / 2;
  const cy            = SIZE / 2;
  const circumference = 2 * Math.PI * R;

  return (
    <div className={`splash-screen${exiting ? ' exiting' : ''}`}>
      <div className="splash-bg-grad" />
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-orb splash-orb-3" />
      <div className="splash-grid" />

      <div className="splash-content">
        {/* Logo + CSS-animated progress ring */}
        <div className="splash-logo-wrap">
          <div className="splash-ring-spin" />

          {/* SVG arc — CSS animation instead of JS RAF */}
          <svg
            className="splash-arc-svg"
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
          >
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke="rgba(15,82,87,0.18)"
              strokeWidth="2"
            />
            {/* Animated progress arc — purely CSS */}
            <circle
              className="splash-arc-progress"
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#0F5257" />
                <stop offset="100%" stopColor="#C9B89C" />
              </linearGradient>
            </defs>
          </svg>

          {/* Logo card */}
          <div className="splash-logo-card">
            <img src="/logo.svg" alt="Irshad" className="splash-logo-img" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="splash-wordmark">
          <span className="splash-word-irshad">IRSHAD</span>
          <div className="splash-divider">
            <span className="splash-divider-line" />
            <span className="splash-divider-dot" />
            <span className="splash-divider-line" />
          </div>
          <span className="splash-word-tagline">Shariah-Compliant Stock Screening</span>
        </div>

        {/* CSS-only progress bar */}
        <div className="splash-progress-track">
          <div className="splash-progress-fill splash-progress-animate" />
        </div>
      </div>

      <div className="splash-footer">
        <span className="splash-footer-dot" />
        AAOIFI Certified
        <span className="splash-footer-sep">·</span>
        Nigerian Exchange
        <span className="splash-footer-dot" />
      </div>
    </div>
  );
};

export default SplashScreen;
