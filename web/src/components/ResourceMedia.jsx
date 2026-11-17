import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, FileText, Download, X, Smartphone, Square, Monitor, ExternalLink } from 'lucide-react';

const isDirectVideoUrl = (url) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(clean) ||
    url.includes('/api/v1/resources/media/') ||
    url.includes('.r2.cloudflarestorage.com')
  );
};

const classifyAspectRatio = (width, height) => {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const ratio = width / height;

  if (ratio < 0.72) {
    return {
      orientation: 'portrait',
      ratio,
      aspectCss: `${width} / ${height}`,
      label: 'Portrait • 9:16',
    };
  }
  if (ratio < 0.9) {
    return {
      orientation: 'portrait',
      ratio,
      aspectCss: `${width} / ${height}`,
      label: 'Instagram • 4:5',
    };
  }
  if (ratio <= 1.12) {
    return {
      orientation: 'square',
      ratio,
      aspectCss: `${width} / ${height}`,
      label: 'Square • 1:1',
    };
  }
  return {
    orientation: 'landscape',
    ratio,
    aspectCss: `${width} / ${height}`,
    label: 'Widescreen • 16:9',
  };
};

const analyzeVideoSource = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      kind: 'embed',
      embedUrl: '',
      platform: 'video',
      initialFormat: {
        orientation: 'landscape',
        ratio: 16 / 9,
        aspectCss: '16 / 9',
        label: 'Video',
      },
    };
  }

  const trimmed = rawUrl.trim();

  if (isDirectVideoUrl(trimmed)) {
    return {
      kind: 'direct',
      embedUrl: trimmed,
      platform: 'direct',
      initialFormat: null, // Determined dynamically from loaded video metadata
    };
  }

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (shortsMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0`,
      platform: 'youtube_shorts',
      initialFormat: {
        orientation: 'portrait',
        ratio: 9 / 16,
        aspectCss: '9 / 16',
        label: 'Shorts • 9:16',
      },
    };
  }

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i
  );
  if (ytMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      platform: 'youtube',
      initialFormat: {
        orientation: 'landscape',
        ratio: 16 / 9,
        aspectCss: '16 / 9',
        label: 'Widescreen • 16:9',
      },
    };
  }

  const igMatch = trimmed.match(/instagram\.com\/(reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch) {
    const typeSeg = igMatch[1].toLowerCase() === 'reels' ? 'reel' : igMatch[1].toLowerCase();
    const isReel = typeSeg === 'reel';
    return {
      kind: 'embed',
      embedUrl: `https://www.instagram.com/${typeSeg}/${igMatch[2]}/embed/`,
      platform: 'instagram',
      initialFormat: isReel
        ? { orientation: 'portrait', ratio: 9 / 16, aspectCss: '9 / 16', label: 'Instagram • 9:16' }
        : { orientation: 'portrait', ratio: 4 / 5, aspectCss: '4 / 5', label: 'Instagram • 4:5' },
    };
  }

  const tiktokMatch = trimmed.match(/tiktok\.com\/(?:@[^/]+\/video\/|v\/)(\d+)/i);
  if (tiktokMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
      platform: 'tiktok',
      initialFormat: {
        orientation: 'portrait',
        ratio: 9 / 16,
        aspectCss: '9 / 16',
        label: 'Vertical • 9:16',
      },
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      platform: 'vimeo',
      initialFormat: {
        orientation: 'landscape',
        ratio: 16 / 9,
        aspectCss: '16 / 9',
        label: 'Widescreen • 16:9',
      },
    };
  }

  return {
    kind: 'embed',
    embedUrl: trimmed,
    platform: 'embed',
    initialFormat: {
      orientation: 'landscape',
      ratio: 16 / 9,
      aspectCss: '16 / 9',
      label: 'Widescreen • 16:9',
    },
  };
};

function FormatIcon({ orientation, size = 12 }) {
  if (orientation === 'portrait') return <Smartphone size={size} />;
  if (orientation === 'square') return <Square size={size} />;
  return <Monitor size={size} />;
}

/**
 * Adaptive grid card media preview:
 * - Portrait / Square videos render contained cleanly over a subtle ambient backdrop (no cropped faces/captions).
 * - Landscape videos fill widescreen cleanly.
 */
export function ResourceCardMedia({ item }) {
  const sourceInfo = analyzeVideoSource(item.url);
  const [detectedFormat, setDetectedFormat] = useState(sourceInfo.initialFormat);

  if (item.type !== 'video') {
    return (
      <div style={{ width: '100%', height: '185px', background: 'linear-gradient(145deg, var(--primary-50) 0%, var(--bg-section) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '60px', height: '60px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid var(--primary-100)', boxShadow: '0 8px 20px rgba(209, 165, 98, 0.15)' }}>
          <FileText size={28} strokeWidth={1.5} color="var(--primary)" />
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PDF Document</span>
      </div>
    );
  }

  const isVerticalOrSquare = detectedFormat && (detectedFormat.orientation === 'portrait' || detectedFormat.orientation === 'square');
  const mediaObjectFit = isVerticalOrSquare ? 'contain' : 'cover';

  return (
    <div style={{
      width: '100%',
      height: '190px',
      position: 'relative',
      background: isVerticalOrSquare
        ? 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {item.thumbnail ? (
        <>
          {isVerticalOrSquare && (
            <img
              src={item.thumbnail}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-16px',
                width: 'calc(100% + 32px)',
                height: 'calc(100% + 32px)',
                objectFit: 'cover',
                filter: 'blur(18px) brightness(0.45)',
                pointerEvents: 'none',
              }}
            />
          )}
          <img
            loading="lazy"
            src={item.thumbnail}
            alt={item.title}
            onLoad={(e) => {
              const info = classifyAspectRatio(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
              if (info && sourceInfo.kind === 'direct') setDetectedFormat(info);
            }}
            style={{
              position: 'relative',
              zIndex: 1,
              width: isVerticalOrSquare ? 'auto' : '100%',
              height: '100%',
              maxWidth: '100%',
              objectFit: mediaObjectFit,
              opacity: 0.92,
              borderRadius: isVerticalOrSquare ? '6px' : '0',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </>
      ) : sourceInfo.kind === 'direct' ? (
        <video
          src={`${item.url}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const info = classifyAspectRatio(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
            if (info) setDetectedFormat(info);
          }}
          style={{
            position: 'relative',
            zIndex: 1,
            width: isVerticalOrSquare ? 'auto' : '100%',
            height: '100%',
            maxWidth: '100%',
            objectFit: mediaObjectFit,
            opacity: 0.92,
            pointerEvents: 'none',
            borderRadius: isVerticalOrSquare ? '6px' : '0',
            boxShadow: isVerticalOrSquare ? '0 8px 24px rgba(0,0,0,0.45)' : 'none',
          }}
        />
      ) : null}

      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
          <Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} />
        </div>
      </div>

      {detectedFormat && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 3,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(6px)',
          color: '#f8fafc',
          fontSize: '0.6rem',
          fontWeight: 800,
          padding: '4px 8px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          border: '1px solid rgba(255,255,255,0.14)',
        }}>
          <FormatIcon orientation={detectedFormat.orientation} size={10} />
          <span>{detectedFormat.label}</span>
        </div>
      )}

      {item.duration && (
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 3, background: 'rgba(0,0,0,0.72)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
          {item.duration}
        </div>
      )}
    </div>
  );
}

/**
 * Smart responsive modal viewer for Video (9:16, 4:5, 1:1, 16:9, YouTube/Shorts/Instagram) and PDF documents.
 */
export function ResourceViewerModal({ item, onClose }) {
  const sourceInfo = item?.type === 'video' ? analyzeVideoSource(item.url) : null;
  const [format, setFormat] = useState(sourceInfo?.initialFormat || null);
  const [isNarrow, setIsNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const nextSource = item?.type === 'video' ? analyzeVideoSource(item.url) : null;
    setFormat(nextSource?.initialFormat || null);
  }, [item]);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 768);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const orientation = format?.orientation || 'landscape';
  const isPortrait = isVideo && orientation === 'portrait';
  const isSquare = isVideo && orientation === 'square';
  const useSideBySide = isPortrait && !isNarrow;

  const modalMaxWidth = isPortrait
    ? (useSideBySide ? '780px' : '440px')
    : isSquare
      ? '580px'
      : '900px';

  const mediaAspectCss = format?.aspectCss || '16 / 9';
  const descriptionText =
    item.description?.trim() ||
    'This is an educational video provided by our Islamic Finance partners. Please note that the content is for educational purposes and should not be taken as direct financial advice.';

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: isNarrow ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isNarrow ? '0' : '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: isNarrow ? '24px 24px 0 0' : '24px',
          width: '100%',
          maxWidth: modalMaxWidth,
          maxHeight: isNarrow ? '92vh' : '90vh',
          height: !isVideo ? '84vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          animation: 'slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: isNarrow ? '16px 20px' : '18px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {item.category && (
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-50)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
              )}
              {isVideo && format && (
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-section)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FormatIcon orientation={format.orientation} size={11} />
                  {format.label}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.04rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, lineHeight: 1.3 }}>
              {item.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '4px 0 0', fontWeight: 600 }}>
              By {item.scholar || 'Irshad'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'var(--bg-section)',
              border: '1px solid var(--border)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {isVideo ? (
          <div style={{
            display: useSideBySide ? 'grid' : 'flex',
            gridTemplateColumns: useSideBySide ? 'minmax(0, 420px) minmax(0, 1fr)' : undefined,
            flexDirection: useSideBySide ? undefined : 'column',
            overflowY: 'auto',
            flex: 1,
          }}>
            {/* Adaptive Media Stage */}
            <div style={{
              background: '#05080f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isPortrait && !isNarrow ? '16px' : '0',
              minHeight: useSideBySide ? '420px' : undefined,
            }}>
              <div style={{
                width: '100%',
                maxWidth: isPortrait ? (useSideBySide ? '380px' : '360px') : isSquare ? '520px' : '100%',
                maxHeight: isPortrait ? (isNarrow ? '62vh' : '74vh') : isSquare ? '62vh' : '64vh',
                aspectRatio: mediaAspectCss,
                position: 'relative',
                background: 'black',
                borderRadius: useSideBySide ? '14px' : '0',
                overflow: 'hidden',
                margin: '0 auto',
              }}>
                {sourceInfo.kind === 'direct' ? (
                  <video
                    src={sourceInfo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    onLoadedMetadata={(e) => {
                      const info = classifyAspectRatio(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
                      if (info) setFormat(info);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <iframe
                    src={sourceInfo.embedUrl}
                    title={item.title}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>

            {/* Details & Description */}
            <div style={{
              padding: '22px 24px',
              background: 'var(--bg)',
              borderTop: useSideBySide ? 'none' : '1px solid var(--border)',
              borderLeft: useSideBySide ? '1px solid var(--border)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 8px' }}>
                  Description
                </h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontSize: '0.86rem', margin: 0 }}>
                  {descriptionText}
                </p>
              </div>
              {sourceInfo.platform === 'instagram' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Open on Instagram
                </a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-section)' }}>
            <div style={{ padding: '14px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Document Viewer</h4>
              <a href={item.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.75rem' }}>
                <Download size={16} /> Download PDF
              </a>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <iframe
                src={item.url}
                title={item.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
