import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GameEdit from './pages/GameEdit';
import QuestionEdit from './pages/QuestionEdit';
import SessionManager from './pages/SessionManager';
import PlayJoin from './pages/PlayJoin';
import PlayGame from './pages/PlayGame';
import PlayerResults from './pages/PlayerResults';
import ProtectedRoute from './components/common/ProtectedRoute';
import './index.css';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/game/:gameId" element={
            <ProtectedRoute>
              <GameEdit />
            </ProtectedRoute>
          } />
          <Route path="/game/:gameId/question/:questionId" element={
            <ProtectedRoute>
              <QuestionEdit />
            </ProtectedRoute>
          } />
          <Route path="/session/:sessionId/:gameId" element={
            <ProtectedRoute>
              <SessionManager />
            </ProtectedRoute>
          } />
          
          {/* Player Routes */}
          <Route path="/play" element={<PlayJoin />} />
          <Route path="/play/:sessionId" element={<PlayJoin />} />
          <Route path="/play/game/:playerId" element={<PlayGame />} />
          <Route path="/play/results/:playerId" element={<PlayerResults />} />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;