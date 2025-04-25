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
    // Do not start the timer if the initial time is less than or equal to 0 or the answer has already been shown
    if (initialTime <= 0 || showAnswer) {
        // If time is up and the answer has not been shown yet, fetch the answer
        if (initialTime <= 0 && !showAnswer && currentQuestion && !isFetchingAnswer) {
          fetchCorrectAnswer();
        }
        return;
      }
      
      setTimeRemaining(initialTime);
      
      // Create a new timer that decreases the time by 1 second every second
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            // Time's up: clear the timer and fetch the correct answer
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            
            // Only fetch the answer if it hasn't been shown and no fetch is in progress
            if (!showAnswer && !isFetchingAnswer) {
              fetchCorrectAnswer();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }, [showAnswer, fetchCorrectAnswer, currentQuestion, isFetchingAnswer]);
  
    // Handle countdown completion
    const handleTimerEnd = useCallback(async () => {
      // Execute only if the answer has not been shown
      if (!showAnswer && !isFetchingAnswer) {
        stopTimer();
        await fetchCorrectAnswer();
      }
    }, [showAnswer, isFetchingAnswer, stopTimer, fetchCorrectAnswer]);
  
    // Submit the answer
    const submitAnswer = async (answers) => {
      try {
        await submitPlayerAnswer(playerId, answers);
      } catch (error) {
        console.error('Failed to submit answer', error);
      }
    };
  
    // Handle answer selection
    const handleAnswerSelect = (answerId) => {
      if (showAnswer) return; // Do not allow selection if the answer has already been shown
      
      if (currentQuestion.type === 'single' || currentQuestion.type === 'truefalse') {
        // For single choice or true/false questions, only one answer can be selected
        setSelectedAnswers([answerId]);
        submitAnswer([answerId]);
      } else if (currentQuestion.type === 'multiple') {
        // For multiple choice questions, multiple answers can be selected
        const isSelected = selectedAnswers.includes(answerId);
        const newSelectedAnswers = isSelected
          ? selectedAnswers.filter(id => id !== answerId)
          : [...selectedAnswers, answerId];
        
        setSelectedAnswers(newSelectedAnswers);
        submitAnswer(newSelectedAnswers);
      }
    };
  
    // Check game status - core function
    const checkGameStatus = useCallback(async () => {
      // Prevent duplicate requests: skip if the last request was made less than 2 seconds ago
      
      console.log("🚀 ~ checkGameStatus ~ questionLoading:", questionLoading);
      console.log("🚀 ~ checkGameStatus ~ currentQuestion :", currentQuestion);
      console.log("🚀 ~ checkGameStatus ~ showAnswer :", showAnswer);
      const now = new Date();
      // if (lastCheckedTime && now - lastCheckedTime < 2000) {
      //   return;
      // }
      if (currentQuestion?.id ) {
        if (lastCheckedTime && now - lastCheckedTime < 200000) {
          return;
        }
      } else {
        if (lastCheckedTime && now - lastCheckedTime < 2000) {
          return;
        }
      }
   
      
      setLastCheckedTime(now);
      
      try {
        // Skip status check if the answer is being fetched or has already been shown
        if (isFetchingAnswer) {
          return;
        }
        
        const statusData = await fetchGameStatus();
        setGameStarted(statusData.started);
        
        // If the game has started, fetch the current question
        if (statusData.started) {
          setQuestionLoading(true);
          try {
            const questionData = await fetchQuestion();
            
            // Adapt to the API response format
            const questionObj = questionData.question || questionData;
            
            // If the question has changed, reset the selected answers
            if (!currentQuestion || currentQuestion.id !== questionObj.id) {
              setSelectedAnswers([]);
              setShowAnswer(false);
              setCorrectAnswers([]);
              setQuestionNumber(prev => prev + 1);
              
              // Reset the timer
              stopTimer();
            }
            
            // Ensure we have a properly formatted question object
            const formattedQuestion = {
              ...questionObj,
              id: questionObj.id || `q-${Date.now()}`,
              type: questionObj.type || 'single',
              text: questionObj.question || questionObj.content,
              time: questionObj.duration || questionObj.timeLimit || 60,
              points: questionObj.points || 100,
              answers: (questionObj.answers || []).map((ans, index) => ({
                id: ans.id || index,
                text: ans.answer || ans.content,
                correct: ans.correct
              }))
            };
            
            setCurrentQuestion(formattedQuestion);
            
            // Set the question start time and remaining time
            if (questionData.isoTimeLastQuestionStarted) {
              const startTime = new Date(questionData.isoTimeLastQuestionStarted);
              setQuestionStartTime(startTime);
              
              const currentTime = new Date();
              const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
              const remainingTime = Math.max(0, formattedQuestion.time - elapsedTime);
              
              setTimeRemaining(remainingTime);
              
              // Only handle the timer if the answer has not been shown
              if (remainingTime <= 0 && !showAnswer && !isFetchingAnswer) {
                fetchCorrectAnswer();
              } 
              // Do not call startTimer directly; let useEffect handle it
            } else {
              setTimeRemaining(formattedQuestion.time);
              // Do not call startTimer directly; let useEffect handle it
            }
          } catch (error) {
            // If fetching the question fails, the game may have ended
            if (error.response?.status === 400) {
              try {
                const resultsData = await getPlayerResults(playerId);
                setTotalScore(resultsData.totalScore || 0);
                navigate(`/play/results/${playerId}`);
              // eslint-disable-next-line no-unused-vars
              } catch (resultError) {
                setError('Failed to fetch game results');
              }
            } else {
              setError('Failed to fetch question');
            }
          } finally {
            setQuestionLoading(false);
          }
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError('Failed to check game status');
      } finally {
        setLoading(false);
      }
    }, [
      playerId, 
      navigate, 
      lastCheckedTime, 
      currentQuestion, 
      showAnswer, 
      stopTimer, 
      fetchCorrectAnswer,
      isFetchingAnswer
    ]);
  // Manually refresh the status
  const refreshStatus = useCallback(() => {
    checkGameStatus();
  }, [checkGameStatus]);

  // Create a safe polling function
  const startPolling = useCallback(() => {
    // If polling is already active, do not start a new one
    if (pollingIntervalRef.current) {
      return;
    }
    
    // Perform an immediate status check
    checkGameStatus();
    
    // Set a timer to check the status every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkGameStatus();
    }, 5000);
  }, [checkGameStatus]);

  // Start polling on initialization and clean up on component unmount
  useEffect(() => {
    // Start polling on initialization
    startPolling();
    
    // Clear polling and timer on component unmount
    return () => {
      stopPolling();
      stopTimer();
    };
  }, [startPolling, stopPolling, stopTimer]);

  // Determine whether to continue polling based on game and question status
  useEffect(() => {
    // If the answer has been shown, start polling to wait for the next question
    if (showAnswer) {
      startPolling();
      return;
    }
    
    // If the game hasn't started, continue polling until it begins
    if (!gameStarted) {
      startPolling();
      return;
    }
    
    // If there is no question or a question is still loading, continue polling until one is available
    if (!currentQuestion || questionLoading) {
      startPolling();
      return;
    }

    // If a question is available but the answer hasn't been shown, stop polling
    if (currentQuestion && !showAnswer) {
      stopPolling();
      return;
    }
  }, [
    gameStarted, 
    currentQuestion, 
    questionLoading, 
    showAnswer, 
    startPolling, 
    stopPolling
  ]);

  // Control the timer when the question or showAnswer state changes
  useEffect(() => {
    // Only start the timer if a question exists, the answer is not shown, and time remains
    if (currentQuestion && !showAnswer && timeRemaining > 0) {
      startTimer(timeRemaining);
    } else {
      // Stop the countdown
      stopTimer();
      
      // If time has run out and the answer hasn't been shown, fetch the correct answer
      if (timeRemaining <= 0 && !showAnswer && currentQuestion && !isFetchingAnswer) {
        fetchCorrectAnswer();
      }
    }
    
    return () => stopTimer();
  }, [
    currentQuestion, 
    showAnswer, 
    timeRemaining, 
    startTimer, 
    stopTimer, 
    fetchCorrectAnswer,
    isFetchingAnswer
  ]);

  // Loading state
  if (loading) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <div className="loading-container">
            <Spin size="large" tip="Loading..." />
          </div>
        </Content>
      </Layout>
    );
  }

  // Game not started state
  if (!gameStarted) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <Result
            icon={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
            title="Waiting for the game to start"
            subTitle="The host will start the game shortly. Please wait..."
            extra={
              <Button type="primary" onClick={refreshStatus}>
                Refresh status
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

  // If there is no current question or the question is still loading
  if (!currentQuestion || questionLoading) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <Result
            icon={<WarningOutlined style={{ color: '#faad14' }} />}
            title="Waiting for the next question"
            subTitle="The host will release the next question shortly. Please wait..."
            extra={
              <Button type="primary" onClick={refreshStatus}>
                Refresh status
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="play-game-layout">
      <Header className="play-game-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              question {questionNumber}
            </Title>
          </div>
          <div className="header-right">
            {timeRemaining > 0 && !showAnswer ? (
              <div className="timer-container">
                <ClockCircleOutlined />
                <Text style={{ color: '#fff', marginLeft: 8 }}>
                  {formatTime(timeRemaining)}
                </Text>
              </div>
            ) : (
              <Text style={{ color: '#fff' }}>
                <TrophyOutlined /> Score: {score}
              </Text>
            )}
          </div>
        </div>
      </Header>
      
      <Content className="play-game-content">
        {error && (
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        )}