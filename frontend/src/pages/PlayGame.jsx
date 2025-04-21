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