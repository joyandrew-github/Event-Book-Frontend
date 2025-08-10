    import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Ticket, Search, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user's real bookings from API
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserBookings();
    }
  }, [isAuthenticated, user?.id]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message?.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message?.text]);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.BOOKINGS, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        // Ensure we have an array of bookings
        const bookingsData = data.data?.bookings;
        
        if (Array.isArray(bookingsData)) {
          // Validate each booking object
          const validBookings = bookingsData.filter(booking => {
            if (!booking || typeof booking !== 'object') {
              return false;
            }
            
            // Ensure this is a processed booking, not a raw attendee object
            if (booking.user && booking.bookedAt && booking.status && !booking.eventTitle) {
              return false;
            }
            
            // Ensure required properties exist and are primitive values
            return booking.eventTitle && 
                   booking.location && 
                   booking.status &&
                   typeof booking.eventTitle === 'string' &&
                   typeof booking.location === 'string' &&
                   typeof booking.status === 'string';
          });
          
          setBookings(validBookings);
        } else {
          console.error('Bookings data is not an array:', bookingsData);
          setBookings([]);
          setMessage({ type: 'error', text: 'Invalid data format received from server' });
        }
      } else {
        try {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData?.message || 'Failed to fetch bookings' });
        } catch (parseError) {
          setMessage({ type: 'error', text: 'Failed to fetch bookings' });
        }
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to fetch bookings. Please try again.' });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (eventId) => {
    if (!eventId) {
      setMessage({ type: 'error', text: 'Invalid booking ID' });
      return;
    }
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Booking cancelled successfully!' });
        // Refresh bookings
        fetchUserBookings();
      } else {
        try {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData?.message || 'Failed to cancel booking' });
        } catch (parseError) {
          setMessage({ type: 'error', text: 'Failed to cancel booking' });
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to cancel booking. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    if (!status || typeof status !== 'string') return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (!booking || typeof booking !== 'object') {
      return false;
    }
    
    const matchesSearch = booking.eventTitle.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         booking.location.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) : [];

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please sign in to view your bookings.</p>
        </div>
      </div>
    );
  }

  if (loading || !Array.isArray(bookings)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage and track your event bookings</p>
        </div>

        {/* Message Display */}
        {message?.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message?.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events or locations..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value || '')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus || 'all'}
                onChange={(e) => setFilterStatus(e.target.value || 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={fetchUserBookings}
                disabled={loading || actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {!Array.isArray(filteredBookings) || filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {(searchTerm && searchTerm.trim() !== '') || (filterStatus && filterStatus !== 'all')
                ? 'Try adjusting your search or filter criteria.'
                : 'You haven\'t made any bookings yet. Start exploring events!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              // Skip invalid bookings
              if (!booking || typeof booking !== 'object') {
                return null;
              }
              
              // Ensure this is a processed booking, not a raw attendee object
              if (booking.user && booking.bookedAt && booking.status && !booking.eventTitle) {
                return null;
              }
              
              // Validate required properties
              if (!booking.eventTitle || !booking.location || !booking.status) {
                return null;
              }
              
              // Ensure all properties are primitive values
              if (typeof booking.eventTitle === 'object' || typeof booking.location === 'object' || typeof booking.status === 'object') {
                return null;
              }
              
              const key = booking.id || `booking-${index}`;
              return (
                <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{booking.eventTitle}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'Date not available'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{booking.eventTime || 'Time not available'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{booking.attendees || 0} {(booking.attendees || 0) === 1 ? 'attendee' : 'attendees'}</span>
                        </div>
                      </div>
                      
                                             <div className="flex items-center justify-between text-sm text-gray-500">
                         <div className="flex items-center">
                           <Ticket className="h-4 w-4 mr-2" />
                           <span>{booking.ticketType || 'General Admission'}</span>
                           {booking.seatNumber && (
                             <span className="ml-2 text-blue-600 font-medium">• Seat {booking.seatNumber}</span>
                           )}
                         </div>
                         <span>Booked on {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Date not available'}</span>
                       </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        ${booking.price || 0}
                      </div>
                      <div className="space-y-2">
                        {booking.status === 'confirmed' && (
                          <>
                            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              View Ticket
                            </button>
                            <button 
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={actionLoading || !booking.id}
                              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading ? (
                                <span className="flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Cancelling...
                                </span>
                              ) : (
                                'Cancel Booking'
                              )}
                            </button>
                          </>
                        )}
                        {booking.status === 'pending' && (
                          <>
                            <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                              Check Status
                            </button>
                            <button 
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={actionLoading || !booking.id}
                              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading ? (
                                <span className="flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Cancelling...
                                </span>
                              ) : (
                                'Cancel Booking'
                              )}
                            </button>
                          </>
                        )}
                        {booking.status === 'cancelled' && (
                          <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                            Book Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
