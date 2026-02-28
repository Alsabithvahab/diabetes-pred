import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Add a request interceptor to attach the JWT token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = (credentials) => axios.post(`${API_BASE}/auth/login`, credentials);
export const signup = (userData) => axios.post(`${API_BASE}/auth/register`, userData);
export const submitPrediction = (data) => axios.post(`${API_BASE}/predict`, data);
export const getHistory = () => axios.get(`${API_BASE}/history`);
export const getAnalytics = () => axios.get(`${API_BASE}/analytics`);
