import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = '/';
  axios.defaults.withCredentials = true;

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/user');
          console.log('Fetched user on load:', response.data);
          setCurrentUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      await logout(); // Clear previous state
      const response = await axios.post('/api/auth/login', { username, password });
      const { token: newToken, user } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      console.log('Logged in user:', user);
      return user;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      console.log('Registered user:', user);
      return user;
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout request failed', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/api/auth/user', userData);
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Profile update failed', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};