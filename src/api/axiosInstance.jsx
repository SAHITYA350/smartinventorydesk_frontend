import axios from 'axios';

// Base API URL — reads from env variable in production, falls back to localhost in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Clean token of surrounding quotes if present
      const cleanToken = token.replace(/^"(.*)"$/, '$1').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
   (error) => {
     return Promise.reject(error);
   }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log(`Session expired or unauthorized request. Clear the token.`);
      localStorage.removeItem('token');      
      localStorage.removeItem('user');      
    }
    return Promise.reject(error)
  }
)

export default axiosInstance;