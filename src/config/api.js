// API Configuration
export const API_BASE_URL ='https://event-book-backend.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GET_ME: `${API_BASE_URL}/api/auth/me`,
  
  // Events endpoints
  EVENTS: `${API_BASE_URL}/api/events`,
  EVENTS_ADMIN: `${API_BASE_URL}/api/events/admin`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/api/users`,
  
  // Booking endpoints
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('eventbook_token');
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
