import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser, fetchProfile, googleLoginUser, updateProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
          const profile = await fetchProfile();
          setUser(profile.data);
          if (location.pathname === '/login' || location.pathname === '/register') {
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
  }, [location.pathname, navigate]);

  const login = async (credentials) => {
    try {
      const res = await loginUser(credentials);
      if (res.data && res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
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
        localStorage.setItem('auth_token', res.data.access_token);
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
        localStorage.setItem('auth_token', res.data.access_token);
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, loginWithGoogle, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
