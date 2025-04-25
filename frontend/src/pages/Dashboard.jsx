// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Empty,
  Spin,
  Modal,
  message,
} from "antd";
import { PageHeader } from "@ant-design/pro-components";
import {
  PlusOutlined,
  LogoutOutlined,
  ReloadOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import {
  getAllGames,
  createGame,
  endGameSession,
  deleteGame,
  startGameSession,
} from "../services/gameApi";
import request from "../utils/request";
import GameCard from "../components/game/GameCard";
import NewGameModal from "../components/game/NewGameModal";
import SessionStartedModal from "../components/session/SessionStartedModal";
console.log(createGame);
const { Content } = Layout;
const { Title } = Typography;

function Dashboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  console.log(error);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [stoppedSessionId, setStoppedSessionId] = useState(null);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const gamesData = await getAllGames();
      setGames(gamesData);
    } catch (error) {
      message.error("Failed to fetch game list");
      setError("Failed to fetch game list");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (gameData) => {
    try {
      // Fetch all current games from the API
      const currentGames = await getAllGames();

      // Generate a new game object
      const newGame = {
        id: Math.floor(Math.random() * 90000000) + 10000000, // Generate an 8-digit random ID
        name: gameData.name,
        owner: gameData.owner,
        questions: gameData.questions,
      };

      // Prepare merged game data
      let updatedGames = [];

      // Check if currentGames has a games array
      if (
        currentGames &&
        currentGames.games &&
        Array.isArray(currentGames.games)
      ) {
        // Append the new game to the existing list
        updatedGames = [...currentGames.games, newGame];
      } else {
        // If no existing games or wrong format, use only the new game
        updatedGames = [newGame];
      }

      // Submit the merged game data via API
      const response = await request.put("/admin/games", {
        games: updatedGames,
      });
      console.log(response);
      // Update local state if creation is successful
      setGames({ games: updatedGames });
      setShowNewGameModal(false);
      message.success("Game created successfully");
    } catch (error) {
      message.error("Failed to create game");
      setError("Failed to create game");
      console.error(error);
    }
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await deleteGame(gameId);
      setGames(games.filter((game) => game.id !== gameId));
      message.success("Game deleted successfully");
    } catch (error) {
      message.error("Failed to delete game");
      setError("Failed to delete game");
      console.error(error);
    }
  };
  const handleStopSession = async (gameId, sessionId) => {
    try {
      await endGameSession(gameId);
      setStoppedSessionId(sessionId);
      setShowSessionEndedModal(true);

      // Refresh game list after stopping session
      fetchGames();
      message.success("Game session stopped successfully");
    } catch (error) {
      message.error("Failed to stop game session");
      setError("Failed to stop game session");
      console.error(error);
    }
  };
  const handleViewResults = () => {
    setShowSessionEndedModal(false);
    navigate(`/session/${stoppedSessionId}/results`);
  };
  const handleStartSession = async (gameId) => {
    try {
      const response = await startGameSession(gameId);
      setSessionId(response.data.sessionId);
      setGameId(gameId);
      setShowSessionModal(true);

      // Refresh game list after starting session
      fetchGames();
    } catch (error) {
      message.error("Failed to start game session");
      setError("Failed to start game session");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout className="dashboard-layout">
      <PageHeader
        className="dashboard-header"
        title={<Title level={2}>Game Dashboard</Title>}
        extra={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={fetchGames}>
            refresh
          </Button>,
          <Button key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>,
        ]}
      />

      <Content className="dashboard-content">
        <div className="dashboard-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setShowNewGameModal(true)}
          >
            Create a New Game
          </Button>
        </div>

        <Card className="games-container">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="loading..." />
            </div>
          ) : (
            <div className="games-grid">
              {!games.games || games.games.length === 0 ? (
                <Empty
                  description="No games yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    onClick={() => setShowNewGameModal(true)}
                  >
                    Create your first game
                  </Button>
                </Empty>
              ) : (
                <Row gutter={[16, 16]}>
                  {games.games.map((game) => (
                    <Col key={game.id}>
                      <GameCard
                        game={game}
                        onDelete={() => handleDeleteGame(game.id)}
                        onStartSession={() => handleStartSession(game.id)}
                        onStopSession={handleStopSession}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </Card>
      </Content>

      {showNewGameModal && (
        <NewGameModal
          onClose={() => setShowNewGameModal(false)}
          onCreate={handleCreateGame}
        />
      )}

      {showSessionModal && (
        <SessionStartedModal
          sessionId={sessionId}
          gameId={gameId}
          onClose={() => setShowSessionModal(false)}
          onViewSession={() => navigate(`/session/${sessionId}/${gameId}`)}
        />
      )}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center' }}><QuestionCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Game Session Stopped</div>}
        open={showSessionEndedModal}
        onCancel={() => setShowSessionEndedModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSessionEndedModal(false)}>
            No
          </Button>,
          <Button key="view" type="primary" onClick={handleViewResults}>
            Yes
          </Button>,
        ]}
      >
        <p>Would you like to view the results?</p>
        <p>All active players have been sent to the results screen.</p>
      </Modal>
    </Layout>
  );
}

export default Dashboard;
