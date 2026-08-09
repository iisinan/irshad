import axios from 'axios';
import axiosRetry from 'axios-retry';
import localforage from 'localforage';

// Force use of the Railway backend in production since Cloudflare Pages has the old Render URL cached in VITE_API_URL
const PROD_API = 'https://irshad-backend-production.up.railway.app/api/v1';
const API_BASE = import.meta.env.DEV && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : PROD_API;
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Configure automatic retries for network resilience
export const formatLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  // Fallback to prod or local URL
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '') : 'https://irshad-backend-production.up.railway.app';
  return `${baseUrl.replace(/\/api\/v1$/, '')}${url}`;
};

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500);
  }
});

// Attach token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirecting if already on auth pages
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthPage) {
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        // Fallback for non-React contexts or before React handles it
        setTimeout(() => {
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const googleLoginUser = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post('/register', data);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/profile', data);
  localforage.removeItem('irshad_portfolio_cache');
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/account');
  return response.data;
};

export const resendVerification = async () => {
  const response = await api.post('/email/verification-notification');
  return response.data;
};

export const fetchPortfolio = async () => {
  const cacheKey = 'irshad_portfolio_cache';
  try {
    const response = await api.get('/portfolio');
    await localforage.setItem(cacheKey, response.data);
    return response.data;
  } catch (error) {
    // On failure, return cached data if available
    const cached = await localforage.getItem(cacheKey);
    if (cached) return cached;
    throw error;
  }
};

export const addHolding = async (data) => {
  const response = await api.post('/portfolio', data);
  return response.data;
};

export const addBulkHoldings = async (holdings) => {
  const response = await api.post('/portfolio/bulk', { holdings });
  return response.data;
};

export const removeHolding = async (id) => {
  const response = await api.delete(`/portfolio/${id}`);
  return response.data;
};

export const linkBroker = async (brokerName) => {
  const response = await api.post('/broker/link', { broker_name: brokerName });
  return response.data;
};

export const updateHolding = async (id, data) => {
  const response = await api.put(`/portfolio/${id}`, data);
  return response.data;
};

export const fetchWatchlist = async () => {
  const response = await api.get('/watchlist');
  return response.data;
};

export const addToWatchlist = async (symbol, alert_whatsapp = false, alert_email = false) => {
  const response = await api.post('/watchlist', { symbol, alert_whatsapp, alert_email });
  localforage.removeItem('irshad_portfolio_cache'); // Invalidate portfolio cache to reflect new watchlist state
  return response.data;
};

export const addMultipleToWatchlist = async (symbols, alert_inapp = false, alert_push = false, alert_email = false) => {
  const response = await api.post('/watchlist/bulk', { symbols, alert_inapp, alert_push, alert_email });
  localforage.removeItem('irshad_portfolio_cache');
  return response.data;
};

/**
 * Single-request onboarding: bulk-adds all stocks to watchlist AND marks user onboarded.
 * Much faster than N separate addToWatchlist() + updateProfile() calls.
 */
export const onboardUser = async ({ symbols, alert_email, alert_inapp, alert_push, phone_number, risk_profile }) => {
  const response = await api.post('/onboard', { symbols, alert_email, alert_inapp, alert_push, phone_number, risk_profile });
  localforage.removeItem('irshad_portfolio_cache'); // Invalidate portfolio/watchlist cache on onboarding
  return response.data; // { message, user }
};

export const updateWatchlist = async (symbol, data) => {
  const response = await api.put(`/watchlist/${symbol}`, data);
  localforage.removeItem('irshad_portfolio_cache');
  return response.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await api.delete(`/watchlist/${symbol}`);
  localforage.removeItem('irshad_portfolio_cache');
  return response.data;
};

export const fetchSectors = async () => {
  const res = await api.get('/sectors');
  return res.data;
};

export const fetchNgxStocks = async () => {
  // Add a cache-buster so Cloudflare CDN or the browser never returns a stale empty list
  const response = await api.get('/stocks/ngx', { params: { _cb: Date.now() } });
  return response.data;
};

export const searchStocks = async (query) => {
  const response = await api.get('/stocks/search', { params: { query } });
  return response.data;
};


export const fetchStockDetails = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}`, { params: { _cb: Date.now() } });
  return response.data;
};

export const fetchAiAnalysis = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}/analysis`);
  return response.data;
};

export const chatAboutStock = async (symbol, question) => {
  const response = await api.post(`/stocks/${symbol}/chat`, { question });
  return response.data;
};

export const fetchComplianceChanges = async () => {
  const response = await api.get('/stocks/compliance-changes');
  return response.data;
};

export const fetchPortfolioMovers = async () => {
  const response = await api.get('/portfolio/movers');
  return response.data;
};

export const fetchAaoifiScreening = async (symbol) => {
  try {
    const response = await api.get(`/stocks/${symbol}/aaoifi-screening`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching AAOIFI screening for ${symbol}:`, error);
    throw error;
  }
};

export const fetchNews = async () => {
  const response = await api.get('/news');
  return response.data;
};

export const fetchPriceAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const setPriceAlert = async (symbol, targetPrice) => {
  const response = await api.post(`/stocks/${symbol}/alerts`, { target_price: targetPrice });
  return response.data;
};

export const deletePriceAlert = async (id) => {
  const response = await api.delete(`/alerts/${id}`);
  return response.data;
};

export const fetchHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const fetchProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

export const fetchAdminUsers = async (page = 1, search = '') => {
  const response = await api.get(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
  return response.data;
};

export const createAdminUser = async (data) => {
  const response = await api.post('/admin/users', data);
  return response.data;
};

export const updateAdminUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// Admin Ticker Management
export const updateTickerAbout = async (symbol, data) => {
  const response = await api.put(`/admin/stocks/${symbol}`, data);
  return response.data;
};

export const addTickerNews = async (symbol, data) => {
  const response = await api.post(`/admin/stocks/${symbol}/news`, data);
  return response.data;
};

export const deleteTickerNews = async (symbol, newsId) => {
  const response = await api.delete(`/admin/stocks/${symbol}/news/${newsId}`);
  return response.data;
};

export const overrideStockStatus = async (symbol, data) => {
  const response = await api.put(`/stocks/${symbol}/status`, data);
  return response.data;
};

export const updateAaoifiData = async (symbol, data) => {
  const response = await api.put(`/stocks/${symbol}/aaoifi`, data);
  return response.data;
};

export const createResource = async (data) => {
  const response = await api.post('/resources', data);
  return response.data;
};

export const updateResource = async (id, data) => {
  const response = await api.put(`/resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`);
  return response.data;
};

// Global Settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.put('/admin/settings', { settings });
  return response.data;
};

// ==========================================
// MOCK ENDPOINTS FOR PUBLIC OVERVIEW DASHBOARD
// ==========================================
export const fetchOverviewStats = async () => {
  return await api.get('/public/stats');
};

export const fetchRecentScreenings = async () => {
  return await api.get('/public/recent-screenings');
};

export const fetchLatestReports = async () => {
  return await api.get('/public/latest-reports');
};

export const fetchBusinessNewsOverview = async () => {
  return await api.get('/public/business-news');
};

export default api;

// ==========================================
// UPDATES — News & Insights
// ==========================================

export const fetchUpdatesNews = async () => {
  const response = await api.get('/updates/news');
  return response.data;
};

export const fetchDigestPreference = async () => {
  const response = await api.get('/updates/digest');
  return response.data;
};

export const updateDigestPreference = async (prefs) => {
  const response = await api.put('/updates/digest', prefs);
  return response.data;
};

// ==========================================
// INBOX — User Notifications
// ==========================================

export const fetchInboxNotifications = async (params = {}) => {
  const response = await api.get('/notifications/inbox', { params });
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const archiveNotification = async (id) => {
  const response = await api.put(`/notifications/${id}/archive`);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

