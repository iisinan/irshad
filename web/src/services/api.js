import axios from 'axios';

const PROD_API = 'https://irshad-k3el.onrender.com/api/v1';
const api = axios.create({
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || PROD_API) : PROD_API,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Attach token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const fetchPortfolio = async () => {
  const cacheKey = 'irshad_portfolio_cache_v9';
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

export const removeHolding = async (id) => {
  const response = await api.delete(`/portfolio/${id}`);
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

export const addToWatchlist = async (symbol) => {
  const response = await api.post('/watchlist', { symbol });
  return response.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await api.delete(`/watchlist/${symbol}`);
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

export const fetchNgxStocks = async () => {
  try {
    const cacheKey = 'irshad_stocks_cache_v9';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get('/stocks/ngx');
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: getNext3AM() }));
    return response.data;
  } catch (error) {
    console.error('Error fetching NGX stocks:', error);
    throw error;
  }
};

export const fetchStockDetails = async (symbol) => {
  try {
    const cacheKey = `irshad_stock_${symbol}_cache_v8`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get(`/stocks/${symbol}`);
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: getNext3AM() }));
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    throw error;
  }
};

export const fetchAiAnalysis = async (symbol) => {
  try {
    const cacheKey = `irshad_ai_${symbol}_cache_v8`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    }

    const response = await api.get(`/stocks/${symbol}/analysis`);
    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, expiry: getNext3AM() }));
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

export default api;
