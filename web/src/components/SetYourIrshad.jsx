import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mail, MessageCircle, CheckCircle, Shield, Target, Zap,
  ChevronRight, X, Sparkles, ArrowLeft, Star, TrendingUp
} from 'lucide-react';
import { searchStocks, onboardUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Tiny confetti canvas ─────────────────────────────────────────────────────
const Confetti = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const palette = ['#0F5257', '#D4AF37', '#4CAF50', '#A8D5BA', '#C9B89C', '#1a7a81'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      r: 4 + Math.random() * 6,
      color: palette[Math.floor(Math.random() * palette.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      alpha: 1,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.rotV;
        p.alpha = Math.max(0, p.alpha - 0.005);
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', borderRadius: 'inherit',
      }}
    />
  );
};

// ─── Step indicator ────────────────────────────────────────────────────────────
const StepDots = ({ current, total }) => (
  <div className="syi-step-dots">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`syi-dot ${i < current ? 'done' : ''} ${i === current - 1 ? 'active' : ''}`}>
        {i < current - 1 && <CheckCircle size={10} />}
      </div>
    ))}
  </div>
);

// ─── Skeleton loader ───────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="syi-skeleton-row">
    <div className="syi-skel syi-skel-sym" />
    <div className="syi-skel syi-skel-name" />
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const SetYourIrshad = ({ onComplete }) => {
  const { user, setUser, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState([]);

  // Alerts & Risk Profile
  const [emailAlert, setEmailAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchStocks(query);
        setResults(res.data?.data || res.data || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [query]);

  const toggleStock = (stock) => {
    setSelectedStocks(prev =>
      prev.find(s => s.symbol === stock.symbol)
        ? prev.filter(s => s.symbol !== stock.symbol)
        : [...prev, stock]
    );
  };

  const handleFinish = async () => {
    if (selectedStocks.length === 0) return;
    
    if (whatsappAlert && !phoneNumber.trim()) {
      setError('Please provide a phone number for WhatsApp alerts.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Single round-trip: bulk watchlist + onboarded flag in one DB transaction
      const res = await onboardUser({
        symbols: selectedStocks.map(s => s.symbol),
        alert_email: emailAlert,
        alert_whatsapp: whatsappAlert,
        phone_number: whatsappAlert ? phoneNumber : null,
        risk_profile: riskProfile,
      });
      // Update auth context directly — no page reload needed
      if (res?.user) setUser(res.user);
      setSaving(false);
      setStep(4);
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      const prefs = { ...(user?.preferences || {}), onboarded: true };
      await updateUser({ preferences: prefs });
      onComplete?.();
    } catch { setSaving(false); }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="syi-overlay">
      {/* Decorative background arcs */}
      <svg className="syi-bg-arc top" viewBox="0 0 400 200" fill="none">
        <path d="M-40 200 Q200 -80 440 200" stroke="rgba(15,82,87,0.12)" strokeWidth="60" fill="none" />
      </svg>
      <svg className="syi-bg-arc bottom" viewBox="0 0 400 200" fill="none">
        <path d="M-40 0 Q200 280 440 0" stroke="rgba(212,175,55,0.08)" strokeWidth="60" fill="none" />
      </svg>

      <div className={`syi-card ${step === 4 ? 'celebration-mode' : ''}`}>

        {/* ── HEADER (steps 1, 2, 3) ────────────────────────── */}
        {step < 4 && (
          <div className="syi-header">
            <div className="syi-brand">
              <div className="syi-logo-wrap">
                <img src="/logo.svg" alt="Irshad" />
              </div>
              <div>
                <span className="syi-label">Set Your</span>
                <span className="syi-title">Irshad</span>
              </div>
            </div>
            <button className="syi-skip" onClick={handleSkip} disabled={saving}>
              Skip
            </button>
          </div>
        )}

        {/* ── STEP INDICATOR ─────────────────────────────── */}
        {step < 4 && <StepDots current={step} total={TOTAL_STEPS} />}

        {/* ════════════════════════════════════════════════
            STEP 1 — SEARCH & SELECT STOCKS
            ════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="syi-body" key="step1">
            <div className="syi-step-hero">
              <div className="syi-icon-badge search-badge"><TrendingUp size={22} /></div>
              <div>
                <h2>Hey {firstName}, find your stocks</h2>
                <p>Search for listed companies and select those you want to monitor.</p>
              </div>
            </div>

            <div className="syi-search-wrap">
              <Search size={18} className="syi-search-icon" />
              <input
                className="syi-search-input"
                type="text"
                placeholder="Search stocks (e.g. GTCO, UBA, DANGCEM...)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="syi-clear-btn" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="syi-results-box">
              {searching && [1, 2, 3].map(i => <SkeletonRow key={i} />)}
              {!searching && results.length > 0 && results.map(stock => {
                const isSelected = !!selectedStocks.find(s => s.symbol === stock.symbol);
                return (
                  <div
                    key={stock.symbol}
                    className={`syi-result-row ${isSelected ? 'picked' : ''}`}
                    onClick={() => toggleStock(stock)}
                  >
                    <div className={`syi-ticker-badge ${isSelected ? 'picked' : ''}`}>
                      {stock.symbol.slice(0, 4)}
                    </div>
                    <div className="syi-result-info">
                      <span className="syi-result-sym">{stock.symbol}</span>
                      <span className="syi-result-name">{stock.name}</span>
                    </div>
                    <div className={`syi-check-wrap ${isSelected ? 'visible' : ''}`}>
                      <CheckCircle size={20} />
                    </div>
                  </div>
                );
              })}
              {!searching && query.length >= 2 && results.length === 0 && (
                <div className="syi-empty">
                  <Star size={28} />
                  <span>No results for "{query}"</span>
                </div>
              )}
              {!query && (
                <div className="syi-hint">Start typing a company name or ticker symbol</div>
              )}
            </div>

            {/* Selected Chips */}
            {selectedStocks.length > 0 && (
              <div className="syi-chips-row">
                {selectedStocks.map(s => (
                  <button key={s.symbol} className="syi-chip" onClick={() => toggleStock(s)}>
                    {s.symbol} <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              className={`syi-cta-btn ${selectedStocks.length === 0 ? 'disabled' : ''}`}
              onClick={() => selectedStocks.length > 0 && setStep(2)}
              disabled={selectedStocks.length === 0}
            >
              {selectedStocks.length === 0
                ? 'Select at least one stock'
                : `Continue with ${selectedStocks.length} ${selectedStocks.length === 1 ? 'stock' : 'stocks'}`
              }
              {selectedStocks.length > 0 && <ChevronRight size={18} />}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP 2 — ALERT PREFERENCES
            ════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="syi-body" key="step2">
            <button className="syi-back-btn" onClick={() => setStep(1)} disabled={saving}>
              <ArrowLeft size={16} /> Back
            </button>

            <div className="syi-step-hero">
              <div className="syi-icon-badge alert-badge"><Mail size={22} /></div>
              <div>
                <h2>Stay in the loop</h2>
                <p>
                  We'll monitor <strong>{selectedStocks.map(s => s.symbol).join(', ')}</strong>.
                  How should we alert you?
                </p>
              </div>
            </div>

            {/* Watchlist preview */}
            <div className="syi-watchlist-preview">
              {selectedStocks.map(s => (
                <div key={s.symbol} className="syi-preview-pill">
                  <div className="syi-pill-dot" />
                  {s.symbol}
                </div>
              ))}
            </div>

            <div className="syi-alert-cards">
              <label className={`syi-alert-card ${emailAlert ? 'on' : ''}`}>
                <div className="sac-left">
                  <div className="sac-icon email"><Mail size={20} /></div>
                  <div className="sac-info">
                    <h4>Email Alerts</h4>
                    <span>Detailed compliance & price reports</span>
                  </div>
                </div>
                <div className="sac-toggle">
                  <input type="checkbox" checked={emailAlert} onChange={e => setEmailAlert(e.target.checked)} />
                  <span className="sac-slider" />
                </div>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className={`syi-alert-card ${whatsappAlert ? 'on' : ''}`} style={{ marginBottom: 0 }}>
                  <div className="sac-left">
                    <div className="sac-icon whatsapp"><MessageCircle size={20} /></div>
                    <div className="sac-info">
                      <h4>WhatsApp Alerts</h4>
                      <span>Instant pings straight to your phone</span>
                    </div>
                  </div>
                  <div className="sac-toggle">
                    <input type="checkbox" checked={whatsappAlert} onChange={e => {
                      setWhatsappAlert(e.target.checked);
                      if (!e.target.checked) setError('');
                    }} />
                    <span className="sac-slider" />
                  </div>
                </label>
                
                {whatsappAlert && (
                  <div className="syi-phone-input-wrap">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+234 800 000 0000"
                      value={phoneNumber} 
                      onChange={e => {
                        setPhoneNumber(e.target.value);
                        setError('');
                      }}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem' }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {error && <div className="syi-error" style={{ color: 'var(--non-halal)', fontSize: '0.85rem', background: 'var(--non-halal-bg)', padding: '10px', borderRadius: '8px', marginTop: '12px' }}>{error}</div>}

            <button
              className="syi-cta-btn"
              onClick={() => {
                if (whatsappAlert && !phoneNumber.trim()) {
                  setError('Please provide a phone number for WhatsApp alerts.');
                  return;
                }
                setError('');
                setStep(3);
              }}
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP 3 — RISK PROFILE
            ════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="syi-body" key="step3">
            <button className="syi-back-btn" onClick={() => setStep(2)} disabled={saving}>
              <ArrowLeft size={16} /> Back
            </button>

            <div className="syi-step-hero">
              <div className="syi-icon-badge"><Shield size={22} /></div>
              <div>
                <h2>Your Investment Style</h2>
                <p>Select a risk profile to help us tailor your thematic baskets and portfolio suggestions.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
              
              <label 
                onClick={() => setRiskProfile('conservative')}
                style={{
                  display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  border: riskProfile === 'conservative' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: riskProfile === 'conservative' ? 'var(--primary-50)' : 'white',
                  transition: 'all 0.2s', alignItems: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                  <Shield size={24} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem', marginBottom: '4px' }}>Conservative</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Prioritize dividend-paying, low-volatility halal stocks. Focus on capital preservation.</div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', borderColor: riskProfile === 'conservative' ? 'var(--primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {riskProfile === 'conservative' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </div>
              </label>

              <label 
                onClick={() => setRiskProfile('moderate')}
                style={{
                  display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  border: riskProfile === 'moderate' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: riskProfile === 'moderate' ? 'var(--primary-50)' : 'white',
                  transition: 'all 0.2s', alignItems: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                  <Target size={24} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem', marginBottom: '4px' }}>Moderate</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>A balanced mix of growth and income. Average market volatility.</div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', borderColor: riskProfile === 'moderate' ? 'var(--primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {riskProfile === 'moderate' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </div>
              </label>

              <label 
                onClick={() => setRiskProfile('aggressive')}
                style={{
                  display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  border: riskProfile === 'aggressive' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: riskProfile === 'aggressive' ? 'var(--primary-50)' : 'white',
                  transition: 'all 0.2s', alignItems: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                  <Zap size={24} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem', marginBottom: '4px' }}>Aggressive</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Focus on high-growth halal equities. Willing to accept higher short-term volatility.</div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', borderColor: riskProfile === 'aggressive' ? 'var(--primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {riskProfile === 'aggressive' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </div>
              </label>

            </div>

            {error && <div className="syi-error" style={{ color: 'var(--non-halal)', fontSize: '0.85rem', background: 'var(--non-halal-bg)', padding: '10px', borderRadius: '8px', marginTop: '12px' }}>{error}</div>}

            <button
              className={`syi-cta-btn ${saving ? 'loading' : ''}`}
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? (
                <><span className="syi-spinner" /> Setting up your Irshad…</>
              ) : (
                <><CheckCircle size={18} /> Complete Setup</>
              )}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP 4 — CELEBRATION
            ════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="syi-body syi-celebrate" key="step4">
            <Confetti />

            <div className="syi-celebrate-rings">
              <div className="ring r1" />
              <div className="ring r2" />
              <div className="ring r3" />
              <div className="syi-celebrate-icon">
                <Sparkles size={36} />
              </div>
            </div>

            <div className="syi-celebrate-text">
              <h2>Mabrook! 🎉</h2>
              <p className="syi-celebrate-sub">Your Irshad is all set up. Here's what we're watching for you:</p>
              <div className="syi-celebrate-chips">
                {selectedStocks.map((s, i) => (
                  <div
                    key={s.symbol}
                    className="syi-celebrate-chip"
                    style={{ animationDelay: `${0.1 * i}s` }}
                  >
                    <CheckCircle size={14} /> {s.symbol}
                  </div>
                ))}
              </div>
              <p className="syi-celebrate-note">
                {emailAlert && '📧 Email'}{emailAlert && whatsappAlert && ' & '}{whatsappAlert && '💬 WhatsApp'} alerts activated.
              </p>
            </div>

            <button className="syi-cta-btn celebrate-enter-btn" onClick={() => onComplete?.()}>
              Enter Dashboard <ChevronRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SetYourIrshad;
