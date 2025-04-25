// src/config.js
export const API_BASE_URL = 'http://localhost:5005'; // Modify based on the actual backend address

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  GAME: '/game/:gameId',
  QUESTION: '/game/:gameId/question/:questionId',
  SESSION: '/session/:sessionId',
  PLAY: '/play',
  PLAY_JOIN: '/play/:sessionId',
  PLAY_GAME: '/play/game/:playerId',
  PLAY_RESULTS: '/play/results/:playerId',
};