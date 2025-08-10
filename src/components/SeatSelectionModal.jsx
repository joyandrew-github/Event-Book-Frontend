import { useState, useEffect } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { useAuth } from '../context/AuthContext';

const SeatSelectionModal = ({ event, isOpen, onClose, onBookingComplete }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSeats, setFetchingSeats] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Generate seats based on event capacity
  const totalSeats = event?.capacity || 100;
  const seatsPerRow = 9;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);

  useEffect(() => {
    if (isOpen && event) {
      fetchBookedSeats();
    }
  }, [isOpen, event]);

  const fetchBookedSeats = async () => {
    try {
      setFetchingSeats(true);
      setError('');
      
      // Get the current event's booked seats
      const response = await fetch(`${API_ENDPOINTS.EVENTS}/${event._id}`);
      
      if (response.ok) {
        const data = await response.json();
        const eventData = data.data.event;
        
        // Extract booked seat numbers from attendees
        const booked = eventData.attendees?.map(attendee => attendee.seatNumber).filter(Boolean) || [];
        setBookedSeats(booked);
      } else {
        console.error('Failed to fetch event details');
        setError('Failed to load event information');
      }
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      setError('Failed to load seat information');
    } finally {
      setFetchingSeats(false);
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      return; // Seat is already booked
    }

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBookNow = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Book each selected seat
      for (const seatNumber of selectedSeats) {
        const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${event._id}`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ seatNumber })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to book seat');
        }
      }

      alert(`Successfully booked ${selectedSeats.length} seat(s): ${selectedSeats.join(', ')}`);
      onBookingComplete();
      onClose();
    } catch (error) {
      console.error('Error booking seats:', error);
      setError(error.message || 'Failed to book seats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSeatGrid = () => {
    const grid = [];
    
    for (let row = 0; row < totalRows; row++) {
      const rowSeats = [];
      for (let col = 0; col < seatsPerRow; col++) {
        const seatNumber = row * seatsPerRow + col + 1;
        
        if (seatNumber <= totalSeats) {
          const isBooked = bookedSeats.includes(seatNumber);
          const isSelected = selectedSeats.includes(seatNumber);
          
          rowSeats.push(
            <button
              key={seatNumber}
              onClick={() => handleSeatClick(seatNumber)}
              disabled={isBooked}
              className={`
                w-12 h-12 rounded-lg border-2 text-sm font-medium transition-all duration-200
                ${isBooked 
                  ? 'bg-red-100 border-red-300 text-red-600 cursor-not-allowed' 
                  : isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                }
              `}
              title={isBooked ? `Seat ${seatNumber} - Booked` : `Seat ${seatNumber}`}
            >
              {seatNumber}
            </button>
          );
        }
      }
      grid.push(
        <div key={row} className="flex justify-center gap-2 mb-2">
          {rowSeats}
        </div>
      );
    }
    
    return grid;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Your Seats</h2>
            <p className="text-gray-600 mt-1">{event?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Event Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <p className="text-gray-600">{event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Time:</span>
              <p className="text-gray-600">{event?.time || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <p className="text-gray-600">{event?.location || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Price:</span>
              <p className="text-gray-600">${event?.price || 0} per seat</p>
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="p-6">
          {fetchingSeats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Loading seat information...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchBookedSeats}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 border-2 border-blue-600 rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span>Booked</span>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  {generateSeatGrid()}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">
                  Selected: <span className="font-semibold text-blue-600">{selectedSeats.length}</span> seat(s)
                </p>
                {selectedSeats.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Seats: {selectedSeats.sort((a, b) => a - b).join(', ')}
                  </p>
                )}
                {selectedSeats.length > 0 && (
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    Total: ${(event?.price || 0) * selectedSeats.length}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookNow}
                  disabled={selectedSeats.length === 0 || loading}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                    selectedSeats.length === 0 || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Book Now
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
