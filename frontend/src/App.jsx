import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return children;
    }
    return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return children;
    }
    return !user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/meetings" element={<PrivateRoute><Meetings /></PrivateRoute>} />
        <Route path="/meeting/:id" element={<PrivateRoute><MeetingDetail /></PrivateRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
