import React, { useState, useEffect } from 'react';
import { formatLogoUrl } from '../services/api';

/**
 * CompanyLogo — robust logo display with two-level fallback:
 *   1. API logo_url field (relative → absolute via formatLogoUrl)
 *   2. GCS bucket  https://storage.googleapis.com/irshad-images/logos/<symbol>.png
 *   3. Text initials (first 4 chars of symbol)
 *
 * Props:
 *   symbol   {string}  — ticker symbol (used for GCS lookup & initials)
 *   logoUrl  {string}  — raw logo_url from the API
 *   size     {number}  — width & height in px (default 36)
 *   radius   {number}  — border-radius in px (default 9)
 *   style    {object}  — extra styles merged onto the container
 */
export default function CompanyLogo({ symbol = '', logoUrl, size = 36, radius = 9, style = {} }) {
  const buildGcs = (sym) =>
    `https://storage.googleapis.com/irshad-images/logos/${(sym || '').toLowerCase()}.png`;

  const init = () => {
    const primary = formatLogoUrl(logoUrl);
    return { src: primary || buildGcs(symbol), triedGcs: !primary, failed: false };
  };

  const [state, setState] = useState(init);

  // Reset when logoUrl or symbol changes (virtualised lists re-use the same component instance)
  useEffect(() => {
    setState(init());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, symbol]);

  const handleError = () => {
    setState(prev => {
      if (!prev.triedGcs) {
        return { src: buildGcs(symbol), triedGcs: true, failed: false };
      }
      return { ...prev, failed: true };
    });
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    background: 'var(--primary-50)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: `${Math.max(8, size * 0.24)}px`,
    color: 'var(--primary)',
    overflow: 'hidden',
    ...style,
  };

  if (!state.failed && state.src) {
    return (
      <div style={containerStyle}>
        <img
          loading="lazy"
          src={state.src}
          alt={symbol}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {(symbol || '').slice(0, 4)}
    </div>
  );
}
