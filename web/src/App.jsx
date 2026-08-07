import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Shield, Home, Scale, Info, BookOpen, Settings, LayoutDashboard, Moon, Sun } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './components/AuthPages';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import './index.css';

const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    const refreshKey = 'chunk_reload_' + window.location.pathname;
    try {
      const module = await componentImport();
      sessionStorage.removeItem(refreshKey);
      return module;
    } catch (error) {
      const isChunkError = 
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('Importing a module script failed');

      const alreadyRefreshed = sessionStorage.getItem(refreshKey);

      if (isChunkError && !alreadyRefreshed) {
        sessionStorage.setItem(refreshKey, 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(refreshKey);
      throw error;
    }
  });

const StockDetails = lazyWithRetry(() => import('./components/StockDetails'));
const AdminTickerEditor = lazyWithRetry(() => import('./components/AdminTickerEditor'));
const AaoifiScreening = lazyWithRetry(() => import('./components/AaoifiScreening'));
const Portfolio = lazyWithRetry(() => import('./components/Portfolio'));
const AboutPage = lazyWithRetry(() => import('./components/About'));
const ShariahPage = lazyWithRetry(() => import('./components/Shariah'));
const ResourcesPage = lazyWithRetry(() => import('./components/Resources'));
const Profile = lazyWithRetry(() => import('./components/Profile'));
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const AdminOverview = lazyWithRetry(() => import('./components/AdminOverview'));
const AdminComplianceReviews = lazyWithRetry(() => import('./components/AdminComplianceReviews'));
const AdminUsers = lazyWithRetry(() => import('./components/AdminUsers'));
const ZakatSettingsAdmin = lazyWithRetry(() => import('./components/ZakatSettingsAdmin'));
const Pricing = lazyWithRetry(() => import('./components/Pricing'));
const LandingPage = lazyWithRetry(() => import('./components/LandingPage'));
const TermsPage = lazyWithRetry(() => import('./components/Terms'));
const PrivacyPage = lazyWithRetry(() => import('./components/Privacy'));
const DisclosurePage = lazyWithRetry(() => import('./components/Disclosure'));
const AdminFinancialReviewQueue = lazyWithRetry(() => import('./components/AdminFinancialReviewQueue'));
const DASHBOARD_ROUTES = ['/portfolio', '/profile', '/admin'];

/* ─── Animated Routes Wrapper ─────────────────────────────── */
const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  // Using location.pathname as a key triggers a re-render and animation on route change
  return (
    <div key={location.pathname} className="route-fade-wrapper">
      <Routes location={location}>
        {children}
      </Routes>
    </div>
  );
};

import { trackPageView, identifyUser } from './utils/analytics';

/* ─── Document Title Updater & Analytics ──────────────────── */
const DocumentTitleUpdater = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      identifyUser(user);
    }
  }, [user]);

  useEffect(() => {
    const path = location.pathname;
    
    // Track Page View
    trackPageView(path);

    let title = 'Irshad - Islamic Finance & Shariah Screening';
    if (path === '/') title = 'Home | Irshad';
    else if (path.startsWith('/market')) title = 'Market Screener | Irshad';
    else if (path.startsWith('/portfolio')) title = 'My Portfolio | Irshad';
    else if (path.startsWith('/profile')) title = 'Profile & Settings | Irshad';
    else if (path.startsWith('/login')) title = 'Login | Irshad';
    else if (path.startsWith('/register')) title = 'Register | Irshad';
    else if (path.startsWith('/shariah')) title = 'Shariah Framework | Irshad';
    else if (path.startsWith('/resources')) title = 'Resources | Irshad';
    else if (path.startsWith('/about')) title = 'About Us | Irshad';
    else if (path.startsWith('/terms')) title = 'Terms of Service | Irshad';
    else if (path.startsWith('/privacy')) title = 'Privacy Policy | Irshad';
    else if (path.startsWith('/disclosure')) title = 'General Disclosures & Risk | Irshad';
    document.title = title;
  }, [location]);
  return null;
};

/* ─── Theme Toggle ────────────────────────────────────────── */
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('irshad_theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('irshad_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <button onClick={toggle} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Toggle Theme">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

/* ─── Navbar ──────────────────────────────────────────────── */
const TopNavbar = () => {
  const location = useLocation();
  // Hide top navbar on dashboard / portfolio / profile — those use the sidebar
  const isDashboard = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinkClass = (path) =>
    `nav-link ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : ''}`;

  return (
    <>
      {isDashboard ? null : (
      <nav className="top-navbar" style={{ 
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        borderBottomColor: scrolled ? 'rgba(0, 109, 100, 0.1)' : 'transparent',
        boxShadow: scrolled ? '0 4px 24px rgba(0, 109, 100, 0.06)' : 'none'
      }}>
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.svg"
            alt="Irshad Logo"
            style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.14rem', color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
            Irshad
          </span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/shariah" className={navLinkClass('/shariah')}>Shariah Framework</Link>
          <Link to="/resources" className={navLinkClass('/resources')}>Resources</Link>
          <Link to="/about" className={navLinkClass('/about')}>About Us</Link>
          {user && (
            <Link to="/portfolio" className={navLinkClass('/portfolio')}>Dashboard</Link>
          )}
          {(user?.role === 'admin' || user?.role === 'scholar') && (
            <Link to="/admin" className={navLinkClass('/admin')} style={{ color: 'var(--primary)' }}>Admin</Link>
          )}
          <div className="nav-divider" />
          <ThemeToggle />
          <div className="nav-divider" />
          {!loading && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--primary-100)' }}>
                    {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.79rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                    {user.first_name || user.name || 'Profile'}
                  </span>
                </Link>
                <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link hover-lift">Log In</Link>
                <Link to="/register" className="btn-primary hover-lift" style={{ padding: '12px 24px', fontSize: '0.85rem', borderRadius: '100px' }}>
                  Get Started
                </Link>
              </>
            )
          )}
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>
      )}

      {/* Mobile drawer — also hidden on dashboard */}
      {!isDashboard && (<div className={`mobile-nav-drawer ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={navLinkClass('/')} onClick={() => setMenuOpen(false)}>
          <Home size={18} /> Home
        </Link>
        <Link to="/shariah" className={navLinkClass('/shariah')} onClick={() => setMenuOpen(false)}>
          <Scale size={18} /> Shariah Framework
        </Link>
        <Link to="/about" className={navLinkClass('/about')} onClick={() => setMenuOpen(false)}>
          <Info size={18} /> About Us
        </Link>
        <Link to="/resources" className={navLinkClass('/resources')} onClick={() => setMenuOpen(false)}>
          <BookOpen size={18} /> Resources
        </Link>
        <div style={{ padding: '16px 24px' }}>
          <ThemeToggle />
        </div>

        {user && (
          <Link to="/portfolio" className={navLinkClass('/portfolio')} onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}
        {(user?.role === 'admin' || user?.role === 'scholar') && (
          <Link to="/admin" className={navLinkClass('/admin')} onClick={() => setMenuOpen(false)}>
            <Settings size={18} /> Admin
          </Link>
        )}
        
        <div className="mobile-nav-auth">
          {!loading && (
            user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '14px 16px', background: 'var(--bg-section)', borderRadius: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                    {user.first_name || user.name || 'Profile'}
                  </span>
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="btn-secondary" style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>Log In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>Get Started →</Link>
              </>
            )
          )}
        </div>
      </div>
      )}
    </>
  );
};




/* ─── App Shell ──────────────────────────────────────────── */
function App() {
  const { loading: authLoading } = useAuth();

  // Handle the seamless handoff from the native HTML splash screen
  useEffect(() => {
    const splash = document.getElementById('irshad-splash');
    if (!splash) return;

    if (!authLoading) {
      splash.classList.add('splash-hidden');
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
      setTimeout(() => splash.remove(), 600); // Wait for transition
    }
  }, [authLoading]);

  // Once auth is loaded, we can render the app. The native splash will fade over it.
  if (authLoading) {
    return null; // The native HTML splash is still visible
  }

  return (
    <>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <DocumentTitleUpdater />
            <TopNavbar />
            {/* {user && <StockTicker />} */}
            <main style={{ flex: 1 }}>
              <Suspense fallback={
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary-100)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    <Shield size={24} color="var(--primary)" style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.5px' }}>Loading Irshad...</p>
                </div>
              }>
                <AnimatedRoutes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/shariah" element={<ShariahPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/disclosure" element={<DisclosurePage />} />
                  <Route path="/disclosures" element={<Navigate to="/disclosure" replace />} />
                  <Route path="/market" element={<Navigate to="/portfolio" replace />} />
                  <Route path="/market/:symbol" element={
                    <DashboardLayout><StockDetails /></DashboardLayout>
                  } />
                  <Route path="/market/:symbol/aaoifi" element={
                    <DashboardLayout><AaoifiScreening /></DashboardLayout>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <AdminOverview />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/alerts" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/compliance-reviews" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <AdminComplianceReviews />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <AdminUsers />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/resources" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <ResourcesPage />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/zakat-settings" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <ZakatSettingsAdmin />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financial-queue" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <AdminFinancialReviewQueue />
                      </AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/portfolio" element={
                    <DashboardLayout><Portfolio /></DashboardLayout>
                  } />
                  <Route path="/profile" element={
                    <DashboardLayout><Profile /></DashboardLayout>
                  } />
                  <Route path="/admin/tickers/:symbol" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout><AdminTickerEditor /></AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/tickers/:symbol/view" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout><StockDetails /></AdminLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="*" element={<NotFound />} />
                </AnimatedRoutes>
              </Suspense>
            </main>
          </div>
      </ErrorBoundary>
    </>
  );
}

export default App;
