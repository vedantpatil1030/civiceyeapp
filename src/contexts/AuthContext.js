import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has a valid token
      const token = await authAPI.getToken();
      console.log('AuthContext - Found token:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('AuthContext - No token, showing login');
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      // Try to get user data
      const userData = await authAPI.getUserData();
      if (userData) {
        console.log('AuthContext - Found user data:', userData.email);
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        // Token exists but no user data, try to fetch from server
        try {
          console.log('AuthContext - Fetching profile from server');
          const response = await authAPI.getProfile();
          if (response.success) {
            console.log('AuthContext - Profile fetched successfully');
            setUser(response.data.user);
            setIsLoggedIn(true);
          } else {
            throw new Error('Failed to get profile');
          }
        } catch (error) {
          console.log('Failed to fetch profile, logging out:', error.message);
          await authAPI.logout();
          setIsLoggedIn(false);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
