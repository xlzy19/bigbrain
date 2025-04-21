// src/pages/QuestionEdit.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Button, 
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Card,
  Divider,
  Breadcrumb,
  message,
  Spin,
  Switch,
} from 'antd';
import { 
  LogoutOutlined, 
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CheckOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-components';
import request from '../utils/request';
import { useAuth } from '../contexts/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function QuestionEdit() {
  const { gameId, questionId } = useParams();
  const [form] = Form.useForm();
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [questionType, setQuestionType] = useState('single');
  const [mediaType, setMediaType] = useState('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [answers, setAnswers] = useState([
    { answer: '', correct: true },
    { answer: '', correct: false }
  ]);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGameAndQuestion();
  }, [gameId, questionId]);

  const fetchGameAndQuestion = async () => {
    try {
      setLoading(true);
      const response = await request.get('/admin/games');
      
      if (response && response.games) {
        // Find the game with the specified ID
        const targetGame = response.games.find(g => g.id === parseInt(gameId));
        
        if (!targetGame) {
          throw new Error('Game not found');
        }
        
        setGame(targetGame);
        
        // Parse question ID (index)
        const questionIndex = parseInt(questionId);
        if (
          isNaN(questionIndex) || 
          !targetGame.questions || 
          questionIndex < 0 || 
          questionIndex >= targetGame.questions.length
        ) {
          throw new Error('Question does not exist');
        }
        
        // Get question data
        const questionData = targetGame.questions[questionIndex];
        setQuestion(questionData);
        
        // Set initial form values
        setQuestionType(questionData.type || 'single');
        form.setFieldsValue({
          question: questionData.question || '',
          type: questionData.type || 'single',
          duration: questionData.duration || 30,
          points: questionData.points || 100
        });
        
        // Set media
        if (questionData.media) {
          setMediaType('url');
          setMediaUrl(questionData.media);
          form.setFieldsValue({ mediaUrl: questionData.media });
        } else {
          setMediaType('none');
        }
        
        // Set answers
        if (questionData.answers && questionData.answers.length > 0) {
          setAnswers(questionData.answers.map(ans => ({
            answer: ans.answer,
            correct: ans.correct
          })));
        }
      } else {
        throw new Error('Failed to fetch game data');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch question details');
      setError(error.message || 'Failed to fetch question details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const values = await form.validateFields();
      
      // Validate answers
      const filledAnswers = answers.filter(a => a.answer.trim() !== '');
      if (filledAnswers.length < 2) {
        message.error('At least two valid answer options are required');
        return;
      }
      
      const correctAnswers = answers.filter(a => a.correct);
      if (values.type === 'single' && correctAnswers.length !== 1) {
        message.error('Single choice must have exactly one correct answer');
        return;
      } else if (values.type === 'multiple' && correctAnswers.length === 0) {
        message.error('Multiple choice must have at least one correct answer');
        return;
      } else if (values.type === 'truefalse' && correctAnswers.length !== 1) {
        message.error('True/False must have exactly one correct answer');
        return;
      }
      
      // Get all game data
      const response = await request.get('/admin/games');
      const allGames = response.games || [];
      
      // Deep clone current game data
      const updatedGame = JSON.parse(JSON.stringify(game));
      
      // Get the indexes of correct answers
      const correctAnswerIndexes = answers
        .map((answer, index) => answer.correct ? index : -1)
        .filter(index => index !== -1);
      
      // Create updated question
      const updatedQuestion = {
        type: values.type,
        question: values.question,
        duration: values.duration,
        points: values.points,
        answers: answers,
        correctAnswers: correctAnswerIndexes
      };
      
      // Add media (if any)
      if (mediaType === 'url' && values.mediaUrl) {
        updatedQuestion.media = values.mediaUrl;
      }
      
      // Update the specific question in the question list
      updatedGame.questions[parseInt(questionId)] = updatedQuestion;
      
      // Update the current game in the game list
      const updatedGames = allGames.map(g => 
        g.id === parseInt(gameId) ? updatedGame : g
      );
      
      // Submit the update
      await request.put('/admin/games', { games: updatedGames });
      
      message.success('Question updated successfully');
      
      // Go back to game edit page
      navigate(`/game/${gameId}`);
    } catch (error) {
      message.error('Failed to update the question');
      console.error(error);
    }
  };

  const handleTypeChange = (value) => {
    setQuestionType(value);
    
    // Reset answer options
    if (value === 'truefalse') {
      setAnswers([
        { answer: 'true', correct: true },
        { answer: 'false', correct: false }
      ]);
    } else if (value === 'single' && answers.filter(a => a.correct).length > 1) {
      // If switching from multiple to single choice, keep only the first correct answer
      const updatedAnswers = [...answers];
      let foundCorrect = false;
      updatedAnswers.forEach((answer, index) => {
        if (answer.correct) {
          if (!foundCorrect) {
            foundCorrect = true;
          } else {
            updatedAnswers[index].correct = false;
          }
        }
      });
      setAnswers(updatedAnswers);
    }
  };

  const handleAnswerChange = (index, field, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index][field] = value;
    
    // For single choice or true/false questions, ensure only one correct answer
    if (field === 'correct' && value === true && (questionType === 'single' || questionType === 'truefalse')) {
      updatedAnswers.forEach((answer, i) => {
        if (i !== index) {
          updatedAnswers[i].correct = false;
        }
      });
    }
    
    setAnswers(updatedAnswers);
  };

  const addAnswer = () => {
    if (answers.length < 6) {
      setAnswers([...answers, { answer: '', correct: false }]);
    }
  };

  const removeAnswer = (index) => {
    if (answers.length > 2) {
      const updatedAnswers = [...answers];
      updatedAnswers.splice(index, 1);
      setAnswers(updatedAnswers);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      message.error('Failed to log out');
      console.error(error);
    }
  };

  return (
    <Layout className="question-edit-layout">
      <PageHeader
        className="question-edit-header"
        title={<Title level={2}>Edit Question</Title>}
        subTitle={question ? `Question ${parseInt(questionId) + 1}` : 'Loading...'}
        onBack={() => navigate(`/game/${gameId}`)}
        extra={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={fetchGameAndQuestion}>
            Refresh
          </Button>,
          <Button key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        ]}
      />
      
      <Content className="question-edit-content">
        <Breadcrumb className="question-edit-breadcrumb">
          <Breadcrumb.Item>
            <Link to="/dashboard">Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to={`/game/${gameId}`}>Edit Game</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Edit Question</Breadcrumb.Item>
        </Breadcrumb>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Loading..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <Card>
              <p className="error-message">{error}</p>
              <Button type="primary" onClick={() => navigate(`/game/${gameId}`)}>
                Back to Game Editor
              </Button>
            </Card>
          </div>
        ) : (
          <Card className="question-form-card">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                type: 'single',
                duration: 30,
                points: 100,
                mediaType: 'none'
              }}
            >
              <Form.Item
                name="type"
                label="Question Type"
                rules={[{ required: true, message: 'Please select a question type' }]}
              >
                <Select onChange={handleTypeChange}>
                  <Option value="single">Single Choice</Option>
                  <Option value="multiple">Multiple Choice</Option>
                  <Option value="truefalse">True / False</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="question"
                label="Question Text"
                rules={[{ required: true, message: 'Please enter the question text' }]}
              >
                <TextArea rows={3} placeholder="Enter your question here..." />
              </Form.Item>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <Form.Item
                  name="duration"
                  label="Time Limit (seconds)"
                  rules={[{ required: true, message: 'Please set the time limit' }]}
                  style={{ width: '50%' }}
                >
                  <InputNumber min={5} max={300} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="points"
                  label="Points"
                  rules={[{ required: true, message: 'Please set the point value' }]}
                  style={{ width: '50%' }}
                >
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              
              <Form.Item name="mediaType" label="Media">
                <Radio.Group onChange={(e) => setMediaType(e.target.value)} value={mediaType}>
                  <Radio value="none">No Media</Radio>
                  <Radio value="url">Media URL</Radio>
                </Radio.Group>
              </Form.Item>
              
              {mediaType === 'url' && (
                <Form.Item
                  name="mediaUrl"
                  label="Media URL"
                >
                  <Input 
                    placeholder="Enter a media URL (YouTube video or image link）..." 
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                </Form.Item>
              )}
              
              <Divider>Answer Options</Divider>
              
              {questionType === 'truefalse' ? (
                <div>
                  {answers.map((answer, index) => (
                    <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <Text style={{ width: '100px' }}>{answer.answer}</Text>
                      <Switch
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        checked={answer.correct}
                        onChange={(checked) => handleAnswerChange(index, 'correct', checked)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {answers.map((answer, index) => (
                    <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={answer.answer}
                        onChange={(e) => handleAnswerChange(index, 'answer', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Switch
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        checked={answer.correct}
                        onChange={(checked) => handleAnswerChange(index, 'correct', checked)}
                      />
                      {answers.length > 2 && (
                        <Button
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeAnswer(index)}
                          danger
                        />
                      )}
                    </div>
                  ))}
                  
                  {answers.length < 6 && (
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={addAnswer}
                        icon={<PlusOutlined />}
                        style={{ width: '100%' }}
                      >
                        Add Option
                      </Button>
                    </Form.Item>
                  )}
                </div>
              )}
              
              <Divider />
              
              <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
                <Button 
                  onClick={() => navigate(`/game/${gameId}`)} 
                  style={{ marginRight: '12px' }}
                  icon={<CloseOutlined />}
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleSubmit}
                  icon={<SaveOutlined />}
                >
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Content>
    </Layout>
  );
}

export default QuestionEdit;