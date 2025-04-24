import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameCard from '../components/game/GameCard';

// create mock functions
const mockOnStartSession = vi.fn();
const mockOnStopSession = vi.fn();

// mock the getSessionResults function
vi.mock('../services/gameApi', () => ({
  getSessionResults: vi.fn().mockResolvedValue({
    players: [
      { name: "Player1", score: 300 },
      { name: "Player2", score: 200 }
    ]
  })
}));

// Wrapper component that provides necessary context
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('GameCard component test', () => {
  // basic rendering test - the game that is not started
  it('should correctly render the game that is not started', () => {
    const game = {
      id: 123,
      name: "test game",
      questions: [],
      active: null,
      oldSessions: []
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // verify the game name and label are displayed correctly
    expect(screen.getByText("test game")).toBeInTheDocument();
    expect(screen.getByText("Not Started")).toBeInTheDocument();
    
    // Verify that there is a "Start" button but no "Stop" button
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.queryByText("Stop")).not.toBeInTheDocument();
    
    // Verify that the "Edit" button is present

    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
  
  // Render test for an active game
  it('should correctly render the game that is active', () => {
    const game = {
      id: 456,
      name: "active game",
      questions: [],
      active: "session-123",
      oldSessions: []
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Verify game name and tags
    expect(screen.getByText("active game")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    
    // Verify that there are "View" and "Stop" buttons, but no "Start" button
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
    expect(screen.queryByText("Start")).not.toBeInTheDocument();
  });
  
  // Render test for a game with history records
  it('should correctly render the game that has history', () => {
    const game = {
      id: 789,
      name: "history game",
      questions: [],
      active: null,
      oldSessions: ["old-session-1", "old-session-2"]
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Verify the game name
    expect(screen.getByText("history game")).toBeInTheDocument();
    
    // Verify that the "Review" button is present
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  // Button click interaction test
  it('should call onStartSession when the Start button is clicked', () => {
    const game = {
      id: 123,
      name: "test game",
      questions: [],
      active: null,
      oldSessions: []
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Click the Start button
    fireEvent.click(screen.getByText("Start"));
    
    // Verify that onStartSession is called
    expect(mockOnStartSession).toHaveBeenCalledWith(123);
  });
  
  it('should call onStopSession when the Stop button is clicked', () => {
    const game = {
      id: 456,
      name: "active game",
      questions: [],
      active: "session-123",
      oldSessions: []
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Click the Stop button
    fireEvent.click(screen.getByText("Stop"));
    
    // Verify that onStopSession is called
    expect(mockOnStopSession).toHaveBeenCalledWith(456, "session-123");
  });
  
  // Edge case: missing image
  it('should display the default icon when there is no thumbnail', () => {
    const game = {
      id: 123,
      name: "no thumbnail game",
      thumbnail: null,
      questions: [],
      active: null,
      oldSessions: []
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Check if the QuestionCircleOutlined icon is present
    // since the icon is an SVG element, we cannot directly test its existence, we verify the div containing the icon exists
    const cardCover = document.querySelector('.game-card-container .ant-card-cover');
    expect(cardCover).toBeTruthy();
    expect(cardCover.firstChild.tagName.toLowerCase()).toBe('div');
  });
  
  // Test the Review button and the history modal
  it('should display the history modal when the Review button is clicked', async () => {
    const game = {
      id: 789,
      name: "history game",
      questions: [],
      active: null,
      oldSessions: ["old-session-1", "old-session-2"]
    };
    
    renderWithRouter(
      <GameCard 
        game={game} 
        onStartSession={mockOnStartSession} 
        onStopSession={mockOnStopSession} 
      />
    );
    
    // Click the Review button
    fireEvent.click(screen.getByText("Review"));
    
    // Verify that the modal appears
    expect(screen.getByText("Session History")).toBeInTheDocument();
    
    // Verify the session list items
    expect(screen.getByText("Session old-session-1")).toBeInTheDocument();
    expect(screen.getByText("Session old-session-2")).toBeInTheDocument();
  });
}); 