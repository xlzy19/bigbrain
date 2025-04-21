// src/pages/AdminResults.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gameAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

function AdminResults() {
  const { sessionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const data = await gameAPI.getSessionResults(sessionId);
      setResults(data);
    } catch (error) {
      setError('Failed to fetch results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!results || results.length === 0) {
    return (
      <div className="no-results">
        <h1>No results yet</h1>
        <p>This session may not have any players yet.</p>
        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      </div>
    );
  }

  // Calculate total score for each player
  const playerScores = results.map(player => {
    const totalScore = player.answers.reduce((sum, answer) => {
      return sum + (answer.correct ? answer.questionPoints || 0 : 0);
    }, 0);

    return {
      name: player.name,
      score: totalScore,
      correctCount: player.answers.filter(a => a.correct).length,
      averageTime: player.answers.reduce((sum, a) => {
        if (a.answeredAt && a.questionStartedAt) {
          return sum + (new Date(a.answeredAt) - new Date(a.questionStartedAt));
        }
        return sum;
      }, 0) / player.answers.length / 1000 // convert to seconds
    };
  });

  // Sort by score
  const sortedPlayers = [...playerScores].sort((a, b) => b.score - a.score);

  // Calculate per-question stats
  const questionStats = results[0].answers.map((_, questionIndex) => {
    const questionData = results.map(player => player.answers[questionIndex]);
    const correctCount = questionData.filter(a => a.correct).length;
    const totalResponses = questionData.length;
    const correctRate = (correctCount / totalResponses) * 100;

    const averageTime = questionData.reduce((sum, answer) => {
      if (answer.answeredAt && answer.questionStartedAt) {
        return sum + (new Date(answer.answeredAt) - new Date(answer.questionStartedAt));
      }
      return sum;
    }, 0) / totalResponses / 1000; // convert to seconds

    return {
      questionNumber: questionIndex + 1,
      correctRate,
      averageTime
    };
  });

  // Calculate advanced stats
  const advancedStats = {
    totalPlayers: results.length,
    averageScore: sortedPlayers.reduce((sum, p) => sum + p.score, 0) / results.length,
    highestScore: sortedPlayers[0].score,
    lowestScore: sortedPlayers[sortedPlayers.length - 1].score,
    averageCorrectRate: questionStats.reduce((sum, q) => sum + q.correctRate, 0) / questionStats.length,
    averageResponseTime: questionStats.reduce((sum, q) => sum + q.averageTime, 0) / questionStats.length
  };

  return (
    <div className="admin-results-container">
      <header>
        <Link to="/dashboard" className="back-button">
        Back to Dashboard
        </Link>
        <h1>Conversation results analysis</h1>
        <button onClick={handleLogout} className="logout-button">
        Log out
        </button>
      </header>

      <div className="results-summary">
        <h2>Overall Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Number of Participants</h3>
            <p>{advancedStats.totalPlayers}</p>
          </div>
          <div className="stat-card">
            <h3>Average Score</h3>
            <p>{advancedStats.averageScore.toFixed(1)}</p>
          </div>
          <div className="stat-card">
            <h3>Highest Score</h3>
            <p>{advancedStats.highestScore}</p>
          </div>
          <div className="stat-card">
            <h3>Lowest Score</h3>
            <p>{advancedStats.lowestScore}</p>
          </div>
          <div className="stat-card">
            <h3>Average Accuracy</h3>
            <p>{advancedStats.averageCorrectRate.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h3>Average Answer Time</h3>
            <p>{advancedStats.averageResponseTime.toFixed(1)} s</p>
          </div>
        </div>
      </div>