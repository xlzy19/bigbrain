import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlayGame from '../pages/PlayGame';

vi.mock('../services/playerApi', () => ({
  getPlayerStatus: vi.fn(),
  getPlayerQuestion: vi.fn(),
  submitPlayerAnswer: vi.fn(),
  getCorrectAnswer: vi.fn(),
  getPlayerResults: vi.fn(),
}));

import { 
  getPlayerStatus, 
  getPlayerQuestion, 
  submitPlayerAnswer, 
  getCorrectAnswer,
  getPlayerResults 
} from '../services/playerApi';

// mock timer
vi.useFakeTimers();

describe('PlayGame component test', () => {
  // reset the mock functions before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // helper function to render the PlayGame component
  const renderPlayGame = (playerId = '123') => {
    return render(
      <MemoryRouter initialEntries={[`/play/${playerId}`]}>
        <Routes>
          <Route path="/play/:playerId" element={<PlayGame />} />
          <Route path="/play/results/:playerId" element={<div>结果页面</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  // Test 1: Game not started state
  it('should display the waiting for the game to start information when the game is not started', async () => {
    // Simulate API response indicating the game has not started
    getPlayerStatus.mockResolvedValue({ started: false });
    
    await act(async () => {
      renderPlayGame();
    });
    
    // Check if the “waiting for the game to start” message is displayed
    expect(screen.getByText('Waiting for the game to start')).toBeInTheDocument();
    
    // Verify the API call
    expect(getPlayerStatus).toHaveBeenCalledWith('123');
  });
  
  // Test 2: Waiting for the next question state
  it('should display the waiting for the next question information when the game has started but there is no question', async () => {
    // Simulate API response indicating the game has started
    getPlayerStatus.mockResolvedValue({ started: true });
    // But fetching the question fails
    getPlayerQuestion.mockRejectedValue(new Error('No question yet'));
    
    await act(async () => {
      renderPlayGame();
    });
    
    // Check if the “waiting for the next question” message is displayed
    expect(screen.getByText('Waiting for the next question')).toBeInTheDocument();
  });
  
  // Test 3: Display single choice question
    it('should correctly display the single choice question and allow selecting answers', async () => {
    // Simulate API response
    getPlayerStatus.mockResolvedValue({ started: true });
    getPlayerQuestion.mockResolvedValue({
      question: {
        id: 'q1',
        question: 'test single choice question',
        type: 'single',
        duration: 30,
        points: 100,
        answers: [
          { id: 'a1', answer: 'option A' },
          { id: 'a2', answer: 'option B' },
          { id: 'a3', answer: 'option C' },
        ]
      },
      isoTimeLastQuestionStarted: new Date().toISOString()
    });
    
    await act(async () => {
      renderPlayGame();
    });

})})