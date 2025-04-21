import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  message,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getPlayerStatus,
  getPlayerQuestion,
  submitPlayerAnswer,
  getCorrectAnswer,
  getPlayerResults,
} from "../services/playerApi";

const { Content, Header } = Layout;
const { Title, Text } = Typography;

function PlayGame() {
  const { playerId } = useParams();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [, setQuestionStartTime] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [, setTotalScore] = useState(0);
  const [isFetchingAnswer, setIsFetchingAnswer] = useState(false);

  const timerIntervalRef = useRef(null);

  const navigate = useNavigate();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getQuestionTypeName = (type) => {
    switch (type) {
    case "single":
      return "Single Choice";
    case "multiple":
      return "Multiple Choice";
    case "truefalse":
      return "True / False";
    default:
      return "Unknown Type";
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
    case "single":
      return "blue";
    case "multiple":
      return "green";
    case "truefalse":
      return "orange";
    default:
      return "default";
    }
  };

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const fetchGameStatus = async () => {
    try {
      const statusData = await getPlayerStatus(playerId);
      return statusData;
    } catch (error) {
      console.error("Failed to fetch game status", error);
      const resultsData = await getPlayerResults(playerId);
      setTotalScore(resultsData.totalScore || 0);
      navigate(`/play/results/${playerId}`);
      throw error;
    }
  };

  const fetchQuestion = async () => {
    try {
      const questionData = await getPlayerQuestion(playerId);
      return questionData;
    } catch (error) {
      console.error("Failed to fetch question", error);
      throw error;
    }
  };

  const fetchCorrectAnswer = useCallback(async () => {
    if (showAnswer || !currentQuestion || isFetchingAnswer) return;

    try {
      setIsFetchingAnswer(true);
      stopTimer();

      const answerData = await getCorrectAnswer(playerId);
      console.log("🚀 ~ fetchCorrectAnswer ~ answerData:", answerData);

      const correctAnswerIds = answerData.answers || [];
      console.log("Correct answer IDs:", correctAnswerIds);
      console.log("User selected answers:", selectedAnswers);
      setCorrectAnswers(correctAnswerIds);
      setShowAnswer(true);

      if (selectedAnswers.length > 0) {
        const correctSelected = selectedAnswers.filter((id) =>
          correctAnswerIds.includes(id)
        ).length;

        const allCorrectSelected =
          correctAnswerIds.length === correctSelected &&
          selectedAnswers.length === correctAnswerIds.length;

        console.log("Answer evaluation:", {
          correctSelected,
          totalCorrect: correctAnswerIds.length,
          userSelected: selectedAnswers.length,
          allCorrectSelected,
        });

        if (allCorrectSelected) {
          setScore(currentQuestion.points || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch answer", error);
    } finally {
      setIsFetchingAnswer(false);
    }
  }, [
    playerId,
    showAnswer,
    currentQuestion,
    selectedAnswers,
    stopTimer,
    isFetchingAnswer,
  ]);
  const startTimer = useCallback(
    (initialTime) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (initialTime <= 0 || showAnswer) {
        if (
          initialTime <= 0 &&
          !showAnswer &&
          currentQuestion &&
          !isFetchingAnswer
        ) {
          setTimeRemaining(0);
        }
        return;
      }

      setTimeRemaining(initialTime);

      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;

            if (!showAnswer && !isFetchingAnswer) {
              setTimeRemaining(0);
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
    },
    [showAnswer, currentQuestion, isFetchingAnswer]
  );


  const submitAnswer = async (answers) => {
    try {
      await submitPlayerAnswer(playerId, answers);
      message.success("Answer submitted successfully");
    } catch (error) {
      console.error("Failed to submit answer", error);
    }
  };

  const handleAnswerSelect = (answerId) => {
    if (showAnswer || timeRemaining <= 0) return;

    if (
      currentQuestion.type === "single" ||
      currentQuestion.type === "truefalse"
    ) {
      setSelectedAnswers([answerId]);
    } else if (currentQuestion.type === "multiple") {
      const isSelected = selectedAnswers.includes(answerId);
      const newSelectedAnswers = isSelected
        ? selectedAnswers.filter((id) => id !== answerId)
        : [...selectedAnswers, answerId];

      setSelectedAnswers(newSelectedAnswers);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) return;
    await submitAnswer(selectedAnswers);
    fetchCorrectAnswer();
  };

  const checkGameStatus = useCallback(async () => {
    setLoading(true);
    try {
      if (isFetchingAnswer) {
        setLoading(false);
        return;
      }
      
      const statusData = await fetchGameStatus();
      setGameStarted(statusData.started);
      
      if (statusData.started) {
        setQuestionLoading(true);
        try {
          const questionData = await fetchQuestion();
          
          const questionObj = questionData.question || questionData;
          console.log(questionObj);
          if (currentQuestion && currentQuestion.id === questionObj.id) {
            setQuestionLoading(false);
            setLoading(false);
            message.error("Waiting for host action");
            
            return;
          }
          
          if (!currentQuestion || currentQuestion.id !== questionObj.id) {
            setSelectedAnswers([]);
            setShowAnswer(false);
            setCorrectAnswers([]);
            setQuestionNumber(prev => prev + 1);
            
            stopTimer();
          }
          
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
          
          if (questionData.isoTimeLastQuestionStarted) {
            const startTime = new Date(questionData.isoTimeLastQuestionStarted);
            setQuestionStartTime(startTime);
            
            const currentTime = new Date();
            const elapsedTime = (currentTime - startTime) / 1000;
            const remainingTime = Math.max(0, formattedQuestion.time - elapsedTime);
            
            setTimeRemaining(remainingTime);
            
            if (remainingTime <= 0 && !showAnswer && !isFetchingAnswer) {
              fetchCorrectAnswer();
            } 
          } else {
            setTimeRemaining(formattedQuestion.time);
          }
        } catch (error) {
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
      } else {
        // Game has ended, fetch the final score
        try {
          const resultsData = await getPlayerResults(playerId);
          setTotalScore(resultsData.totalScore || 0);
          navigate(`/play/results/${playerId}`);
        // eslint-disable-next-line no-unused-vars
        } catch (error) { 
          setError('Failed to fetch game results');
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError('Game has ended');
    } finally {
      setLoading(false);
    }
  }, [
    playerId, 
    navigate, 
    currentQuestion, 
    stopTimer, 
    fetchCorrectAnswer,
    isFetchingAnswer,
    showAnswer
  ]);