import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, fetchProfile, googleLoginUser, updateProfile } from '../services/api';
import localforage from 'localforage';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    // Listen for global unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('auth_token');
      navigate('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Pre-load from cache for instant render
          const cachedUser = localStorage.getItem('auth_user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            setLoading(false);
          }

          const profile = await fetchProfile();
          const userData = profile.data || profile;
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));

          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register') {
            navigate('/portfolio');
          }
        } catch (error) {
          console.error("Failed to load profile", error);
          // Let the API interceptor handle unauthorized by dispatching the event
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const login = async (credentials) => {
    try {
      const res = await loginUser(credentials);
      if (res.data && res.data.access_token) {
        localforage.removeItem('irshad_portfolio_cache_v10');
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (data) => {
    try {
      const res = await registerUser(data);
      if (res.data && res.data.access_token) {
        localforage.removeItem('irshad_portfolio_cache_v10');
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await googleLoginUser(credential);
      if (res.data && res.data.access_token) {
        localforage.removeItem('irshad_portfolio_cache_v10');
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Google Login failed' 
      };
    }
  };

  const updateUser = async (data) => {
    try {
      const res = await updateProfile(data);
      // ProfileController wraps in ApiResponder: { data: user, message }
      const updatedUser = res?.data ?? res?.user;
      if (updatedUser) {
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localforage.removeItem('irshad_portfolio_cache_v10');
    localStorage.removeItem('irshad_admin_stocks_v1');
    localStorage.removeItem('irshad_admin_products_v1');
    localStorage.removeItem('irshad_admin_alerts_v1');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, loginWithGoogle, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
