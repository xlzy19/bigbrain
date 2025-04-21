// src/services/gamerequest.js

import request from '../utils/request';
export const getAllGames = () => request.get('/admin/games');


export const createGame = (data) => request.put('/admin/games', {
  games: [{
    id: Math.floor(Math.random() * 90000000) + 10000000, // Generate an 8-digit random number as ID
    name: data.name,
    owner: data.owner, // From the email saved during login
    questions: data.questions
  }]
});

export const updateGame = (gameId, data) => request.put('/admin/games', {
  games: [{
    id: gameId,
    name: data.name,
    owner: data.owner,
    questions: data.questions
  }]
})

export const deleteGame = (gameId) => request.delete(`/admin/game/${gameId}`);


export const startGameSession = (gameId) => request.post(`/admin/game/${gameId}/mutate`, {
  mutationType: 'START',
});


export const advanceGameSession = (gameId) => request.post(`/admin/game/${gameId}/mutate`, {
  mutationType: 'ADVANCE',
  answerAvailable: true,
});


export const endGameSession = (gameId) => request.post(`/admin/game/${gameId}/mutate`, {
  mutationType: 'END',
});


export const getSessionStatus = (sessionId) => request.get(`/admin/session/${sessionId}/status`);


export const getSessionResults = (sessionId) => request.get(`/admin/session/${sessionId}/results`);

