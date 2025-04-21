// src/pages/GameEdit.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Button, 
  Card, 
  message, 
  Spin, 
  Divider,
  Space,
  Breadcrumb,
  Modal} from 'antd';
import { 
  // eslint-disable-next-line no-unused-vars
  ArrowLeftOutlined, 
  LogoutOutlined, 
  PlusOutlined, 
  EditOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-components';
import { useAuth } from '../contexts/AuthContext';
import request from '../utils/request';
import QuestionList from '../components/question/QuestionList';
import AddQuestionModal from '../components/question/AddQuestionModal';
import GameMetadataForm from '../components/game/GameMetadataForm';

const { Content } = Layout;
const { Title, Text } = Typography;

function GameEdit() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  // Fetch game data
  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await request.get('/admin/games');
      
      if (response && response.games) {
        // Find the game with the matching ID
        const targetGame = response.games.find(g => g.id === parseInt(gameId));
        
        if (targetGame) {
          setGame(targetGame);
        } else {
          message.error('Game not found');
          setError('Game not found');
          navigate('/dashboard');
        }
      } else {
        message.error('Failed to fetch game data');
        setError('Failed to fetch game data');
      }
    } catch (error) {
      message.error('Failed to fetch game details');
      setError('Failed to fetch game details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add new question
  const handleAddQuestion = async (newQuestion) => {
    try {
      const response = await request.get('/admin/games');
      const allGames = response.games || [];
      const updatedGame = JSON.parse(JSON.stringify(game));

      if (!updatedGame.questions) {
        updatedGame.questions = [];
      }

      updatedGame.questions.push({
        question: newQuestion.text,
        duration: newQuestion.time,
        points: newQuestion.points,
        type: newQuestion.type,
        media: newQuestion.image || newQuestion.video || null,
        answers: newQuestion.answers.map(answer => ({
          answer: answer.text,
          correct: answer.isCorrect
        }))
      });

      const updatedGames = allGames.map(g => 
        g.id === parseInt(gameId) ? updatedGame : g
      );

      await request.put('/admin/games', { games: updatedGames });
      setGame(updatedGame);
      setShowAddQuestionModal(false);
      message.success('Question added successfully');
    } catch (error) {
      message.error('Failed to add question');
      console.error(error);
    }
  };

  // Delete a question
  const handleDeleteQuestion = async (questionIndex) => {
    try {
      const response = await request.get('/admin/games');
      const allGames = response.games || [];
      const updatedGame = JSON.parse(JSON.stringify(game));

      updatedGame.questions.splice(questionIndex, 1);

      const updatedGames = allGames.map(g => 
        g.id === parseInt(gameId) ? updatedGame : g
      );

      await request.put('/admin/games', { games: updatedGames });
      setGame(updatedGame);
      message.success('Question deleted successfully');
    } catch (error) {
      message.error('Failed to delete question');
      console.error(error);
    }
  };

  // Delete the entire game
  const handleDeleteGame = async () => {
    try {
      const response = await request.get('/admin/games');
      const allGames = response.games || [];
      const updatedGames = allGames.filter(g => g.id !== parseInt(gameId));

      await request.put('/admin/games', { games: updatedGames });

      message.success('Game deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      message.error('Failed to delete game');
      console.error(error);
    } finally {
      setDeleteConfirmVisible(false);
    }
  };

  // Update game metadata
  const handleUpdateMetadata = async (metadata) => {
    try {
      const response = await request.get('/admin/games');
      const allGames = response.games || [];

      const updatedGame = {
        ...JSON.parse(JSON.stringify(game)),
        name: metadata.name,
        thumbnail: metadata.thumbnail
      };

      const updatedGames = allGames.map(g => 
        g.id === parseInt(gameId) ? updatedGame : g
      );

      await request.put('/admin/games', { games: updatedGames });
      setGame(updatedGame);
      setEditingMetadata(false);
      message.success('Game information updated successfully');
    } catch (error) {
      message.error('Failed to update game information');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      message.error('Logout failed');
      console.error(error);
    }
  };

  const showDeleteConfirm = () => {
    setDeleteConfirmVisible(true);
  };

  return (
    <Layout className="game-edit-layout">
      <PageHeader
        className="game-edit-header"
        title={<Title level={2}>Edit Game</Title>}
        subTitle={game ? game.name : 'Loading...'}
        onBack={() => navigate('/dashboard')}
        extra={[
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={showDeleteConfirm}
          >
            Delete Game
          </Button>,
          <Button key="reload" icon={<ReloadOutlined />} onClick={fetchGame}>
            Refresh
          </Button>,
          <Button key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        ]}
      />

      <Content className="game-edit-content">
        <Breadcrumb className="game-edit-breadcrumb">
          <Breadcrumb.Item>
            <Link to="/dashboard">Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Edit Game</Breadcrumb.Item>
        </Breadcrumb>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Loading..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <Card>
              <p className="error-message">{error}</p>
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </Card>
          </div>
        ) : (
          <>
            <Card className="game-info-card">
              {editingMetadata ? (
                <GameMetadataForm
                  initialData={{
                    name: game.name || '',
                    thumbnail: game.thumbnail || '',
                  }}
                  onSubmit={handleUpdateMetadata}
                  onCancel={() => setEditingMetadata(false)}
                />
              ) : (
                <div className="game-info">
                  <div className="game-info-header">
                    <Title level={3}>{game.name}</Title>
                    <Space>
                      <Button 
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setEditingMetadata(true)}
                      >
                        Edit Game Info
                      </Button>
                      <Button 
                        type="danger"
                        icon={<DeleteOutlined />}
                        onClick={showDeleteConfirm}
                      >
                        Delete Game
                      </Button>
                    </Space>
                  </div>

                  {game.thumbnail && (
                    <div className="game-thumbnail-container">
                      <img 
                        src={game.thumbnail} 
                        alt={game.name} 
                        className="game-thumbnail" 
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Divider />

            <Card className="questions-card">
              <div className="section-header">
                <Title level={4}>Question List</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddQuestionModal(true)}
                >
                  Add Question
                </Button>
              </div>

              <QuestionList 
                questions={game.questions || []} 
                gameId={gameId}
                onDelete={handleDeleteQuestion}
              />
            </Card>
          </>
        )}
      </Content>

      {showAddQuestionModal && (
        <AddQuestionModal 
          onClose={() => setShowAddQuestionModal(false)}
          onAdd={handleAddQuestion}
        />
      )}

      {/* Delete game confirmation dialog */}
      <Modal
        title="Confirm Delete"
        open={deleteConfirmVisible}
        onOk={handleDeleteGame}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Confirm Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Are you sure you want to delete the game <Text strong>{game?.name}</Text>?</Text>
          <Text type="danger">This action is irreversible and all questions will be permanently deleted!</Text>
        </Space>
      </Modal>
    </Layout>
  );
}

export default GameEdit;