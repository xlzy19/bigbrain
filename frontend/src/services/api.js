// src/services/api.js
import request from '../utils/request';

// Auth API
export const authAPI = {
  login: (data) => request.post('/admin/auth/login', data),
  register: (data) => request.post('/admin/auth/register', data),
  logout: () => request.post('/admin/auth/logout'),
};

// Game API
export const gameAPI = {
  getAllGames: () => request.get('/admin/games'),
  getGame: (gameId) => request.get(`/admin/game/${gameId}`),
  createGame: (data) => request.post('/admin/game/new', data),
  updateGame: (gameId, data) => request.put(`/admin/game/${gameId}`, data),
  deleteGame: (gameId) => request.delete(`/admin/game/${gameId}`),
  startSession: (gameId) => request.post(`/admin/game/${gameId}/mutate`, { mutationType: 'START' }),
  advanceSession: (gameId) => request.post(`/admin/game/${gameId}/mutate`, {
    mutationType: 'ADVANCE',
    answerAvailable: true,
  }),
  endSession: (gameId) => request.post(`/admin/game/${gameId}/mutate`, { mutationType: 'END' }),
  getSessionStatus: (sessionId) => request.get(`/admin/session/${sessionId}/status`),
  getSessionResults: (sessionId) => request.get(`/admin/session/${sessionId}/results`),
};

// Player API
export const playerAPI = {
  joinSession: (sessionId, data) => request.post(`/play/join/${sessionId}`, data),
  getStatus: (playerId) => request.get(`/play/${playerId}/status`),
  getQuestion: (playerId) => request.get(`/play/${playerId}/question`),
  submitAnswer: (playerId, data) => request.put(`/play/${playerId}/answer`, data),
  getAnswer: (playerId) => request.get(`/play/${playerId}/answer`),
  getResults: (playerId) => request.get(`/play/${playerId}/results`),
};