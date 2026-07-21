import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

const CustomTooltip = ({
  continuous,
  index,
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
      style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '20px', 
        padding: '24px', 
        width: '320px', 
        boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        border: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {step.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ background: 'var(--primary-10)', padding: '6px', borderRadius: '8px', color: 'var(--primary)' }}>
            <Sparkles size={16} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{step.title}</h3>
        </div>
      )}
      
      <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        {step.content}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '1px' }}>
          STEP {index + 1}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {index > 0 && (
            <button {...backProps} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', padding: '8px 12px', fontSize: '0.9rem' }}>
              Back
            </button>
          )}
          <button {...primaryProps} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(15,82,87,0.2)' }}>
            {continuous && !isLastStep ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardTour() {
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(true);

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
    }
  ];

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      // Update local state
      const prefs = { ...(user?.preferences || {}), onboarded: true };
      setUser(prev => ({ ...prev, preferences: prefs }));
      
      // Update backend quietly
      try {
        await updateProfile({ preferences: prefs });
      } catch (err) {
        console.error('Failed to update onboarded status', err);
      }
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
