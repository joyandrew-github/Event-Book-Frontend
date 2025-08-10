import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, StarOff, Search, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const Admin = () => {
  console.log('Admin component rendering...'); // Debug log
  
  const { user, isAuthenticated } = useAuth();
  console.log('Auth context values:', { user: user ? JSON.stringify(user) : 'No user', isAuthenticated }); // Debug log
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, eventId: null, eventTitle: '' });
  const [imagePreview, setImagePreview] = useState('');

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    date: '',
    time: '',
    location: '',
    price: 0,
    capacity: 100,
    image: '',
    isActive: true,
    isFeatured: false
  });

  const categories = ['Music', 'Sports', 'Technology', 'Business', 'Education', 'Entertainment', 'Food', 'Other'];

  useEffect(() => {
    console.log('Admin useEffect triggered:', { isAuthenticated, userRole: user?.role, backendHealthy });
    console.log('Condition check:', {
      isAuthenticated,
      userRole: user?.role,
      backendHealthy,
      isAdmin: user?.role === 'admin',
      shouldFetch: isAuthenticated && user?.role === 'admin' && backendHealthy
    });
    if (isAuthenticated && user?.role === 'admin' && backendHealthy && !isFetching) {
      console.log('Fetching events...');
      fetchEvents();
    } else {
      console.log('Not fetching events because:', {
        notAuthenticated: !isAuthenticated,
        notAdmin: user?.role !== 'admin',
        backendNotHealthy: !backendHealthy
      });
    }
  }, [isAuthenticated, user?.role, backendHealthy]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setCheckingBackend(true);
        const healthUrl = `${API_ENDPOINTS.EVENTS.replace('/api/events', '')}/health`;
        console.log('Checking backend health at:', healthUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        const response = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
          console.warn('Backend health check failed');
        }
      } catch (error) {
        setBackendHealthy(false);
        if (error.name === 'AbortError') {
          console.warn('Backend health check timed out after 5 seconds');
        } else {
          console.warn('Backend health check failed with error:', error);
        }
      } finally {
        setCheckingBackend(false);
      }
    };
    
    checkBackendHealth();
  }, []);

  const validateForm = () => {
    const errors = {};
    
    const title = eventForm.title || '';
    const description = eventForm.description || '';
    const date = eventForm.date || '';
    const time = eventForm.time || '';
    const location = eventForm.location || '';
    const price = eventForm.price || 0;
    const capacity = eventForm.capacity || 100;
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    if (!date) {
      errors.date = 'Date is required';
    } else {
      const currentDate = new Date();
      currentDate.setMinutes(currentDate.getMinutes() + 1); // Allow events starting in the next minute
      if (time) {
        const selectedDateTime = new Date(`${date}T${time}:00`);
        if (selectedDateTime <= currentDate) {
          errors.date = 'Event date and time must be at least 1 minute in the future';
        }
      } else {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate <= currentDate) {
          errors.date = 'Event date must be in the future';
        }
      }
    }
    
    if (!time) {
      errors.time = 'Time is required';
    }
    
    if (!location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (price < 0) {
      errors.price = 'Price cannot be negative';
    }
    
    if (capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    console.log('Form validation errors:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchEvents = async () => {
    if (isFetching) {
      console.log('Already fetching events, skipping duplicate call');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      console.log('Fetching events from:', `${API_ENDPOINTS.EVENTS_ADMIN}/all`);
      
      if (!backendHealthy) {
        console.log('Backend not healthy, skipping fetch');
        setLoading(false);
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${API_ENDPOINTS.EVENTS_ADMIN}/all`,
        {
          headers: getAuthHeaders(),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Events response:', data);
        
        if (data && data.data && Array.isArray(data.data.events)) {
          setEvents(data.data.events);
        } else {
          console.error('Unexpected response structure:', data);
          setEvents([]);
          setMessage({ type: 'error', text: 'Invalid response format from server' });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      if (error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Request timed out. Please check if the backend server is running.' });
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ type: 'error', text: 'Cannot connect to server. Please check if the backend is running.' });
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setMessage({ type: 'error', text: 'Network error. Please check your internet connection and try again.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to fetch events' });
      }
      
      setEvents([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!backendHealthy) {
      setMessage({ type: 'error', text: 'Cannot create event: Backend is not connected. Please check your connection and try again.' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      setActionLoading(true);
      // Create a proper date object for the backend validation
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}:00`);
      
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        date: eventDateTime,
        time: eventForm.time,
        location: eventForm.location,
        price: parseFloat(eventForm.price || 0),
        capacity: parseInt(eventForm.capacity || 100),
        image: eventForm.image,
        isActive: eventForm.isActive,
        isFeatured: eventForm.isFeatured
      };
      
      console.log('Sending event data to backend:', eventData);
      console.log('Time field value:', eventForm.time);
      console.log('Time field type:', typeof eventForm.time);
      
      const response = await fetch(
        API_ENDPOINTS.EVENTS,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(eventData)
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Event created successfully!' });
        setShowCreateModal(false);
        resetForm();
        setTimeout(() => {
          if (!isFetching) {
            fetchEvents();
          }
        }, 500);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          throw new Error('Failed to create event - invalid server response');
        }
        
        if (errorData.errors) {
          const backendErrors = {};
          errorData.errors.forEach(err => {
            backendErrors[err.field || err.path] = err.message;
          });
          setFormErrors(backendErrors);
        } else {
          throw new Error(errorData.message || 'Failed to create event');
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ type: 'error', text: 'Cannot connect to server. Please check if the backend is running.' });
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setMessage({ type: 'error', text: 'Network error. Please check your internet connection and try again.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to create event' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setActionLoading(true);
      // Create a proper date object for the backend validation
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}:00`);
      
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        date: eventDateTime,
        time: eventForm.time,
        location: eventForm.location,
        price: parseFloat(eventForm.price),
        capacity: parseInt(eventForm.capacity),
        image: eventForm.image,
        isActive: eventForm.isActive,
        isFeatured: eventForm.isFeatured
      };

      const response = await fetch(
        `${API_ENDPOINTS.EVENTS_ADMIN}/${selectedEvent._id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(eventData)
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Event updated successfully!' });
        setShowEditModal(false);
        setSelectedEvent(null);
        resetForm();
        setTimeout(() => {
          if (!isFetching) {
            fetchEvents();
          }
        }, 500);
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          const backendErrors = {};
          errorData.errors.forEach(err => {
            backendErrors[err.field || err.path] = err.message;
          });
          setFormErrors(backendErrors);
        } else {
          throw new Error(errorData.message || 'Failed to update event');
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update event' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.EVENTS_ADMIN}/${eventId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Event deleted successfully!' });
        setTimeout(() => {
          if (!isFetching) {
            fetchEvents();
          }
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete event' });
    } finally {
      setActionLoading(false);
      setDeleteConfirm({ show: false, eventId: null, eventTitle: '' });
    }
  };

  const confirmDelete = (eventId, eventTitle) => {
    setDeleteConfirm({ show: true, eventId, eventTitle });
  };

  const handleToggleStatus = async (eventId, currentStatus) => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.EVENTS_ADMIN}/${eventId}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: `Event ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        setTimeout(() => {
          if (!isFetching) {
            fetchEvents();
          }
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle event status');
      }
    } catch (error) {
      console.error('Error toggling event status:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to toggle event status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (eventId, currentFeatured) => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.EVENTS_ADMIN}/${eventId}/featured`,
        {
          method: 'PATCH',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: `Event ${!currentFeatured ? 'featured' : 'unfeatured'} successfully!` });
        setTimeout(() => {
          if (!isFetching) {
            fetchEvents();
          }
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle event featured status');
      }
    } catch (error) {
      console.error('Error toggling event featured status:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to toggle event featured status' });
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'Other',
      date: '',
      time: '',
      location: '',
      price: 0,
      capacity: 100,
      image: '',
      isActive: true,
      isFeatured: false
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (event) => {
    console.log('Opening edit modal for event:', event);
    
    if (!event || !event._id) {
      console.error('Invalid event for edit modal:', event);
      return;
    }
    
    setSelectedEvent(event);
    setFormErrors({});
    
    let dateString = '';
    let timeString = '';
    try {
      if (event.date) {
        const eventDate = new Date(event.date);
        if (!isNaN(eventDate.getTime())) {
          dateString = eventDate.toISOString().split('T')[0];
          timeString = eventDate.toISOString().split('T')[1].slice(0, 5);
        }
      }
    } catch (error) {
      console.error('Error parsing event date:', error);
    }
    
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Other',
      date: dateString,
      time: timeString,
      location: event.location || '',
      price: event.price || 0,
      capacity: event.capacity || 100,
      image: event.image || '',
      isActive: event.isActive !== undefined ? event.isActive : true,
      isFeatured: event.isFeatured !== undefined ? event.isFeatured : false
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'Other',
      date: '',
      time: '',
      location: '',
      price: 0,
      capacity: 100,
      image: '',
      isActive: true,
      isFeatured: false
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (!e.target || !name) {
      console.error('Invalid form change event:', e);
      return;
    }
    
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedEvent(null);
    resetForm();
  };

  const filteredEvents = (events || []).filter(event => {
    if (!event || !event.title) return false;
    
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = event.title.toLowerCase().includes(searchLower) ||
                         (event.description && event.description.toLowerCase().includes(searchLower)) ||
                         (event.location && event.location.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

  if (!isAuthenticated) {
    console.log('Authentication check failed:', { isAuthenticated, user: user ? JSON.stringify(user) : 'No user' });
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the admin panel.</p>
          <p className="text-sm text-gray-500 mt-2">Auth status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    console.log('User role check failed:', { userRole: user?.role, expectedRole: 'admin', user: user ? JSON.stringify(user) : 'No user' });
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user?.role || 'None'}</p>
        </div>
      </div>
    );
  }

  if (loading && backendHealthy && !checkingBackend) {
    console.log('Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (checkingBackend) {
    console.log('Showing backend checking state');
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Checking backend connection...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!backendHealthy) {
    console.log('Backend not healthy, showing error state');
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="rounded-full h-16 w-16 border-4 border-red-200 mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Backend Server Not Running</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-medium text-yellow-800 mb-2">To fix this issue:</h4>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Open a new terminal/command prompt</li>
              <li>Navigate to the <code className="bg-yellow-100 px-1 rounded">backend</code> folder</li>
              <li>Run <code className="bg-yellow-100 px-1 rounded">npm start</code> or <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
              <li>Wait for "Server running on port 5000" message</li>
              <li>Come back here and click "Retry Connection"</li>
            </ol>
          </div>
          <p className="text-gray-600 mb-4">The backend server needs to be running to manage events.</p>
          <button
            onClick={() => {
              setCheckingBackend(true);
              const checkBackendHealth = async () => {
                try {
                  const healthUrl = `${API_ENDPOINTS.EVENTS.replace('/api/events', '')}/health`;
                  console.log('Checking backend health at:', healthUrl);
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);
                  const response = await fetch(healthUrl, { signal: controller.signal });
                  clearTimeout(timeoutId);
                  if (response.ok) {
                    setBackendHealthy(true);
                    fetchEvents();
                  } else {
                    setBackendHealthy(false);
                  }
                } catch (error) {
                  setBackendHealthy(false);
                  if (error.name === 'AbortError') {
                    console.warn('Backend health check timed out after 5 seconds');
                  } else {
                    console.warn('Backend health check failed with error:', error);
                  }
                } finally {
                  setCheckingBackend(false);
                }
              };
              checkBackendHealth();
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering main admin dashboard');
  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative">
      {actionLoading && (
        <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage events and user content</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                if (!backendHealthy) {
                  setMessage({ type: 'error', text: 'Cannot create event: Backend is not connected. Please check your connection and try again.' });
                  return;
                }
                openCreateModal();
              }}
              disabled={!backendHealthy}
              className={`px-6 py-3 rounded-lg flex items-center ${
                backendHealthy ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex justify-between items-center">
              <span>{message.text}</span>
              {message.type === 'error' && (
                <button
                  onClick={() => {
                    setMessage({ type: '', text: '' });
                    if (message.text.includes('Cannot connect to server') || message.text.includes('Network error')) {
                      fetchEvents();
                    }
                  }}
                  className="text-sm underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`mb-6 p-4 rounded-lg border ${
          checkingBackend ? 'bg-yellow-50 border-yellow-200' : 
          backendHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                checkingBackend ? 'bg-yellow-500' : 
                backendHealthy ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm ${
                checkingBackend ? 'text-yellow-800' : 
                backendHealthy ? 'text-green-800' : 'text-red-800'
              }`}>
                Backend Status: {checkingBackend ? 'Checking...' : backendHealthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {!backendHealthy && !checkingBackend && (
              <button
                onClick={() => {
                  setCheckingBackend(true);
                  const checkBackendHealth = async () => {
                    try {
                      const healthUrl = `${API_ENDPOINTS.EVENTS.replace('/api/events', '')}/health`;
                      console.log('Checking backend health at:', healthUrl);
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 5000);
                      const response = await fetch(healthUrl, { signal: controller.signal });
                      clearTimeout(timeoutId);
                      if (response.ok) {
                        setBackendHealthy(true);
                      } else {
                        setBackendHealthy(false);
                      }
                    } catch (error) {
                      setBackendHealthy(false);
                      if (error.name === 'AbortError') {
                        console.warn('Backend health check timed out after 5 seconds');
                      } else {
                        console.warn('Backend health check failed with error:', error);
                      }
                    } finally {
                      setCheckingBackend(false);
                    }
                  };
                  checkBackendHealth();
                }}
                className="text-xs underline hover:no-underline text-red-600"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Events ({(filteredEvents || []).length})</h3>
          </div>
          <div className="overflow-x-auto">
            {(filteredEvents || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {!backendHealthy ? 'Backend Connection Issue' : 'No events found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {!backendHealthy 
                    ? 'Cannot load events because the backend server is not accessible. Please check if the backend is running and try again.'
                    : searchTerm 
                      ? `No events match "${searchTerm}"` 
                      : 'Get started by creating your first event'
                  }
                </p>
                {!searchTerm && backendHealthy && (
                  <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Event
                  </button>
                )}
                {!backendHealthy && (
                  <button
                    onClick={() => {
                      setCheckingBackend(true);
                      const checkBackendHealth = async () => {
                        try {
                          const healthUrl = `${API_ENDPOINTS.EVENTS.replace('/api/events', '')}/health`;
                          console.log('Checking backend health at:', healthUrl);
                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 5000);
                          const response = await fetch(healthUrl, { signal: controller.signal });
                          clearTimeout(timeoutId);
                          if (response.ok) {
                            setBackendHealthy(true);
                            fetchEvents();
                          } else {
                            setBackendHealthy(false);
                          }
                        } catch (error) {
                          setBackendHealthy(false);
                          if (error.name === 'AbortError') {
                            console.warn('Backend health check timed out after 5 seconds');
                          } else {
                            console.warn('Backend health check failed with error:', error);
                          }
                        } finally {
                          setCheckingBackend(false);
                        }
                      };
                      checkBackendHealth();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => {
                    if (!event || !event._id || !event.title) {
                      return null;
                    }
                    
                    let timeStr = 'No time';
                    try {
                      const eventDate = new Date(event.date);
                      if (!isNaN(eventDate.getTime())) {
                        timeStr = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                    } catch (error) {
                      console.error('Error parsing time for event:', event._id, error);
                    }
                    
                    return (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg mr-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                              {event.image ? (
                                <img 
                                  className="h-full w-full object-cover" 
                                  src={event.image} 
                                  alt={event.title}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`h-full w-full flex items-center justify-center text-gray-400 text-xs ${event.image ? 'hidden' : 'flex'}`}
                                style={{ display: event.image ? 'none' : 'flex' }}
                              >
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">
                                {event.description ? `${event.description.substring(0, 50)}...` : 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {event.category || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                          </div>
                          <div className="text-sm text-gray-500">{timeStr}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.location || 'No location'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{event.attendeesCount || 0} / {event.capacity || 0}</span>
                            <span className="text-xs text-gray-500">
                              {event.availableSpots || (event.capacity - (event.attendeesCount || 0))} available
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.organizer && typeof event.organizer === 'object' 
                            ? (event.organizer.fullName || event.organizer.firstName || 'N/A')
                            : (event.organizer || 'N/A')
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {event.isFeatured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(event)}
                              disabled={actionLoading}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(event._id, event.isActive)}
                              disabled={actionLoading}
                              className={`${event.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={event.isActive ? 'Deactivate Event' : 'Activate Event'}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (event.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(event._id, event.isFeatured)}
                              disabled={actionLoading}
                              className={`${event.isFeatured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={event.isFeatured ? 'Remove Featured' : 'Make Featured'}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (event.isFeatured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />)}
                            </button>
                            <button
                              onClick={() => confirmDelete(event._id, event.title)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={eventForm.title}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={eventForm.description}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={eventForm.category}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={eventForm.date}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={eventForm.time}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.time && <p className="text-red-500 text-xs mt-1">{formErrors.time}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={eventForm.location}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={eventForm.price}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={eventForm.capacity}
                      onChange={handleFormChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.capacity && <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    name="image"
                    value={eventForm.image}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview:</label>
                      <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-100 border">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm hidden">
                          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-2">Invalid image URL</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={eventForm.isActive}
                      onChange={handleFormChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={eventForm.isFeatured}
                      onChange={handleFormChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event</h3>
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={eventForm.title}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={eventForm.description}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={eventForm.category}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={eventForm.date}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={eventForm.time}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.time && <p className="text-red-500 text-xs mt-1">{formErrors.time}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={eventForm.location}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={eventForm.price}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={eventForm.capacity}
                      onChange={handleFormChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.capacity && <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    name="image"
                    value={eventForm.image}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={eventForm.isActive}
                      onChange={handleFormChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={eventForm.isFeatured}
                      onChange={handleFormChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete "{deleteConfirm.eventTitle}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, eventId: null, eventTitle: '' })}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteEvent(deleteConfirm.eventId);
                    setDeleteConfirm({ show: false, eventId: null, eventTitle: '' });
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
 