// src/pages/PlayJoin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card, 
  Alert, 
  Space,
} from 'antd';
import { 
  UserOutlined, 
  NumberOutlined, 
  LoginOutlined, 
  TeamOutlined 
} from '@ant-design/icons';
import { joinSession } from '../services/playerApi';

const { Content } = Layout;
const { Title, Text } = Typography;

function PlayJoin() {
  const { sessionId: urlSessionId } = useParams();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (urlSessionId) {
      form.setFieldsValue({ sessionId: urlSessionId });
    }
  }, [urlSessionId, form]);

  const handleSubmit = async (values) => {
    setError('');
    
    try {
      setLoading(true);
      const response = await joinSession(values.sessionId, values.playerName);
      
      // Save player ID to local storage to restore after page refresh
      localStorage.setItem('playerId', response.playerId);
      localStorage.setItem('playerName', values.playerName);
      localStorage.setItem('sessionId', values.sessionId);
      
      // Navigate to the game page
      navigate(`/play/game/${response.playerId}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join game. The session may not exist or may have already started.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="play-join-layout">
      <Content className="play-join-content">
        <Card 
          className="join-card"
          style={{ 
            maxWidth: 500, 
            margin: '40px auto', 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2}>
                <TeamOutlined /> Join Game
              </Title>
              <Text type="secondary">Enter the session ID and your name to join the game</Text>
            </div>
            
            {error && (
              <Alert 
                message="Join Failed" 
                description={error} 
                type="error" 
                showIcon 
                style={{ marginBottom: 16 }} 
              />
            )}
            
            <Form
              form={form}
              name="joinGame"
              onFinish={handleSubmit}
              layout="vertical"
              requiredMark={false}
              initialValues={{ 
                sessionId: urlSessionId || '',
                playerName: ''
              }}
            >
              <Form.Item
                name="sessionId"
                label="Session ID"
                rules={[{ required: true, message: 'Please enter the session ID' }]}
              >
                <Input 
                  size="large"
                  placeholder="Enter the session ID provided by the host" 
                  prefix={<NumberOutlined />}
                  disabled={!!urlSessionId}
                />
              </Form.Item>
              
              <Form.Item
                name="playerName"
                label="Your Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input 
                  size="large"
                  placeholder="Enter the nickname you want to display" 
                  prefix={<UserOutlined />}
                  maxLength={20}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  icon={<LoginOutlined />}
                  loading={loading}
                  block
                >
                  {loading ? 'Joining...' : 'Join Game'}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

export default PlayJoin;
