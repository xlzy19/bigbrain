// src/pages/PlayGame.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Layout, 
  Typography, 
  Button, 
  Radio, 
  Checkbox, 
  Space, 
  Result, 
  Progress, 
  Spin, 
  Alert,
  Tag,
  Divider,
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { 
  getPlayerStatus, 
  getPlayerQuestion, 
  submitPlayerAnswer,
  getCorrectAnswer,
  getPlayerResults
} from '../services/playerApi';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

function PlayGame() {
  const { playerId } = useParams();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [, setQuestionStartTime] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [, setTotalScore] = useState(0);
  // Add a status flag to indicate whether the answer is being fetched
  const [isFetchingAnswer, setIsFetchingAnswer] = useState(false);
  
  // Use useRef to store polling status and countdown timer
  const pollingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  const navigate = useNavigate();

  // Format the remaining time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get question type name
  const getQuestionTypeName = (type) => {
    switch (type) {
    case 'single':
      return 'Single choice question';
    case 'multiple':
      return 'Multiple choice question';
    case 'truefalse':
      return 'True/False question';
    default:
      return 'Unknown type';
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

  // Function to stop the timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Stop polling status
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Independent function to fetch game status - without dependencies
  const fetchGameStatus = async () => {
    try {
      const statusData = await getPlayerStatus(playerId);
      return statusData;
    } catch (error) {
      console.error('Failed to fetch game status', error);
      
      throw error;
    }
  };

  // Independent function to fetch question - without dependencies
  const fetchQuestion = async () => {
    try {
      const questionData = await getPlayerQuestion(playerId);
      return questionData;
    } catch (error) {
      console.error('Failed to fetch question', error);
      throw error;
    }
  };

  // Function to fetch the correct answer
  const fetchCorrectAnswer = useCallback(async () => {
    // Prevent duplicate fetching
    if (showAnswer || !currentQuestion || isFetchingAnswer) return;
    
    try {
      setIsFetchingAnswer(true);
      // Stop the timer
      stopTimer();
      
      const answerData = await getCorrectAnswer(playerId);
      console.log("🚀 ~ fetchCorrectAnswer ~ answerData:", answerData);
      
      // Modify here to extract the correct answer based on the response data structure
      // The backend returns data in the format: { answers: [0] }
      const correctAnswerIds = answerData.answers || [];
      console.log("Correct answer IDs:", correctAnswerIds);
      console.log("User-selected answers:", selectedAnswers);
      setCorrectAnswers(correctAnswerIds);
      setShowAnswer(true);
      
      // Calculate the score
      if (selectedAnswers.length > 0) {
        const correctSelected = selectedAnswers.filter(id => 
          correctAnswerIds.includes(id)
        ).length;
        
        const allCorrectSelected = correctAnswerIds.length === correctSelected && 
                                  selectedAnswers.length === correctAnswerIds.length;
        
        console.log("Answer evaluation:", {
          correctSelected,
          totalCorrect: correctAnswerIds.length,
          userSelected: selectedAnswers.length,
          allCorrectSelected
        });
        
        if (allCorrectSelected) {
          setScore(currentQuestion.points || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch answer', error);
    } finally {
      setIsFetchingAnswer(false);
    }
  }, [playerId, showAnswer, currentQuestion, selectedAnswers, stopTimer, isFetchingAnswer]);

  // Start the countdown
  const startTimer = useCallback((initialTime) => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }