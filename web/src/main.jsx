import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id.apps.googleusercontent.com';

import { initAnalytics } from './utils/analytics';
initAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  </StrictMode>,
);
