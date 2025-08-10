import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Star, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import SeatSelectionModal from './SeatSelectionModal';

const EventCard = ({ event }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  
  const { isAuthenticated } = useAuth();

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('Please sign in to like events');
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      alert('Please sign in to book events');
      return;
    }
    
    setShowSeatModal(true);
  };

  const handleBookingComplete = () => {
    // Refresh the page or update the event data
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Event Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute top-4 left-4">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {event.category}
          </span>
        </div>
        <button
          onClick={handleLike}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-300 fill-current" />
            <span className="text-sm font-semibold">{event.rating}</span>
            <span className="text-sm opacity-75">({event.reviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.date ? new Date(event.date).toLocaleDateString() : 'Date not available'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {event.attendeesCount || event.attendees || 0} attending • {event.availableSpots || (event.capacity - (event.attendeesCount || 0))} seats available
            </span>
          </div>
        </div>

        {/* Price and Booking */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-blue-600">${event.price}</span>
            <span className="text-gray-500 text-sm ml-1">per ticket</span>
          </div>
          <button
            onClick={handleBooking}
            disabled={isBooking}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isBooking
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isBooking ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </span>
            ) : (
              'Book Now'
            )}
          </button>
        </div>
      </div>

      {/* Seat Selection Modal */}
      <SeatSelectionModal
        event={event}
        isOpen={showSeatModal}
        onClose={() => setShowSeatModal(false)}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  );
};

export default EventCard;
