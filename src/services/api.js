import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration for different environments
const API_CONFIGS = {
  // For development with physical device (update IP as needed)
  LOCAL_PHYSICAL: 'http://192.168.222.194:3000/api',
  // For Android emulator
  LOCAL_EMULATOR: 'http://10.0.2.2:3000/api',
  // For production with cloud database (update when you deploy)
  PRODUCTION: 'https://your-deployed-backend.herokuapp.com/api'
};

// Choose configuration based on your current setup
const API_BASE_URL = API_CONFIGS.LOCAL_PHYSICAL; // Change this as needed
// const API_BASE_URL = 'http://localhost:3000/api'; // For iOS simulator

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData'
};

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_TOKEN, STORAGE_KEYS.USER_DATA]);
      console.log('Token expired - cleared storage');
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Don't save token on registration - user needs to login after registering
      // This ensures they go through the login flow
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection and make sure the backend server is running.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Save token and user data to AsyncStorage
      if (response.data.success && response.data.data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.data.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection and make sure the backend server is running.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      
      // Update stored user data
      if (response.data.success && response.data.data.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to get profile');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_TOKEN, STORAGE_KEYS.USER_DATA]);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get saved user data
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  // Get token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      return null;
    }
  }
};

// Reports API functions (now connected to real backend)
export const reportsAPI = {
  // Submit a new report with images
  submitReport: async (reportData, images = []) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', reportData.title);
      formData.append('description', reportData.description);
      formData.append('category', reportData.category);
      formData.append('priority', reportData.priority || 'MEDIUM');
      formData.append('location', JSON.stringify(reportData.location));
      formData.append('address', reportData.address || '');
      formData.append('city', reportData.city || '');
      formData.append('state', reportData.state || '');
      formData.append('pincode', reportData.pincode || '');
      formData.append('visibility', reportData.visibility || 'PUBLIC');
      
      if (reportData.tags && reportData.tags.length > 0) {
        formData.append('tags', JSON.stringify(reportData.tags));
      }
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `image_${index}.jpg`,
        });
      });
      
      const response = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to submit report');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Failed to submit report');
      }
    }
  }
};

// Issues API functions
export const issuesAPI = {
  // Get community feed
  getFeed: async (params = {}) => {
    try {
      const response = await api.get('/issues/feed', { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load feed');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get all issues with filters
  getIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues', { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load issues');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get user's own issues
  getMyIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues/my', { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load your issues');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get user's own issues (alias for getMyIssues)
  getUserIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues/my', { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load your issues');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get specific issue
  getIssue: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load issue');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Upvote an issue
  upvoteIssue: async (issueId) => {
    try {
      const response = await api.post(`/issues/${issueId}/upvote`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upvote');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Comment on an issue
  commentOnIssue: async (issueId, text) => {
    try {
      const response = await api.post(`/issues/${issueId}/comment`, { text });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to add comment');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Update an issue
  updateIssue: async (issueId, updateData) => {
    try {
      const response = await api.put(`/issues/${issueId}`, updateData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update issue');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Delete an issue
  deleteIssue: async (issueId) => {
    try {
      const response = await api.delete(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete issue');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const response = await api.get('/issues/stats/summary');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load statistics');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  }
};

// Users API functions
export const usersAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load profile');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update profile');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  },

  // Get dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/users/dashboard');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to load dashboard');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  }
};

export default api;
