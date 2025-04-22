// src/pages/PlayerResults.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Button, 
  List, 
  Tag, 
  Progress, 
  Space, 
  Result, 
  Spin,
  Divider
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined, 
  HomeOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { getPlayerResults } from '../services/playerApi';

const { Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;

function PlayerResults() {
  const { playerId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerName = localStorage.getItem('playerName') || 'Player';
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [playerId]);

  // Fetch player results
  const fetchResults = async () => {
    try {
      setLoading(true);
      const resultsData = await getPlayerResults(playerId);
      setResults(resultsData);
    } catch (error) {
      setError('Failed to fetch results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout className="results-layout">
        <Content className="results-content">
          <div className="loading-container">
            <Spin size="large" tip="Loading..." />
          </div>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout className="results-layout">
        <Content className="results-content">
          <Result
            status="error"
            title="Failed to fetch results"
            subTitle={error}
            extra={[
              <Button type="primary" key="retry" onClick={fetchResults} icon={<RedoOutlined />}>
                Retry
              </Button>,
              <Button key="home" onClick={() => navigate('/')} icon={<HomeOutlined />}>
                Back to Home
              </Button>
            ]}
          />
        </Content>
      </Layout>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Layout className="results-layout">
        <Content className="results-content">
          <Result
            status="info"
            title="No Results"
            subTitle="The game might not have ended yet or you didn't answer any questions."
            extra={
              <Button type="primary" onClick={() => navigate('/')} icon={<HomeOutlined />}>
                Back to Home
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

  // Calculate total score

  // Calculate number of correct answers
  const correctCount = results.filter(result => result.correct).length;

  // Calculate average response time (seconds)
  const totalTime = results.reduce((total, result) => {
    if (result.answeredAt && result.questionStartedAt) {
      const answerTime = new Date(result.answeredAt) - new Date(result.questionStartedAt);
      return total + (answerTime > 0 ? answerTime / 1000 : 0);
    }
    return total;
  }, 0);
  const avgTime = results.length > 0 ? totalTime / results.length : 0;
  
  // Calculate accuracy
  const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

  return (
    <Layout className="results-layout">
      <Header className="results-header">
        <div className="header-content">
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            Game Results
          </Title>
        </div>
      </Header>
      
      <Content className="results-content">
        <Card className="summary-card">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            {playerName}&apos;s Game Performance
          </Title>
          
          <Row gutter={[16, 16]} justify="center">
            {/* Number of correct answers */}
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic 
                  title="Correct Answers" 
                  value={correctCount} 
                  suffix={`/ ${results.length}`}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            {/* Average response time */}
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic 
                  title="Average Response Time" 
                  value={avgTime.toFixed(1)} 
                  suffix="s"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider>Accuracy</Divider>
          
          <Progress 
            percent={Math.round(accuracy)} 
            status={accuracy >= 60 ? 'success' : accuracy >= 40 ? 'normal' : 'exception'} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{ margin: '20px 0' }}
          />
        </Card>
        
        <Divider orientation="left">Detailed Performance</Divider>
        
        <List
          className="question-results-list"
          itemLayout="horizontal"
          dataSource={results}
          renderItem={(result, index) => (
            <List.Item>
              <Card 
                style={{ width: '100%' }} 
                hoverable
                title={
                  <Space>
                    <Text strong>Question {index + 1}</Text>
                    {result.correct ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Correct</Tag>
                    ) : (
                      <Tag color="error" icon={<CloseCircleOutlined />}>Incorrect</Tag>
                    )}
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
               
                  {result.answeredAt && result.questionStartedAt && (
                    <Col span={8}>
                      <Statistic 
                        title="Response Time" 
                        value={((new Date(result.answeredAt) - new Date(result.questionStartedAt)) / 1000).toFixed(1)} 
                        suffix="s"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            </List.Item>
          )}
        />
        
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <Paragraph>Thank you for participating in the game!</Paragraph>
          <Space>
            <Button type="primary" onClick={() => navigate('/dashboard')} icon={<HomeOutlined />}>
              Back to Home
            </Button>
            <Button onClick={fetchResults} icon={<RedoOutlined />}>
              Refresh Results
            </Button>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}

export default PlayerResults;