import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
export const submitPrediction = (data) => axios.post(`${API_BASE}/predict`, data);
export const getHistory = () => axios.get(`${API_BASE}/history`);
export const getAnalytics = () => axios.get(`${API_BASE}/analytics`);
