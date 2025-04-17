// Use your actual backend URL
// If using Android emulator, localhost might be 10.0.2.2
// If using physical device on same network, use your machine's local IP
export const API_BASE_URL = 'https://dating-app-backend-7l3c.onrender.com/api';
export const WEBSOCKET_URL = 'https://dating-app-backend-7l3c.onrender.com'; // Base URL for Socket.IO

// Define Checkpoint thresholds (match backend values if fixed)
export const CHECKPOINT_1_SCORE = 5;
export const CHECKPOINT_2_SCORE = 15;
export const CHECKPOINT_3_SCORE = 30;
export const MAX_PROGRESS_SCORE = 40; // Example max score for the bar visualization