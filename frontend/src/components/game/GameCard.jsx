// src/components/game/GameCard.jsx
import { Card, Button, Space, Tooltip, Tag,  Modal, List, Spin, message } from "antd";
import {
  EditOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  StopOutlined
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useState } from "react";
import { getSessionResults } from "../../services/gameApi";
import SessionResultsView from "../session/SessionResultsView";

function GameCard({ game, onStartSession, onStopSession }) {
  console.log("🚀 ~ GameCard ~ game:", game);
  const { id, name, thumbnail, questions, active, oldSessions } = game;
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionResults, setSessionResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle viewing historical sessions
  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  // Handle viewing session results
  const handleViewSessionResult = async (sessionId) => {
    try {
      setLoading(true);
      const results = await getSessionResults(sessionId);
      setSessionResults(results);
      setSelectedSession(sessionId);
    } catch (error) {
      message.error("Failed to fetch session results");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Close history modal
  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedSession(null);
    setSessionResults(null);
  };

  // Render session results
  const renderSessionResults = () => {
    if (!sessionResults) return null;

    return (
      <div className="session-results">
        <SessionResultsView
          results={sessionResults}
          questions={questions}
        />
      </div>
    );
  };
}

export default GameCard;
