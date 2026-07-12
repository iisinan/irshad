import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, fetchProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const profile = await fetchProfile();
          setUser(profile.data);
        } catch (error) {
          console.error("Failed to load profile", error);
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

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
      // Import here or at the top
      const { googleLoginUser } = await import('../services/api');
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

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
