// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Empty,
  Spin,
  Modal,
  message,
} from "antd";
import { PageHeader } from "@ant-design/pro-components";
import {
  PlusOutlined,
  LogoutOutlined,
  ReloadOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import {
  getAllGames,
  createGame,
  endGameSession,
  deleteGame,
  startGameSession,
} from "../services/gameApi";
import request from "../utils/request";
import GameCard from "../components/game/GameCard";
import NewGameModal from "../components/game/NewGameModal";
import SessionStartedModal from "../components/session/SessionStartedModal";

const { Content } = Layout;
const { Title } = Typography;

function Dashboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [stoppedSessionId, setStoppedSessionId] = useState(null);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const gamesData = await getAllGames();
      setGames(gamesData);
    } catch (error) {
      message.error("Failed to fetch game list");
      setError("Failed to fetch game list");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (gameData) => {
    try {
      // Fetch all current games from the API
      const currentGames = await getAllGames();

      // Generate a new game object
      const newGame = {
        id: Math.floor(Math.random() * 90000000) + 10000000, // Generate an 8-digit random ID
        name: gameData.name,
        owner: gameData.owner,
        questions: gameData.questions,
      };

      // Prepare merged game data
      let updatedGames = [];

      // Check if currentGames has a games array
      if (
        currentGames &&
        currentGames.games &&
        Array.isArray(currentGames.games)
      ) {
        // Append the new game to the existing list
        updatedGames = [...currentGames.games, newGame];
      } else {
        // If no existing games or wrong format, use only the new game
        updatedGames = [newGame];
      }

      // Submit the merged game data via API
      const response = await request.put("/admin/games", {
        games: updatedGames,
      });