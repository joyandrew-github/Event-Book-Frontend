import { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('eventbook_user');
        const storedToken = localStorage.getItem('eventbook_token');
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('eventbook_user');
        localStorage.removeItem('eventbook_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (response.status === 400 && data.errors) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(data.message || 'Login failed');
      }

      if (data.status === 'success' && data.data) {
        const { user: userData, token } = data.data;
        
        // Store user data and token
        localStorage.setItem('eventbook_user', JSON.stringify(userData));
        localStorage.setItem('eventbook_token', token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (response.status === 400 && data.errors) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(data.message || 'Registration failed');
      }

      if (data.status === 'success' && data.data) {
        const { user: newUser, token } = data.data;
        
        // Store user data and token
        localStorage.setItem('eventbook_user', JSON.stringify(newUser));
        localStorage.setItem('eventbook_token', token);
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  };

  const logout = () => {
    // Call backend logout endpoint if needed
    // For now, just clear local storage
    localStorage.removeItem('eventbook_user');
    localStorage.removeItem('eventbook_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('eventbook_user', JSON.stringify(updatedUser));
    }
  };

  // Function to get auth token for API calls
  const getAuthToken = () => {
    return localStorage.getItem('eventbook_token');
  };

  // Function to check if token is expired
  const isTokenExpired = () => {
    const token = getAuthToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  // Function to refresh user data from backend
  const refreshUserData = async () => {
    const token = getAuthToken();
    if (!token || isTokenExpired()) {
      logout();
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.GET_ME, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          const userData = data.data;
          setUser(userData);
          localStorage.setItem('eventbook_user', JSON.stringify(userData));
        }
      } else {
        // Token might be invalid, logout user
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      logout();
    }
  };

  const value = { 
    user, 
    isAuthenticated, 
    loading, 
    login, 
    signup, 
    logout, 
    updateUser,
    getAuthToken,
    isTokenExpired,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
