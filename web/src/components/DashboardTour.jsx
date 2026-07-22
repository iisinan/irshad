import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

const CustomTooltip = ({
  continuous,
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep
}) => {
  return (
    <div 
      {...tooltipProps} 
      className="animate-slide-up"
      style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(24px)',
        borderRadius: '24px', 
        padding: '28px', 
        width: '340px', 
        boxShadow: '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top gradient highlight */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gold-grad)' }} />

      {step.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: 'var(--primary-10)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
            <Sparkles size={18} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>{step.title}</h3>
        </div>
      )}
      
      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
        {step.content}
      </div>
      
      {/* Progress Dots */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', alignSelf: 'center' }}>
        {Array.from({ length: size }).map((_, i) => (
          <div key={i} style={{ 
            width: i === index ? '18px' : '6px', 
            height: '6px', 
            borderRadius: '6px', 
            background: i === index ? 'var(--primary)' : 'var(--bg-section)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Step {index + 1} of {size}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isLastStep && (
            <button {...skipProps} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', padding: '10px 14px', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-dark)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Skip
            </button>
          )}
          {index > 0 && (
            <button {...backProps} style={{ background: 'var(--bg-section)', border: 'none', color: 'var(--text-dark)', fontWeight: 700, cursor: 'pointer', padding: '10px 14px', fontSize: '0.9rem', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-section)'}>
              Back
            </button>
          )}
          <button {...primaryProps} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem', borderRadius: '10px', boxShadow: '0 8px 16px rgba(15,82,87,0.25)', fontWeight: 800, transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(15,82,87,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(15,82,87,0.25)'; }}>
            {continuous && !isLastStep ? 'Next' : 'Finish Tour'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardTour({ onClose }) {
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(true);

  // Immediately mark as onboarded so it doesn't reappear on other pages if they navigate away
  useEffect(() => {
    if (!user?.preferences?.onboarded) {
      const prefs = { ...(user?.preferences || {}), onboarded: true };
      setUser(prev => ({ ...prev, preferences: prefs }));
      updateProfile({ preferences: prefs }).catch(err => console.error('Failed to update onboarded status', err));
    }
  }, [user, setUser]);

  const steps = [
    {
      target: 'body',
      title: 'Welcome to Irshad!',
      content: 'Let\'s take a quick 1-minute tour of your new Islamic investment dashboard to get you started.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-portfolio',
      title: 'Your Wealth',
      content: 'Here you can track your total portfolio value across all connected brokerages or manually added investments.',
      placement: 'bottom',
    },
    {
      target: '#tour-compliance',
      title: 'Shariah Compliance',
      content: 'This is your overall portfolio compliance score. We automatically screen your holdings against strict Islamic finance criteria.',
      placement: 'bottom',
    },
    {
      target: '#tour-quick-actions',
      title: 'Quick Actions',
      content: 'Use these shortcuts to add new trades, explore the Halal market, or easily calculate your Zakat obligations.',
      placement: 'bottom',
    },
    {
      target: '#tour-obligations',
      title: 'Zakat & Purification',
      content: 'Your Zakat calculator automatically estimates your annual obligations based on your liquid assets, and alerts you about dividend purification.',
      placement: 'left',
    },
    {
      target: '#tour-search',
      title: 'Instant Search',
      content: 'Looking for a specific stock? Search for any NGX ticker here to see its detailed, real-time Shariah analysis.',
      placement: 'bottom',
    },
    {
      target: '#tour-nav-market',
      title: 'Market Screener',
      content: 'Explore the entire Nigerian Stock Exchange. We highlight which stocks are Halal, Doubtful, or Non-Halal in real-time.',
      placement: 'right',
    },
    {
      target: '#tour-nav-watchlist',
      title: 'Your Watchlist',
      content: 'Save stocks here to monitor their price movements and receive instant alerts if their Shariah compliance status changes.',
      placement: 'right',
    },
    {
      target: '#tour-nav-baskets',
      title: 'Thematic Baskets',
      content: 'Don\'t want to pick individual stocks? Invest in expertly curated collections of Halal stocks with a single click.',
      placement: 'right',
    },
    {
      target: '#tour-nav-resources',
      title: 'Islamic Finance Hub',
      content: 'Access premium lectures and educational resources to deepen your understanding of Halal investing.',
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = async (data) => {
    const { status, action } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      if (onClose) onClose();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={false}
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          overlayColor: 'rgba(13, 27, 42, 0.7)',
          zIndex: 9999,
        }
      }}
    />
  );
}
