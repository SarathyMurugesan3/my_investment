import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import Blocked from './pages/Blocked';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import ContentDetail from './pages/student/ContentDetail';
import ExamActive from './pages/student/ExamActive';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ContentManagement from './pages/admin/ContentManagement';
import ExamManagement from './pages/admin/ExamManagement';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {/* Do not render Navbar on Active Proctored Exam page or Blocked page */}
      {user && !user.blocked && !window.location.pathname.includes('/active') && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace /> : <Register />} />
        <Route path="/blocked" element={<Blocked />} />

        {/* Student Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ContentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/active"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ExamActive />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ContentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ExamManagement />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
