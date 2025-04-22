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
}