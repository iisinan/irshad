import React from 'react';

export default function Skeleton({ width, height, borderRadius, style, className }) {
  return (
    <div
      className={className}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '6px',
        backgroundColor: 'var(--bg-section, var(--border))',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style
      }}
    />
  );
}
