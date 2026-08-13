import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { TourProvider } from './context/TourContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '695007449342-h6pllbs2fctnjlnq5tr0j9ktlmoaohed.apps.googleusercontent.com';

// Automatically reload when a dynamic chunk fails to load due to a new deployment
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

import { initAnalytics } from './utils/analytics';
initAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <TourProvider>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </TourProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  </StrictMode>,
);
