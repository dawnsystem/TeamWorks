import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get stored token
const getToken = () => localStorage.getItem('token');

// Create axios instance with auth
const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const taskSubscriptionAPI = {
  // Subscribe to a task
  subscribe: (taskId: string) =>
    axiosInstance.post(`/tasks/${taskId}/subscribe`),

  // Unsubscribe from a task
  unsubscribe: (taskId: string) =>
    axiosInstance.delete(`/tasks/${taskId}/subscribe`),

  // Check subscription status
  checkSubscription: (taskId: string) =>
    axiosInstance.get<{ subscribed: boolean }>(`/tasks/${taskId}/subscription`),

  // Get user's subscriptions
  getUserSubscriptions: () =>
    axiosInstance.get('/subscriptions'),
};
