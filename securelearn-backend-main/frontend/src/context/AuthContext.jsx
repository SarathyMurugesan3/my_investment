import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (role) => {
    try {
      if (role === 'STUDENT') {
        const response = await api.get('/api/student/profile');
        setUser(response.data);
      } else if (role === 'ADMIN') {
        // Admins also can check profile, or we can fetch it. Let's retrieve from backend or construct.
        // Wait, does backend support /api/student/profile for admin? Let's check or build local.
        // If profile endpoint fails or doesn't exist for admin, we can default. Let's see:
        try {
          const response = await api.get('/api/student/profile');
          setUser(response.data);
        } catch {
          // If no admin profile API, set user details from login payload
          const savedEmail = localStorage.getItem('email');
          setUser({ email: savedEmail, role: 'ADMIN' });
        }
      }
    } catch (err) {
      console.error("Error fetching profile", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      fetchProfile(role);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, refreshToken, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      
      await fetchProfile(role);
      return { success: true, role };
    } catch (error) {
      setLoading(false);
      throw error.response?.data || 'Login failed';
    }
  };

  const register = async (name, email, password, role, adminId) => {
    try {
      await api.post('/api/auth/register', { name, email, password, role, adminId });
      return { success: true };
    } catch (error) {
      throw error.response?.data || 'Registration failed';
    }
  };

  const logout = () => {
    // Call backend logout asynchronously (client doesn't need to block if it fails)
    api.post('/api/auth/logout').catch(() => {});
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
