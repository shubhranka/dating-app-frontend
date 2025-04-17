import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add functions for each backend endpoint call
// Example:
export const loginUser = (data: any) => api.post('/auth/login', data);
export const signupUser = (data: any) => api.post('/auth/signup', data);
export const getMyProfile = () => api.get('/profile');
export const updateMyProfile = (data: any) => api.put('/profile', data);
export const getPendingMatches = () => api.get('/matches/pending');
export const getActiveMatches = () => api.get('/matches/active');
export const getMessagesForMatch = (matchId: string) => api.get(`/matches/${matchId}/messages`); // Needs backend implementation
export const getRevealedName = (matchId: string) => api.get(`/matches/${matchId}/reveal/name`);
export const getRevealedInterestPhoto = (matchId: string) => api.get(`/matches/${matchId}/reveal/interest-photo`);
export const getRevealedMainPhoto = (matchId: string) => api.get(`/matches/${matchId}/reveal/main-photo`);
export const submitVibeCheck = (matchId: string, choice: 'YES' | 'NO') => api.post(`/matches/${matchId}/vibe-check`, { choice });
export const uploadProfileMedia = (endpoint: string, formData: FormData) => api.post(`/profile/${endpoint}`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});


// ... add other API functions as needed

export default api;