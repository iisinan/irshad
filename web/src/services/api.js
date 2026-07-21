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
        window.location.href = '/login';
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

/**
 * Single-request onboarding: bulk-adds all stocks to watchlist AND marks user onboarded.
 * Much faster than N separate addToWatchlist() + updateProfile() calls.
 */
export const onboardUser = async ({ symbols, alert_email, alert_whatsapp, phone_number, risk_profile }) => {
  const response = await api.post('/onboard', { symbols, alert_email, alert_whatsapp, phone_number, risk_profile });
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
  try {
    const cacheKey = 'irshad_stocks_cache_v10';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get('/stocks/ngx');
    // Cache for 5 minutes instead of until 3AM to allow updates
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 5 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error('Error fetching NGX stocks:', error);
    throw error;
  }
};

export const searchStocks = async (query) => {
  const response = await api.get('/stocks/search', { params: { query } });
  return response.data;
};

export const fetchBaskets = async () => {
  try {
    const cacheKey = 'irshad_baskets_cache_v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get('/stocks/baskets');
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 60 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error('Error fetching baskets:', error);
    throw error;
  }
};

export const fetchBasketDetails = async (id) => {
  try {
    const cacheKey = `irshad_basket_${id}_cache_v1`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get(`/stocks/baskets/${id}`);
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 60 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error(`Error fetching basket ${id}:`, error);
    throw error;
  }
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
  try {
    const cacheKey = `irshad_stock_${symbol}_cache_v10`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get(`/stocks/${symbol}`);
    // Cache for 5 minutes to show latest financial highlights
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 5 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    throw error;
  }
};

export const fetchAiAnalysis = async (symbol) => {
  try {
    const cacheKey = `irshad_ai_${symbol}_cache_v10`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get(`/stocks/${symbol}/analysis`);
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 60 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error(`Error fetching AI analysis for ${symbol}:`, error);
    throw error;
  }
};

export const fetchNews = async () => {
  try {
    const cacheKey = 'irshad_news_cache_v9';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get('/news');
    // Cache for 30 minutes to stay fresh
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: Date.now() + 30 * 60 * 1000 }));
    return response.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
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

export default api;
