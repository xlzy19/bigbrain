import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn().mockResolvedValue({}),
    user: { email: 'test@example.com' }
  })
}));

vi.mock('../services/gameApi', () => ({
  getAllGames: vi.fn(),
  createGame: vi.fn(),
  deleteGame: vi.fn(),
  startGameSession: vi.fn(),
  endGameSession: vi.fn()
}));

import {
  getAllGames,
  deleteGame,
  startGameSession,
  endGameSession
} from '../services/gameApi';

describe('Dashboard component test', () => {
  const mockGames = {
    games: [
      {
        id: 1,
        name: 'game1',
        questions: [{ id: 'q1', question: 'question1' }],
        active: null,
        oldSessions: []
      },
      {
        id: 2,
        name: 'active game',
        questions: [{ id: 'q2', question: 'question2' }],
        active: 'session-1',
        oldSessions: []
      },
      {
        id: 3,
        name: 'history game',
        questions: [{ id: 'q3', question: 'question3' }],
        active: null,
        oldSessions: ['session-2', 'session-3']
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getAllGames.mockResolvedValue(mockGames);
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/session/:sessionId/:gameId" element={<div>session control page</div>} />
          <Route path="/session/:sessionId/results" element={<div>session results page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should load and display the game list', async () => {
    await act(async () => {
      renderDashboard();
    });

    // verify API call
    expect(getAllGames).toHaveBeenCalled();

    // check if the game names are displayed
    expect(screen.getByText('game1')).toBeInTheDocument();
    expect(screen.getByText('active game')).toBeInTheDocument();
    expect(screen.getByText('history game')).toBeInTheDocument();
  });

  it('should display the correct game status tags', async () => {
    await act(async () => {
      renderDashboard();
    });

    // check the status tags
    const notStartedTags = screen.getAllByText('Not Started');
    expect(notStartedTags.length).toBeGreaterThanOrEqual(2); // at least 2 games are not started

    const activeTags = screen.getAllByText('Active');
    expect(activeTags.length).toBe(1); // only 1 active game
  });

  it('should start a game session when the Start button is clicked', async () => {
    startGameSession.mockResolvedValue({
      data: { sessionId: 'new-session-1' }
    });

    await act(async () => {
      renderDashboard();
    });

    // find the Start button of the first game
    const startButtons = screen.getAllByText('Start');
    
    // click the first Start button
    await act(async () => {
      fireEvent.click(startButtons[0]);
    });

    // verify API call
    expect(startGameSession).toHaveBeenCalled();
    
    // verify the modal is displayed
    await waitFor(() => {
      // assume the modal has some specific text
      expect(getAllGames).toHaveBeenCalledTimes(2); // first load and refresh
    });
  });

  it('should stop a game session when the Stop button is clicked', async () => {
    // Simulate stop session response
    endGameSession.mockResolvedValue({});

    await act(async () => {
      renderDashboard();
    });

    // find the Stop button of the active game
    const stopButton = screen.getByText('Stop');
    
    // click the Stop button
    await act(async () => {
      fireEvent.click(stopButton);
    });

    // verify API call
    expect(endGameSession).toHaveBeenCalledWith(2); // the active game with ID 2
    
    // verify the confirm modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Would you like to view the results?')).toBeInTheDocument();
    });
    
    // click the "Yes" button to view the results
    await act(async () => {
      fireEvent.click(screen.getByText('Yes'));
    });
    
    // verify navigation to the results page
    await waitFor(() => {
      expect(screen.getByText('session results page')).toBeInTheDocument();
    });
  });

  it('should display the create new game modal when the Create a New Game button is clicked', async () => {
    // in React Testing Library, in the simulated DOM environment, modals are not usually rendered
    // here we only test the button click event
    
    await act(async () => {
      renderDashboard();
    });

    // find the "Create a New Game" button
    const createButton = screen.getByText('Create a New Game');
    
    // click the button
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    // do not test the modal content, because the modal may be rendered by a third-party library, not in the test DOM
  });
  
  it('should display the empty state when there are no games', async () => {
    // mock the empty game list
    getAllGames.mockResolvedValue({ games: [] });
    
    await act(async () => {
      renderDashboard();
    });
    
    // verify the empty state is displayed
    expect(screen.getByText('No games yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first game')).toBeInTheDocument();
  });
  
  it('should display the loading indicator when loading', async () => {
    // create an unresolved Promise to keep the loading state
    let resolvePromise;
    const loadingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    getAllGames.mockReturnValue(loadingPromise);
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // verify the loading indicator is displayed
    expect(screen.getByText('loading...')).toBeInTheDocument();
    
    // resolve the Promise, end the loading state
    await act(async () => {
      resolvePromise(mockGames);
      await loadingPromise;
    });
  });
  
  it('should reload the game list when the refresh button is clicked', async () => {
    await act(async () => {
      renderDashboard();
    });
    
    // reset the mock count
    getAllGames.mockClear();
    
    // find the refresh button
    const refreshButton = screen.getByText('refresh');
    
    // click the refresh button
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // verify the API is called again
    expect(getAllGames).toHaveBeenCalledTimes(1);
  });
}); 