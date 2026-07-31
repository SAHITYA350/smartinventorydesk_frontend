import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { user: userData, token: jwtToken } = response.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);

      setLoading(false);

      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (
    name,
    email,
    password,
    role = 'customer',
    phoneNumber = '',
    DOB = '',
    profileImage = ''
  ) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        name,
        email,
        password,
        role,
        phoneNumber,
        DOB,
        profileImage,
      });
      const { user: userData, token: jwtToken } = response.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);

      setLoading(false);
      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const updateUser = (updatedUserData) => {
    const newUserState = { ...user, ...updatedUserData };
    setUser(newUserState);
    localStorage.setItem('user', JSON.stringify(newUserState));
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
