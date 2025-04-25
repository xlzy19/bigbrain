// src/utils/request.js
import axios from 'axios';
import { message } from 'antd';

// Create axios instance
const request = axios.create({
  baseURL: 'http://localhost:5005', // Modify based on the actual backend address
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
request.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    message.error('Request sending failed');
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle error response
    const errorMessage = error.response?.data?.error || error.message || 'Request failed';
    message.error(errorMessage);
    return Promise.reject(error);
  }
);

export default request;
