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

  // Calculate total duration


  // Calculate number of questions

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

  return (
    <>
      <Card
        hoverable
        cover={
          thumbnail ? (
            <img
              alt={name}
              src={thumbnail}
              style={{ height: 160, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                height: 160,
                background: "#f0f2f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QuestionCircleOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
            </div>
          )
        }
        className="game-card-container"
      >
        <Card.Meta
          title={name}
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                {active ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="default">Not Started</Tag>
                )}
              </div>
            </Space>
          }
        />
        <div className="card-actions" style={{ marginTop: 16 }}>
          <Space size="small" style={{ width: "100%", justifyContent: "space-between" }}>
            <Tooltip title="Edit Game">
              <Link to={`/game/${id}`}>
                <Button icon={<EditOutlined />} type="text">
                  Edit
                </Button>
              </Link>
            </Tooltip>

            {!active ? (
              <Tooltip title="Start Game">
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onStartSession(id)}
                >
                  Start
                </Button>
              </Tooltip>
            ) : (
              <Space>
                <Tooltip title="View Session">
                  <Link to={`/session/${active}/${id}`}>
                    <Button icon={<EyeOutlined />} type="primary">
                      View
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip title="Stop Session">
                  <Button
                    icon={<StopOutlined />}
                    type="primary"
                    danger
                    onClick={() => onStopSession(id, active)}
                  >
                    Stop
                  </Button>
                </Tooltip>
              </Space>
            )}

            {oldSessions && oldSessions.length > 0 && (
              <Tooltip title="View History">
                <Button
                  icon={<HistoryOutlined />}
                  onClick={handleViewHistory}
                >
                  Review
                </Button>
              </Tooltip>
            )}

       
          </Space>
        </div>
      </Card>

      {/* History session modal */}
      <Modal
        title="Session History"
        open={showHistoryModal}
        onCancel={handleCloseHistoryModal}
        width={800}
        footer={null}
      >
        {selectedSession ? (
          <div>
            <Button 
              type="link" 
              onClick={() => setSelectedSession(null)}
              style={{ marginBottom: 16 }}
            >
              Back to Session List
            </Button>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" tip="Loading..." />
              </div>
            ) : (
              renderSessionResults()
            )}
          </div>
        ) : (
          <List
            dataSource={oldSessions || []}
            renderItem={(session) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    key={session}
                    onClick={() => handleViewSessionResult(session)}
                  >
                    View Results
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={`Session ${session}`}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
}

export default GameCard;
