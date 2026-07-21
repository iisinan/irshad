import posthog from 'posthog-js';
import ReactGA from 'react-ga4';

export const initAnalytics = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  
  if (posthogKey) {
    posthog.init(posthogKey, { api_host: posthogHost });
  }

  const gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID;
  if (gaTrackingId) {
    ReactGA.initialize(gaTrackingId);
  }
};

export const trackPageView = (path) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture('$pageview', { $current_url: path });
  }
  if (import.meta.env.VITE_GA_TRACKING_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const identifyUser = (user) => {
  if (!user) return;
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.first_name || user.name,
    });
  }
};
