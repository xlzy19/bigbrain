import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SessionResultsView from '../components/session/SessionResultsView';

describe('SessionResultsView Component', () => {
  // Sample test data
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is the capital of France?',
      type: 'single',
      points: 100,
      answers: [
        { id: 'a1', answer: 'Paris', correct: true },
        { id: 'a2', answer: 'London', correct: false },
        { id: 'a3', answer: 'Berlin', correct: false }
      ]
    },
    {
      id: 'q2',
      question: 'Which of these are primary colors?',
      type: 'multiple',
      points: 200,
      answers: [
        { id: 'a4', answer: 'Red', correct: true },
        { id: 'a5', answer: 'Blue', correct: true },
        { id: 'a6', answer: 'Green', correct: false },
        { id: 'a7', answer: 'Yellow', correct: true }
      ]
    }
  ];

  const mockResults = {
    players: [
      {
        name: 'Player1',
        answers: {
          q1: ['a1'], // Correct
          q2: ['a4', 'a5', 'a7'] // Correct
        },
        score: 300
      },
      {
        name: 'Player2',
        answers: {
          q1: ['a2'], // Incorrect
          q2: ['a4', 'a5'] // Partially correct
        },
        score: 100
      },
      {
        name: 'Player3',
        answers: {
          q1: ['a1'], // Correct
          q2: ['a4', 'a5', 'a6'] // Incorrect
        },
        score: 100
      }
    ],
    averageScore: 166.67,
    totalQuestions: 2
  };

  // Helper function to render component with required props
  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <SessionResultsView
          results={mockResults}
          questions={mockQuestions}
          {...props}
        />
      </BrowserRouter>
    );
  };

  // Test 1: Basic Rendering
  it('should render the leaderboard with player scores', () => {
    renderComponent();
    
    // Check for leaderboard title
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    
    // Check for player names and scores
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
    
    // Check for scores
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getAllByText('100').length).toBe(2); // Two players with score 100
  });
  
  // Test 2: Statistics Section
  it('should display correct statistics information', () => {
    renderComponent();
    
    // Check for statistics section
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    
    // Check for average score
    const averageScoreText = screen.getByText(/average score/i);
    expect(averageScoreText).toBeInTheDocument();
    expect(averageScoreText.textContent).toContain('166.67');
    
    // Check for total questions
    const totalQuestionsText = screen.getByText(/total questions/i);
    expect(totalQuestionsText).toBeInTheDocument();
    expect(totalQuestionsText.textContent).toContain('2');
    
    // Check for total players
    const totalPlayersText = screen.getByText(/total players/i);
    expect(totalPlayersText).toBeInTheDocument();
    expect(totalPlayersText.textContent).toContain('3');
  });
  
  // Test 3: Question Analysis
  it('should display question analysis with correct rates', () => {
    renderComponent();
    
    // Check for question analysis section
    expect(screen.getByText('Question Analysis')).toBeInTheDocument();
    
    // Check first question appears
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    
    // Check second question appears
    expect(screen.getByText('Which of these are primary colors?')).toBeInTheDocument();
    
    // Check for correct rates
    // First question: 2 out of 3 players got it right = 66.67%
    // Second question: 1 out of 3 players got it right = 33.33%
    const correctRates = screen.getAllByText(/correct rate:/i);
    expect(correctRates.length).toBe(2);
  });
  
  // Test 4: Player Detail View
  it('should show player details when clicking on a player', () => {
    renderComponent();
    
    // Initially, detailed player view should not be visible
    expect(screen.queryByText('Player Performance')).not.toBeInTheDocument();
    
    // Click on the first player
    const player1Row = screen.getByText('Player1').closest('tr');
    fireEvent.click(player1Row);
    
    // Now player detail view should be visible
    expect(screen.getByText('Player Performance')).toBeInTheDocument();
    expect(screen.getByText('Player: Player1')).toBeInTheDocument();
    
    // Should show the questions and whether they answered correctly
    const questionResults = screen.getAllByText(/correctly|incorrectly/i);
    expect(questionResults.length).toBe(2); // One for each question
  });
  
  // Test 5: Empty Results
  it('should handle empty results gracefully', () => {
    const emptyResults = {
      players: [],
      averageScore: 0,
      totalQuestions: 0
    };
    
    renderComponent({ results: emptyResults });
    
    // Should show no players message
    expect(screen.getByText('No players found')).toBeInTheDocument();
    
    // Should still render the statistics section with zeros
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    const averageScoreText = screen.getByText(/average score/i);
    expect(averageScoreText.textContent).toContain('0');
  });
  
  // Test 6: Download Results
  it('should provide a download option for results', () => {
    renderComponent();
    
    // Check for download button
    const downloadButton = screen.getByText('Download Results');
    expect(downloadButton).toBeInTheDocument();
    
    // Mock the download function
    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'mock-url');
    const mockClick = vi.fn();
    
    mockCreateElement.mockImplementation(() => ({
      href: '',
      download: '',
      click: mockClick,
      style: {}
    }));
    
    // Click the download button
    fireEvent.click(downloadButton);
    
    // Verify the download function was called
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    
    // Clean up mocks
    mockCreateElement.mockRestore();
    mockCreateObjectURL.mockRestore();
  });
}); 