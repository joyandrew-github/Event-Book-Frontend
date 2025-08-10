import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventsSection from './components/EventsSection';
import Footer from './components/Footer';
import Bookings from './components/Bookings';
import Settings from './components/Settings';
import Admin from './components/Admin';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function App() {
  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  // Admin Route component
  const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/" replace />;
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <main>
                <Hero />
                <EventsSection />
              </main>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Bookings />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Settings />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <ErrorBoundary>
                  <Admin />
                </ErrorBoundary>
              </AdminRoute>
            } />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
