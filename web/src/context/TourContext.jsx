import React, { createContext, useContext, useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Determine if the tour should run based on the cached preferences in the user object
    if (user) {
      const prefs = user.preferences || {};
      
      // Check if user is a new user (account created within the last 24 hours)
      const isNewUser = user.created_at ? (new Date() - new Date(user.created_at)) < 24 * 60 * 60 * 1000 : true;
      
      // Only auto-start for new users who haven't completed the tour, and only on the portfolio page
      if (isNewUser && !prefs.has_completed_tour && window.location.pathname.startsWith('/portfolio')) {
        
        // Fetch or load cached tour data
        const fetchTourData = async () => {
          try {
            const cachedData = localStorage.getItem('irshad_tour_data');
            if (cachedData) {
              setSteps(JSON.parse(cachedData));
            }

            // Always fetch in background to keep cache fresh without blocking
            const response = await fetch('/tourData.json');
            const data = await response.json();
            
            setSteps(data);
            localStorage.setItem('irshad_tour_data', JSON.stringify(data));
          } catch (error) {
            console.error('Failed to load tour data:', error);
          }
        };

        fetchTourData().then(() => {
          // Start tour after a brief delay to allow UI to render completely
          setTimeout(() => setRun(true), 1500);
        });
      }
    }
  }, [user]);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      
      // Trigger confetti only if the user actually finished the tour
      if (status === STATUS.FINISHED) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D1A562', '#10B981', '#FFFFFF']
        });
      }

      // Save completion state to user preferences
      if (user && !user.preferences?.has_completed_tour) {
        try {
          // Update local state optimisticly
          if (!user.preferences) user.preferences = {};
          user.preferences.has_completed_tour = true;
          
          await axios.put('/api/profile', {
            preferences: { has_completed_tour: true }
          });
        } catch (error) {
          console.error('Failed to save tour completion status:', error);
        }
      }
    }
  };

  const startTour = () => {
    setRun(true);
  };

  const CustomTooltip = ({
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep,
    size,
  }) => {
    return (
      <div
        {...tooltipProps}
        style={{
          background: 'var(--bg)',
          borderRadius: '20px',
          padding: '24px',
          width: '320px',
          maxWidth: 'calc(100vw - 40px)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--sans)',
          position: 'relative',
          animation: 'tourTooltipFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes tourTooltipFadeIn {
            from { opacity: 0; transform: translateY(8px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        <button
          {...closeProps}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '50%',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--body-bg)';
            e.currentTarget.style.color = 'var(--text-dark)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {index === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(209, 165, 98, 0.15), rgba(209, 165, 98, 0.05))',
            color: 'var(--primary)',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(209, 165, 98, 0.1) inset'
          }}>
            <Compass size={24} strokeWidth={2.5} />
          </div>
        )}

        {step.title && (
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-dark)',
            margin: '0 0 12px 0',
            paddingRight: '24px',
            lineHeight: 1.2,
            letterSpacing: '-0.3px'
          }}>
            {step.title}
          </h3>
        )}

        <div style={{
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: 'var(--text-body)',
          marginBottom: '24px',
          fontWeight: 500,
        }}>
          {step.content}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto'
        }}>
          {/* Progress Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {index + 1} of {size}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Array.from({ length: size }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === index ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === index ? 'var(--primary)' : 'var(--border)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isLastStep && (
              <button
                {...closeProps}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--body-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Skip
              </button>
            )}
            {index > 0 && (
              <button
                {...backProps}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--body-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Back
              </button>
            )}
            <button
              {...primaryProps}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'transform 0.1s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
              }}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TourContext.Provider value={{ startTour, isTourRunning: run }}>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={run}
        scrollToFirstStep
        showProgress={false}
        showSkipButton={false}
        steps={steps}
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: 'var(--primary)',
            backgroundColor: 'var(--bg)',
            textColor: 'var(--text-dark)',
            arrowColor: 'var(--bg)',
            overlayColor: 'rgba(0, 0, 0, 0.65)',
            spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.65)',
          },
          spotlight: {
            borderRadius: '12px',
          },
          tooltip: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '24px',
          },
          buttonNext: {
            backgroundColor: 'var(--primary)',
            borderRadius: '100px',
            padding: '10px 20px',
            fontWeight: 600,
          },
          buttonBack: {
            color: 'var(--text-muted)',
            fontWeight: 600,
          },
          buttonSkip: {
            color: 'var(--text-muted)',
            fontWeight: 600,
          },
          tooltipTitle: {
            fontWeight: 800,
            fontSize: '1.2rem',
            marginBottom: '12px',
          },
          tooltipContent: {
            fontSize: '0.95rem',
            lineHeight: '1.5',
            color: 'var(--text-muted)',
          }
        }}
      />
      {children}
    </TourContext.Provider>
  );
};
