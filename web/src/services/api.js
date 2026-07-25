import axios from 'axios';
import axiosRetry from 'axios-retry';

const PROD_API = 'https://irshad-z8us.onrender.com/api/v1';
const api = axios.create({
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || PROD_API) : PROD_API,
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
  const baseUrl = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://irshad.test') : 'https://irshad-z8us.onrender.com';
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
  // Clear any cached profile/portfolio if needed (currently we don't aggressively cache the profile API itself, but if we do in the future this is where we clear it)
  localStorage.removeItem('irshad_portfolio_cache_v10');
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
  const cacheKey = 'irshad_portfolio_cache_v10';
  try {
    const response = await api.get('/portfolio');
    localStorage.setItem(cacheKey, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    // On failure, return cached data if available
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
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
  localStorage.removeItem('irshad_portfolio_cache_v10'); // Invalidate portfolio cache to reflect new watchlist state
  return response.data;
};

export const addMultipleToWatchlist = async (symbols, alert_inapp = false, alert_push = false, alert_email = false) => {
  const response = await api.post('/watchlist/bulk', { symbols, alert_inapp, alert_push, alert_email });
  localStorage.removeItem('irshad_portfolio_cache_v10');
  return response.data;
};

/**
 * Single-request onboarding: bulk-adds all stocks to watchlist AND marks user onboarded.
 * Much faster than N separate addToWatchlist() + updateProfile() calls.
 */
export const onboardUser = async ({ symbols, alert_email, alert_inapp, alert_push, phone_number, risk_profile }) => {
  const response = await api.post('/onboard', { symbols, alert_email, alert_inapp, alert_push, phone_number, risk_profile });
  localStorage.removeItem('irshad_portfolio_cache_v10'); // Invalidate portfolio/watchlist cache on onboarding
  return response.data; // { message, user }
};

export const updateWatchlist = async (symbol, data) => {
  const response = await api.put(`/watchlist/${symbol}`, data);
  localStorage.removeItem('irshad_portfolio_cache_v10');
  return response.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await api.delete(`/watchlist/${symbol}`);
  localStorage.removeItem('irshad_portfolio_cache_v10');
  return response.data;
};

const getNext3AM = () => {
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  if (now > next3AM) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  return next3AM.getTime();
};

export const fetchSectors = async () => {
  const res = await api.get('/sectors');
  return res.data;
};

export const fetchNgxStocks = async () => {
  const response = await api.get('/stocks/ngx');
  return response.data;
};

export const searchStocks = async (query) => {
  const response = await api.get('/stocks/search', { params: { query } });
  return response.data;
};

export const fetchBaskets = async () => {
  const response = await api.get('/stocks/baskets');
  return response.data;
};

export const fetchBasketDetails = async (id) => {
  const response = await api.get(`/stocks/baskets/${id}`);
  return response.data;
};

export const createBasket = async (data) => {
  const response = await api.post('/stocks/baskets', data);
  // Clear baskets cache so new one shows up immediately
  localStorage.removeItem('irshad_baskets_cache_v1');
  return response.data;
};

export const updateBasket = async (id, data) => {
  const response = await api.put(`/stocks/baskets/${id}`, data);
  // Clear baskets cache and individual cache
  localStorage.removeItem('irshad_baskets_cache_v1');
  localStorage.removeItem(`irshad_basket_${id}_cache_v1`);
  return response.data;
};

export const deleteBasket = async (id) => {
  const response = await api.delete(`/stocks/baskets/${id}`);
  // Clear baskets cache so it is removed immediately
  localStorage.removeItem('irshad_baskets_cache_v1');
  return response.data;
};

export const investInBasket = async (id, amount) => {
  const response = await api.post(`/stocks/baskets/${id}/invest`, { amount });
  // Clear portfolio and history caches so the new investments show up
  localStorage.removeItem('irshad_portfolio_cache_v10');
  return response.data;
};

export const fetchStockDetails = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}`);
  return response.data;
};

export const fetchAiAnalysis = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}/analysis`);
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
  return new Promise(resolve => setTimeout(() => resolve({
    data: {
      totalTracked: 156,
      shariahCompliant: 89,
      nonCompliant: 48,
      underReview: 19,
      annualReportsProcessed: 142,
      newsAnalyzed: 384,
      lastUpdated: new Date().toISOString()
    }
  }), 800));
};

export const fetchRecentScreenings = async () => {
  return new Promise(resolve => setTimeout(() => resolve({
    data: [
      { id: 1, symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', status: 'halal', date: '2026-07-24T10:30:00Z' },
      { id: 2, symbol: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', status: 'halal', date: '2026-07-23T15:45:00Z' },
      { id: 3, symbol: 'NB', name: 'Nigerian Breweries Plc', status: 'non-halal', date: '2026-07-22T09:15:00Z' },
      { id: 4, symbol: 'OANDO', name: 'Oando Plc', status: 'doubtful', date: '2026-07-21T14:20:00Z' },
      { id: 5, symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', status: 'non-halal', date: '2026-07-20T11:10:00Z' },
      { id: 6, symbol: 'BUACEMENT', name: 'BUA Cement Plc', status: 'halal', date: '2026-07-19T16:05:00Z' },
    ]
  }), 800));
};

export const fetchLatestReports = async () => {
  return new Promise(resolve => setTimeout(() => resolve({
    data: [
      { id: 101, symbol: 'MTNN', name: 'MTN Nigeria', year: 2025, date: '2026-07-15', type: 'Audited Financial Statements' },
      { id: 102, symbol: 'NESTLE', name: 'Nestle Nigeria Plc', year: 2025, date: '2026-07-10', type: 'Annual Report' },
      { id: 103, symbol: 'GTCO', name: 'Guaranty Trust Holding', year: 2025, date: '2026-07-08', type: 'Audited Financial Statements' },
      { id: 104, symbol: 'AIRTELAFRI', name: 'Airtel Africa Plc', year: 2025, date: '2026-07-02', type: 'Annual Report' }
    ]
  }), 800));
};

export const fetchBusinessNewsOverview = async () => {
  return new Promise(resolve => setTimeout(() => resolve({
    data: [
      { id: 201, symbol: 'DANGCEM', headline: 'Dangote Cement announces successful completion of ₦100bn Series 1 Bond', date: '2026-07-20', source: 'NGX Announcements', summary: 'This new debt issuance will impact the interest-bearing debt ratio in their next AAOIFI screening.' },
      { id: 202, symbol: 'NB', headline: 'Nigerian Breweries secures new credit facility to manage FX losses', date: '2026-07-18', source: 'BusinessDay Nigeria', summary: 'Increased debt burden continues to negatively affect AAOIFI compliance standing.' },
      { id: 203, symbol: 'PRESCO', headline: 'Presco Plc expands agricultural operations into new states', date: '2026-07-12', source: 'Reuters', summary: 'Core business activity remains fundamentally halal with expansion in pure agricultural sectors.' }
    ]
  }), 800));
};

export default api;
