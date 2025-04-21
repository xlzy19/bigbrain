import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const loginUser = async (credentials) => {
  const response = await api.post('/admin/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/admin/auth/register', userData);
  return response.data;
};

export const logoutUser = async (token) => {
  const response = await api.post(
    '/admin/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};