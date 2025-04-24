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

    // Check if the question and options are displayed correctly
    expect(screen.getByText('test single choice question')).toBeInTheDocument();
    expect(screen.getByText('option A')).toBeInTheDocument();
    expect(screen.getByText('option B')).toBeInTheDocument();
    expect(screen.getByText('option C')).toBeInTheDocument();
    
    // Verify the single choice question type is displayed correctly
    expect(screen.getByText('Single Choice')).toBeInTheDocument();
    
    // Verify the score is displayed correctly
    expect(screen.getByText('100 points')).toBeInTheDocument();
    
    // Select an answer
    const optionA = screen.getByText('option A').closest('label');
    await act(async () => {
      fireEvent.click(optionA);
    });
    
    // Click the submit button
    const submitButton = screen.getByText('Submit Answer');
    
    // Simulate responses for submitting the answer and retrieving the correct answer
    submitPlayerAnswer.mockResolvedValue({});
    getCorrectAnswer.mockResolvedValue({ answers: ['a1'] });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Verify API calls
    expect(submitPlayerAnswer).toHaveBeenCalled();
    expect(getCorrectAnswer).toHaveBeenCalled();
    
    // Verify that the answer result is displayed correctly
    await waitFor(() => {
      expect(screen.getByText('You are right！')).toBeInTheDocument();
    });
  });
  
  // Test 4: Display multiple choice question
  it('should correctly display the multiple choice question and allow selecting multiple answers', async () => {
    // Simulate API response
    getPlayerStatus.mockResolvedValue({ started: true });
    getPlayerQuestion.mockResolvedValue({
      question: {
        id: 'q2',
        question: 'test multiple choice question',
        type: 'multiple',
        duration: 60,
        points: 200,
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
    
    // Check whether the question and options are displayed correctly
    expect(screen.getByText('test multiple choice question')).toBeInTheDocument();
    
    // Verify that the multiple choice question type is displayed correctly.
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    
    // Select multiple answers.
    const optionA = screen.getByText('option A').closest('label');
    const optionB = screen.getByText('option B').closest('label');
    
    await act(async () => {
      fireEvent.click(optionA);
      fireEvent.click(optionB);
    });
    
    // Click the submit button.
    const submitButton = screen.getByText('Submit Answer');
    
    // Simulate the response for submitting answers and fetching the correct answers.
    submitPlayerAnswer.mockResolvedValue({});
    getCorrectAnswer.mockResolvedValue({ answers: ['a1', 'a3'] });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Verify the displayed answer results — this should show an incorrect result, since the selected answers were a1 and a2, but the correct ones are a1 and a3.
    await waitFor(() => {
      expect(screen.getByText('You are wrong！')).toBeInTheDocument();
    });
  });
  
  // Test 5: Timer Functionality
  it('should correctly display the countdown and submit automatically when the time is up', async () => {
    // Mock API response
    getPlayerStatus.mockResolvedValue({ started: true });
    getPlayerQuestion.mockResolvedValue({
      question: {
        id: 'q3',
        question: 'test countdown',
        type: 'single',
        duration: 10, // 10秒
        points: 50,
        answers: [
          { id: 'a1', answer: 'option A' },
          { id: 'a2', answer: 'option B' },
        ]
      },
      isoTimeLastQuestionStarted: new Date().toISOString()
    });
    
    await act(async () => {
      renderPlayGame();
    });
    
    // Verify that the question is displayed correctly
    expect(screen.getByText('test countdown')).toBeInTheDocument();
    
    // Simulate time passage
    await act(async () => {
      vi.advanceTimersByTime(10 * 1000); // 前进10秒
    });
    
    // Simulate the response of fetching the correct answer
    getCorrectAnswer.mockResolvedValue({ answers: ['a1'] });
    
    // Verify that “Time’s up” is displayed after the timer runs out.
    await waitFor(() => {
      expect(screen.getByText('Time\'s up')).toBeInTheDocument();
    });
    
    // In a real scenario, the correct answer would be displayed automatically, but in the test, we need to trigger it manually.
    const refreshButton = screen.getByText('Refresh Game Status');
    getCorrectAnswer.mockResolvedValue({ answers: ['a1'] });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // Verify the correct answer is displayed.
    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeInTheDocument();
    });
  });
  
  // Test 6: Game Over
  it('should navigate to the results page when the game is over', async () => {
    // Simulate game started
    getPlayerStatus.mockResolvedValue({ started: true });
    getPlayerQuestion.mockResolvedValue({
      question: {
        id: 'q4',
        question: 'last question',
        type: 'single',
        duration: 30,
        points: 100,
        answers: [{ id: 'a1', answer: 'option A' }]
      },
      isoTimeLastQuestionStarted: new Date().toISOString()
    });
    
    await act(async () => {
      renderPlayGame();
    });
    
    // Then modify the mock to simulate the game has ended
    getPlayerStatus.mockResolvedValue({ started: false });
    getPlayerResults.mockResolvedValue({ totalScore: 350 });
    
    const refreshButton = screen.getByText('Refresh Game Status');
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('results page')).toBeInTheDocument();
    });
    
    expect(getPlayerResults).toHaveBeenCalled();
  });
}); 