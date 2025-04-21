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