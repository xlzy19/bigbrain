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
    