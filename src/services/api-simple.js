import axios from 'axios';

// Base URL for your backend
// Use 10.0.2.2 for Android emulator (maps to localhost on host machine)
const API_BASE_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple auth API without AsyncStorage (for testing)
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        console.error('Network error:', error.request);
        throw new Error('Network error. Please check your connection and make sure the backend server is running.');
      } else {
        console.error('Request error:', error.message);
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        console.error('Network error:', error.request);
        throw new Error('Network error. Please check your connection and make sure the backend server is running.');
      } else {
        console.error('Request error:', error.message);
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  // Test connection to backend
  testConnection: async () => {
    try {
      const response = await axios.get('http://10.0.2.2:3000/');
      console.log('Backend connection test:', response.data);
      return response.data;
    } catch (error) {
      console.error('Backend connection failed:', error);
      throw new Error('Cannot connect to backend server');
    }
  }
};

export default api;
