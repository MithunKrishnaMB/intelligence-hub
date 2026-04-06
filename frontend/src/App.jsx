import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all your pages
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';
import Login from './pages/Login';
import Register from './pages/Register';

/**
 * PROTECTED ROUTE: 
 * If there is NO token, kick them back to the Login page.
 * If there IS a token, allow them to view the requested component (children).
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * PUBLIC ROUTE:
 * If a user is ALREADY logged in, they shouldn't see the Login/Register pages.
 * Redirect them straight to the Dashboard instead.
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        
        {/* === PUBLIC ROUTES === */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* === SECURE ROUTES === */}
        {/* By wrapping Dashboard in ProtectedRoute, the root URL '/' acts as a bouncer */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meeting/:id" 
          element={
            <ProtectedRoute>
              <MeetingDetail />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback: Catch any weird URLs and send them back to the start */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;