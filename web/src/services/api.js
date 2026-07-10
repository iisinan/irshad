import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
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

export const registerUser = async (data) => {
  const response = await api.post('/register', data);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const fetchPortfolio = async () => {
  const response = await api.get('/portfolio');
  return response.data;
};

export const addHolding = async (data) => {
  const response = await api.post('/portfolio', data);
  return response.data;
};

export const removeHolding = async (id) => {
  const response = await api.delete(`/portfolio/${id}`);
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
    const cacheKey = 'irshad_stocks_cache_v2';
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
    const cacheKey = `irshad_stock_${symbol}_cache_v2`;
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

export default api;
