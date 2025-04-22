// src/services/playerApi.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const joinSession = async (sessionId, playerName) => {
  const response = await api.post(`/play/join/${sessionId}`, {
    name: playerName,
  });
  return response.data;
};

export const getPlayerStatus = async (playerId) => {
  const response = await api.get(`/play/${playerId}/status`);
  return response.data;
};

export const getPlayerQuestion = async (playerId) => {
  const response = await api.get(`/play/${playerId}/question`);
  return response.data;
};

export const submitPlayerAnswer = async (playerId, answers) => {
  const response = await api.put(`/play/${playerId}/answer`, {
    answers,
  });
  return response.data;
};

export const getPlayerResults = async (playerId) => {
  const response = await api.get(`/play/${playerId}/results`);
  return response.data;
};

export const getCorrectAnswer = async (playerId) => {
  const response = await api.get(`/play/${playerId}/answer`);
  return response.data;
};