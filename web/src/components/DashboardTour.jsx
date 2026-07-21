import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardTour() {
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(true);

  const steps = [
    {
      target: 'body',
      content: (
        <div>
          <h3>Welcome to Irshad!</h3>
          <p>Let's take a quick tour of your new Islamic investment dashboard.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-portfolio',
      content: 'Here you can see your total portfolio value across all your connected or manually added investments.',
      placement: 'bottom',
    },
    {
      target: '#tour-compliance',
      content: 'This is your overall Shariah compliance score. We automatically screen your holdings against strict Islamic finance criteria.',
      placement: 'bottom',
    },
    {
      target: '#tour-quick-actions',
      content: 'Use these quick actions to add new trades, explore the market, or calculate your Zakat obligations.',
      placement: 'bottom',
    },
    {
      target: '#tour-obligations',
      content: 'Your Zakat calculator automatically estimates your annual obligations based on your liquid assets, and alerts you about purification requirements.',
      placement: 'left',
    },
    {
      target: '#tour-search',
      content: 'Looking for a specific stock? Search for any NGX ticker here to see its detailed Shariah analysis.',
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
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'var(--primary)',
          textColor: 'var(--text-dark)',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
        },
        buttonNext: {
          backgroundColor: 'var(--primary)',
          borderRadius: '8px',
          fontWeight: 'bold',
        },
        buttonBack: {
          color: 'var(--text-muted)',
        },
        buttonSkip: {
          color: 'var(--text-muted)',
        }
      }}
    />
  );
}
