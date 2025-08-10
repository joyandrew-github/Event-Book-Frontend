# EventBook Frontend

A modern React application for event booking and management.

## Features

- **User Authentication**: Login and signup functionality
- **Event Discovery**: Browse and search events by category
- **Admin Panel**: Full CRUD operations for events (admin only)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Protected Routes**: Role-based access control

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000
- MongoDB running locally

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=https://event-book-backend.onrender.com
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `https://event-book-backend.onrender.comst:5173`

## Troubleshooting

### Events Not Loading

If you see "Failed to load events. Please try again later.":

1. **Check Backend Status**: Ensure the backend server is running on port 5000
2. **Check MongoDB**: Ensure MongoDB is running locally
3. **Check Console**: Open browser dev tools and check for any error messages
4. **Check Network Tab**: Look for failed API requests in the Network tab

### Common Issues

1. **"process is not defined"**: This has been fixed by updating environment variable handling
2. **CORS Errors**: Ensure backend CORS_ORIGIN is set to `https://event-book-backend.onrender.comst:5173`
3. **Authentication Issues**: Check if the backend JWT_SECRET is properly configured

### Backend Requirements

- MongoDB running on `mongodb://localhost:27017/event-booking`
- Backend server running on port 5000
- All required environment variables set in `backend/config.env`

## Project Structure

```
src/
├── components/          # React components
│   ├── Admin.jsx       # Admin panel for event management
│   ├── Bookings.jsx    # User bookings page
│   ├── EventsSection.jsx # Main events display
│   ├── LoginModal.jsx  # Login form
│   ├── Navbar.jsx      # Navigation bar
│   ├── Settings.jsx    # User settings page
│   └── SignupModal.jsx # Signup form
├── context/            # React context
│   └── AuthContext.jsx # Authentication state management
├── config/             # Configuration files
│   └── api.js         # API endpoints and helpers
└── App.jsx            # Main application component
```

## API Integration

The frontend communicates with the backend through the following endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Events**: `/api/events` (public), `/api/events/admin/*` (admin only)
- **Users**: `/api/users/*` (admin only)

## Development

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API
