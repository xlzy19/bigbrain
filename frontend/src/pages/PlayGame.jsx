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

  useEffect(() => {
    checkGameStatus();

    return () => {
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (currentQuestion && !showAnswer && timeRemaining > 0) {
      startTimer(timeRemaining);
    } else {
      stopTimer();

      if (
        timeRemaining <= 0 &&
        !showAnswer &&
        currentQuestion &&
        !isFetchingAnswer
      ) {
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
    isFetchingAnswer,
  ]);

  const renderRefreshButton = () => (
    <Button
      type="primary"
      icon={<ReloadOutlined />}
      onClick={checkGameStatus}
      style={{ marginBottom: 16 }}
      loading={loading || questionLoading}
    >
      Refresh
    </Button>
  );

  if (loading) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <div className="loading-container">
            <Spin size="large" tip="loading..." />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!gameStarted) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <Result
            icon={<QuestionCircleOutlined style={{ color: "#1890ff" }} />}
            title="Waiting for the game to start"
            subTitle="The host will start the game shortly. Please click the refresh button to check the status"
            extra={renderRefreshButton()}
          />
        </Content>
      </Layout>
    );
  }

  if (!currentQuestion || questionLoading) {
    return (
      <Layout className="play-game-layout">
        <Content className="play-game-content">
          <Result
            icon={<WarningOutlined style={{ color: "#faad14" }} />}
            title="Waiting for the next question"
            subTitle="The host will release the next question soon. Please click the refresh button to check the status"
            extra={renderRefreshButton()}
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
            <Title level={4} style={{ margin: 0, color: "#fff" }}>
              Question {questionNumber}
            </Title>
          </div>
          <div className="header-right">
            {timeRemaining > 0 && !showAnswer ? (
              <div className="timer-container">
                <ClockCircleOutlined />
                <Text style={{ color: "#fff", marginLeft: 8 }}>
                  {formatTime(timeRemaining)}
                </Text>
              </div>
            ) : (
              <Text style={{ color: "#fff" }}>
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

        {showAnswer && renderRefreshButton()}

        <Card className="question-card">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div className="question-header">
              <Title level={3}>{currentQuestion.text}</Title>
              <Space>
                <Tag color={getQuestionTypeColor(currentQuestion.type)}>
                  {getQuestionTypeName(currentQuestion.type)}
                </Tag>
                <Tag color="gold">
                  <TrophyOutlined /> {currentQuestion.points} points
                </Tag>
              </Space>
            </div>

            {currentQuestion.media && (
              <div className="question-media">
                {currentQuestion.media.includes("youtube") ||
                currentQuestion.media.includes("youtu.be") ? (
                    <iframe
                      width="100%"
                      height="315"
                      src={currentQuestion.media}
                      title="Question Media"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <img
                      src={currentQuestion.media}
                      alt="Question Media"
                      style={{ maxWidth: "100%", maxHeight: "300px" }}
                    />
                  )}
              </div>
            )}

            <div className="question-info">
              {timeRemaining > 0 && !showAnswer ? (
                <Progress
                  percent={Math.round(
                    (timeRemaining / currentQuestion.time) * 100
                  )}
                  status="active"
                  showInfo={false}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
              ) : (
                <Divider>Answer</Divider>
              )}
            </div>

            <div className="answer-options">
              {currentQuestion.type === "single" ||
              currentQuestion.type === "truefalse" ? (
                  <Radio.Group
                    value={selectedAnswers[0]}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    disabled={showAnswer || timeRemaining <= 0}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {currentQuestion.answers.map((answer, index) => {
                        const answerId = answer.id || index;
                        const isSelected = selectedAnswers.includes(answerId);
                        const isCorrect =
                        showAnswer && correctAnswers.includes(answerId);

                        return (
                          <Radio
                            key={answerId}
                            value={answerId}
                            style={{
                              width: "100%",
                              padding: "12px",
                              border: "1px solid #d9d9d9",
                              borderRadius: "4px",
                              marginRight: 0,
                              backgroundColor: isCorrect
                                ? "#f6ffed"
                                : showAnswer && isSelected && !isCorrect
                                  ? "#fff1f0"
                                  : "",
                              borderColor: isCorrect
                                ? "#b7eb8f"
                                : showAnswer && isSelected && !isCorrect
                                  ? "#ffa39e"
                                  : "",
                            }}
                          >
                            <Space>
                              <span>{answer.text}</span>
                              {showAnswer && isCorrect && (
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a" }}
                                />
                              )}
                              {showAnswer && isSelected && !isCorrect && (
                                <CloseCircleOutlined
                                  style={{ color: "#f5222d" }}
                                />
                              )}
                            </Space>
                          </Radio>
                        );
                      })}
                    </Space>
                  </Radio.Group>
                ) : (
                  <Checkbox.Group
                    value={selectedAnswers}
                    onChange={(values) => {
                      if (!showAnswer && timeRemaining > 0) {
                        setSelectedAnswers(values);
                      }
                    }}
                    disabled={showAnswer || timeRemaining <= 0}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {currentQuestion.answers.map((answer, index) => {
                        const answerId = answer.id || index;
                        const isSelected = selectedAnswers.includes(answerId);
                        const isCorrect =
                        showAnswer && correctAnswers.includes(answerId);

                        return (
                          <Checkbox
                            key={answerId}
                            value={answerId}
                            style={{
                              width: "100%",
                              padding: "12px",
                              border: "1px solid #d9d9d9",
                              borderRadius: "4px",
                              marginRight: 0,
                              backgroundColor: isCorrect
                                ? "#f6ffed"
                                : showAnswer && isSelected && !isCorrect
                                  ? "#fff1f0"
                                  : "",
                              borderColor: isCorrect
                                ? "#b7eb8f"
                                : showAnswer && isSelected && !isCorrect
                                  ? "#ffa39e"
                                  : "",
                            }}
                          >
                            <Space>
                              <span>{answer.text}</span>
                              {showAnswer && isCorrect && (
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a" }}
                                />
                              )}
                              {showAnswer && isSelected && !isCorrect && (
                                <CloseCircleOutlined
                                  style={{ color: "#f5222d" }}
                                />
                              )}
                            </Space>
                          </Checkbox>
                        );
                      })}
                    </Space>
                  </Checkbox.Group>
                )}
            </div>

            {showAnswer && (
              <Alert
                message={
                  <div className="answer-result">
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedAnswers.length > 0 &&
                      correctAnswers.length > 0 &&
                      selectedAnswers.every((id) =>
                        correctAnswers.includes(id)
                      ) &&
                      correctAnswers.every((id) =>
                        selectedAnswers.includes(id)
                      ) ? (
                          <span style={{ color: "#52c41a" }}>
                            <CheckCircleOutlined /> You are right！
                          </span>
                        ) : (
                          <span style={{ color: "#f5222d" }}>
                            <CloseCircleOutlined /> You are wrong！
                          </span>
                        )}
                    </Title>
                    <Text>
                      {selectedAnswers.length > 0 &&
                      correctAnswers.length > 0 &&
                      selectedAnswers.every((id) =>
                        correctAnswers.includes(id)
                      ) &&
                      correctAnswers.every((id) => selectedAnswers.includes(id))
                        ? `You earned ${currentQuestion.points} points!`
                        : "No points awarded"}
                    </Text>
                  </div>
                }
                type={
                  selectedAnswers.length > 0 &&
                  correctAnswers.length > 0 &&
                  selectedAnswers.every((id) => correctAnswers.includes(id)) &&
                  correctAnswers.every((id) => selectedAnswers.includes(id))
                    ? "success"
                    : "error"
                }
                showIcon={false}
                style={{ textAlign: "center" }}
              />
            )}

            {!showAnswer ? (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                style={{ width: "100%" }}
                disabled={selectedAnswers.length === 0 || timeRemaining <= 0}
              >
                {timeRemaining <= 0 ? "Time's up" : "Submit Answer"}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={checkGameStatus}
                style={{ width: "100%", marginTop: 16 }}
              >
                Get Next Question
              </Button>
            )}

            {timeRemaining <= 0 && !showAnswer && (
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={checkGameStatus}
                style={{ width: "100%", marginTop: 16 }}
              >
                Refresh Game Status
              </Button>
            )}
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

export default PlayGame;
