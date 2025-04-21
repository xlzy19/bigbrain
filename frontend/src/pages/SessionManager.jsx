// src/pages/SessionManager.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSessionStatus,
  getSessionResults,
  advanceGameSession,
  startGameSession,
  endGameSession,
} from "../services/gameApi";
import { useAuth } from "../contexts/AuthContext";
import SessionResultsView from "../components/session/SessionResultsView";
import {
  Layout,
  Typography,
  Card,
  Button,
  Descriptions,
  Tag,
  Divider,
  List,
  Space,
  Alert,
  Badge,
  Spin,
  Tabs,
  Input,
  message,
  Progress,
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  LogoutOutlined,
  CopyOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

function SessionManager() {
  const { sessionId, gameId } = useParams();
  const [session, setSession] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuestionTab, setActiveQuestionTab] = useState("current");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchSessionStatus = useCallback(async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionStatus(sessionId);
      console.log("🚀 ~ fetchSessionStatus ~ sessionData:", sessionData);
      setSession(sessionData.results || sessionData);

      // If the session has ended, fetch the results
      if (sessionData.results && !sessionData.results.active) {
        const resultsData = await getSessionResults(sessionId);
        setResults(resultsData);
      }
    } catch (error) {
      setError("Failed to retrieve session status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionStatus();

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchSessionStatus();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [fetchSessionStatus]);

  const handleAdvance = async () => {
    try {
      await advanceGameSession(gameId);
      await fetchSessionStatus();
      message.success('Successfully advanced to the next question');
    } catch (error) {
      message.error('Failed to advance to the next question');
      console.error(error);
    }
  };

  const handleEnd = async () => {
    try {
      message.loading('Ending session...');
      await endGameSession(gameId);
      await fetchSessionStatus();
      message.success('Session has ended');
    } catch (error) {
      message.error('Failed to end session');
      console.error(error);
    }
  };
  
  const handleStart = async () => {
    try {
      message.loading('Starting new session...');
      await startGameSession(gameId);
      await fetchSessionStatus();
      message.success('New session started');
    } catch (error) {
      message.error('Failed to start session');
      console.error(error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getPlayLink = () => {
    return `${window.location.origin}/play/${sessionId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPlayLink());
    message.success('Link copied to clipboard');
  };

  const refreshStatus = () => {
    fetchSessionStatus();
    message.info('Refreshing session status...');
  };

  // Get question type name
  const getQuestionTypeName = (type) => {
    switch (type) {
    case 'single':
      return 'Single Choice';
    case 'multiple':
      return 'Multiple Choice';
    case 'truefalse':
      return 'True or False';
    default:
      return 'Unknown Type';
    }
  };

  // Get question type color
  const getQuestionTypeColor = (type) => {
    switch (type) {
    case 'single':
      return 'blue';
    case 'multiple':
      return 'green';
    case 'truefalse':
      return 'orange';
    default:
      return 'default';
    }
  };
  // Calculate question remaining time
  const getQuestionRemainingTime = () => {
    if (!session || !session.isoTimeLastQuestionStarted || session.position < 0) {
      return 0;
    }

    const currentQuestion = session.questions[session.position];
    if (!currentQuestion) return 0;

    const startTime = new Date(session.isoTimeLastQuestionStarted);
    const currentTime = new Date();
    const elapsedTime = (currentTime - startTime) / 1000; // convert to seconds
    const duration = currentQuestion.duration || 30;
    const remainingTime = Math.max(0, duration - elapsedTime);
    
    return Math.floor(remainingTime);
  };
  
  const remainingTime = getQuestionRemainingTime();
  const currentQuestion = session?.questions?.[session.position];
  const hasNextQuestion = session?.questions && session.position < session.questions.length - 1;

  // Prepare items config for Tabs component
  const getTabItems = () => {
    const items = [];
    
    // Current question tab
    items.push({
      key: 'current',
      label: 'Current Question',
      children: currentQuestion && (
        <div className="question-details">
          <div className="question-header" style={{ marginBottom: '20px' }}>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                Question {session.position + 1}: {currentQuestion.question}
              </Title>
              <Tag color={getQuestionTypeColor(currentQuestion.type)}>
                {getQuestionTypeName(currentQuestion.type)}
              </Tag>
              <Tag color="gold">
                <TrophyOutlined /> {currentQuestion.points} points
              </Tag>
            </Space>
          </div>
          
          {/* Show media */}
          {currentQuestion.media && (
            <div className="question-media" style={{ margin: '16px 0' }}>
              <img 
                src={currentQuestion.media} 
                alt="Question Media" 
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
            </div>
          )}
          
          {/* Countdown */}
          <div className="countdown-timer" style={{ margin: '16px 0' }}>
            <Space align="center">
              <ClockCircleOutlined />
              <Text>
                Time Left: {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
              </Text>
            </Space>
            <Progress 
              percent={Math.round((remainingTime / currentQuestion.duration) * 100)} 
              status="active"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </div>
          
          <Divider>Answer Options</Divider>
          
          <List
            itemLayout="horizontal"
            dataSource={currentQuestion.answers || []}
            renderItem={(answer, index) => (
              <List.Item>
                <Space>
                  {answer.correct ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  )}
                  <Text>{String.fromCharCode(65 + index)}. {answer.answer}</Text>
                  {answer.correct && (
                    <Tag color="success">Correct Answer</Tag>
                  )}
                </Space>
              </List.Item>
            )}
          />
        </div>
      )
    });
    
    // Next question tab
    if (hasNextQuestion) {
      items.push({
        key: 'next',
        label: 'Next Question',
        children: (
          <div className="next-question-preview">
            <Alert
              message="Next Question Preview"
              description="This is a preview of the next question, players have not seen it yet"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            {session.questions[session.position + 1] && (
              <div className="question-details">
                <div className="question-header" style={{ marginBottom: '20px' }}>
                  <Space align="center">
                    <Title level={4} style={{ margin: 0 }}>
                      Question {session.position + 2}: {session.questions[session.position + 1].question}
                    </Title>
                    <Tag color={getQuestionTypeColor(session.questions[session.position + 1].type)}>
                      {getQuestionTypeName(session.questions[session.position + 1].type)}
                    </Tag>
                    <Tag color="gold">
                      <TrophyOutlined /> {session.questions[session.position + 1].points} points
                    </Tag>
                  </Space>
                </div>
                
                {/* Media */}
                {session.questions[session.position + 1].media && (
                  <div className="question-media" style={{ margin: '16px 0' }}>
                    <img 
                      src={session.questions[session.position + 1].media} 
                      alt="Question Media" 
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  </div>
                )}
                
                <Divider>Answer Options</Divider>
                
                <List
                  itemLayout="horizontal"
                  dataSource={session.questions[session.position + 1].answers || []}
                  renderItem={(answer, index) => (
                    <List.Item>
                      <Space>
                        {answer.correct ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#f5222d' }} />
                        )}
                        <Text>{String.fromCharCode(65 + index)}. {answer.answer}</Text>
                        {answer.correct && (
                          <Tag color="success">Correct Answer</Tag>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )
      });
    }
    
    // All questions tab
    items.push({
        key: 'all',
        label: 'All Questions',
        children: (
          <List
            itemLayout="horizontal"
            dataSource={session.questions || []}
            renderItem={(question, index) => (
              <List.Item
                actions={[
                  index === session.position ? (
                    <Tag color="processing">Current</Tag>
                  ) : (
                    index < session.position ? (
                      <Tag color="default">Finished</Tag>
                    ) : (
                      <Tag color="warning">Upcoming</Tag>
                    )
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>Question {index + 1}:</Text>
                      <Text>{question.question}</Text>
                      <Tag color={getQuestionTypeColor(question.type)}>
                        {getQuestionTypeName(question.type)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text>Duration: {question.duration}Seconds</Text>
                      <Text>Score: {question.points}Points</Text>
                      <Text>Number of options: {question.answers ? question.answers.length : 0}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )
      });
      
      return items;
    };
  
    if (loading && !session) {
      return (
        <Layout className="session-manager-layout">
          <Content style={{ padding: '50px', textAlign: 'center' }}>
            <Spin size="large" tip="Loading...">
              <div style={{ padding: '50px' }}></div>
            </Spin>
          </Content>
        </Layout>
      );
    }
  
    // Show results page
    if (session && !session.active && results) {
      return (
        <Layout className="session-results-layout">
          <Header className="session-header" style={{ background: '#1890ff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/dashboard')}
                style={{ color: '#fff', marginRight: '10px' }}
              >
                Back to Dashboard
              </Button>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                Game Results Analysis
              </Title>
            </div>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                type="link" 
                icon={<ReloadOutlined />} 
                onClick={refreshStatus}
                style={{ color: '#fff', marginRight: '10px' }}
              >
                Refresh
              </Button>
              <Button 
                type="link" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                style={{ color: '#fff' }}
              >
                Log Out
              </Button>
            </div>
          </Header>
          
          <Content className="session-content" style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
            <Card 
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                  <Text strong style={{ fontSize: '18px' }}>
                    {session.name || 'Game'} Statistics
                  </Text>
                </Space>
              }
              extra={
                <Space>
                  <Tag color="blue">Session ID: {sessionId}</Tag>
                  <Tag color="purple">Total Questions: {session.questions?.length || 0}</Tag>
                  <Tag color="orange">Players: {session.players?.length || 0}</Tag>
                </Space>
              }
              style={{ marginBottom: '24px' }}
            >
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
                <Descriptions.Item label="Game ID">{gameId}</Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {new Date().toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge status="default" text="Ended" />
                </Descriptions.Item>
              </Descriptions>
            </Card>
            
            <SessionResultsView
              results={results}
              questions={session.questions}
            />
          </Content>
        </Layout>
      );
    }
  
    return (
      <Layout className="session-manager-layout">
        <Header className="session-header">
          <div className="header-left">
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>Session Management</Title>
          </div>
          <div className="header-right">
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              onClick={refreshStatus}
            >
              Refresh
            </Button>
            <Button 
              type="link" 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </Header>
  
        <Content className="session-content">
          {error && (
            <Alert
              message="error"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}