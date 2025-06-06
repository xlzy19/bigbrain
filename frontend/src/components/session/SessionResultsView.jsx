// src/components/session/SessionResultsView.jsx
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Typography, 
  Divider, 
  Tag, 
  Space, 
  Avatar,
  Tabs
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  TeamOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const COLORS = ['#1890FF', '#36CBCB', '#4ECB73', '#FBD437', '#F2637B', '#975FE4', '#36CBCB'];

function SessionResultsView({ results, questions }) {
  if (!results || !results.results || results.results.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <QuestionCircleOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
          <Title level={4} style={{ marginTop: 16 }}>No Result Data</Title>
          <Paragraph type="secondary">No players have participated or completed the game yet</Paragraph>
        </div>
      </Card>
    );
  }

  // Compute overall statistics
  const totalPlayers = results.results.length;
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // Compute average score of all players
  const averageScore = results.results.reduce((sum, player) => {
    const playerScore = player.answers.reduce((total, answer, index) => {
      if (answer && answer.correct) {
        return total + (questions[index]?.points || 0);
      }
      return total;
    }, 0);
    return sum + playerScore;
  }, 0) / totalPlayers;

  // Compute questions with highest and lowest correct rate
  const correctRateData = questions.map((question, index) => {
    let correctCount = 0;
    let totalResponses = 0;
    results.results.forEach(playerResult => {
      if (playerResult.answers[index] && playerResult.answers[index].answerIds) {
        totalResponses++;
        if (playerResult.answers[index].correct) {
          correctCount++;
        }
      }
    });

    const correctRate = totalResponses > 0 ? (correctCount / totalResponses) * 100 : 0;

    return {
      questionIndex: index + 1,
      questionText: question.question?.substring(0, 20) + (question.question?.length > 20 ? '...' : ''),
      correctRate: correctRate,
      totalResponses: totalResponses,
      correctCount: correctCount,
      type: question.type,
      points: question.points
    };
  });


  // Compute average response time per question
  const timeData = questions.map((question, index) => {
    let totalTime = 0;
    let totalResponses = 0;
    let fastestTime = Infinity;
    let fastestPlayer = null;

    results.results.forEach(playerResult => {
      if (
        playerResult.answers[index] && 
        playerResult.answers[index].answeredAt && 
        playerResult.answers[index].questionStartedAt
      ) {
        const answerTime = new Date(playerResult.answers[index].answeredAt) - new Date(playerResult.answers[index].questionStartedAt);
        if (answerTime > 0) {
          totalTime += answerTime;
          totalResponses++;

          if (answerTime < fastestTime) {
            fastestTime = answerTime;
            fastestPlayer = playerResult.name;
          }
        }
      }
    });

    const avgTime = totalResponses > 0 ? totalTime / totalResponses / 1000 : 0;

    return {
      questionIndex: index + 1,
      questionText: question.question?.substring(0, 20) + (question.question?.length > 20 ? '...' : ''),
      avgTime: avgTime,
      totalResponses: totalResponses,
      fastestTime: fastestTime !== Infinity ? fastestTime / 1000 : 0,
      fastestPlayer: fastestPlayer,
      type: question.type,
      points: question.points
    };
  });


  // Compute total and detailed score for each player
  const playerScores = results.results.map(playerResult => {
    const answers = playerResult.answers.map((answer, index) => {
      const question = questions[index] || { question: 'Unknown Question', points: 0, type: 'unknown' };
      const answeredTime = answer?.answeredAt && answer?.questionStartedAt 
        ? (new Date(answer.answeredAt) - new Date(answer.questionStartedAt)) / 1000 
        : null;

      return {
        questionIndex: index + 1,
        questionText: question.question,
        correct: answer?.correct || false,
        points: answer?.correct ? (question.points || 0) : 0,
        answeredTime: answeredTime,
        type: question.type
      };
    });

    const totalScore = answers.reduce((total, a) => total + a.points, 0);
    const correctCount = answers.filter(a => a.correct).length;
    const correctRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      name: playerResult.name,
      score: totalScore,
      correctCount: correctCount,
      correctRate: correctRate,
      answers: answers,
      maxPossibleScore: totalPoints
    };
  });

  // Sort players by score to generate leaderboard
  const rankedPlayers = [...playerScores].sort((a, b) => b.score - a.score);
  const topPlayers = rankedPlayers.slice(0, 10);

  // Prepare leaderboard table columns
  const leaderboardColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_, record, index) => {
        console.log("🚀 ~ leaderboardColumns ~ record:", record);
        if (index === 0) return <Tag color="gold" icon={<TrophyOutlined />}>1</Tag>;
        if (index === 1) return <Tag color="silver">2</Tag>;
        if (index === 2) return <Tag color="bronze">3</Tag>;
        return <Tag>{index + 1}</Tag>;
      }
    },
    {
      title: 'Player',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      render: (score, record) => (
        <Space>
          <Text strong>{score}</Text>
          <Text type="secondary">/ {record.maxPossibleScore}</Text>
        </Space>
      )
    },
    {
      title: 'Accuracy',
      dataIndex: 'correctRate',
      key: 'correctRate',
      render: (rate) => (
        <Space>
          <Text>{Math.round(rate)}%</Text>
          <div style={{ width: 50, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
            <div 
              style={{ 
                width: `${rate}%`, 
                height: '100%', 
                backgroundColor: getColorByRate(rate),
                borderRadius: 4
              }} 
            />
          </div>
        </Space>
      )
    },
    {
      title: 'Correct Answers',
      dataIndex: 'correctCount',
      key: 'correctCount',
      render: (count) => (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text>{count} / {questions.length}</Text>
        </Space>
      )
    }
  ];

  // Question statistics table


  // Accuracy distribution pie chart data
  const correctRateDistribution = [
    { name: '>=90%', value: correctRateData.filter(q => q.correctRate >= 90).length },
    { name: '70-89%', value: correctRateData.filter(q => q.correctRate >= 70 && q.correctRate < 90).length },
    { name: '50-69%', value: correctRateData.filter(q => q.correctRate >= 50 && q.correctRate < 70).length },
    { name: '30-49%', value: correctRateData.filter(q => q.correctRate >= 30 && q.correctRate < 50).length },
    { name: '<30%', value: correctRateData.filter(q => q.correctRate < 30).length }
  ].filter(item => item.value > 0);

  // Get question type name

  // Get color by question type

  // Get color by accuracy rate
  function getColorByRate(rate) {
    if (rate >= 90) return '#52c41a';  // Green
    if (rate >= 70) return '#1890ff';  // Blue
    if (rate >= 50) return '#faad14';  // Yellow
    if (rate >= 30) return '#fa8c16';  // Orange
    return '#f5222d';  // Red
  }

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Players"
                  value={totalPlayers}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Questions"
                  value={totalQuestions}
                  prefix={<QuestionCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Points"
                  value={totalPoints}
                  prefix={<TrophyOutlined />}
                  suffix="pts"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Average Score" 
                  value={averageScore}
                  prefix={<StarOutlined />}
                  suffix="pts" />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">Leaderboard Top 10</Divider>

          <Card>
            <Table 
              dataSource={topPlayers} 
              columns={leaderboardColumns} 
              rowKey="name"
              pagination={false}
            />
          </Card>
        </>
      )
    },
    {
      key: 'questions',
      label: 'Question Analysis',
      children: (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="Question Accuracy">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={correctRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="questionIndex" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                      labelFormatter={(value) => `Question ${value}`}
                    />
                    <Legend />
                    <Bar dataKey="correctRate" name="Accuracy" fill="#1890ff">
                      {correctRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColorByRate(entry.correctRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Accuracy Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={correctRateDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {correctRateDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Number of Questions']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

        ...
          <Divider>Average Response Time</Divider>

          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="questionIndex" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} s`, 'Avg. Time']}
                  labelFormatter={(value) => `Question ${value}`}
                />
                <Legend />
                <Bar dataKey="avgTime" name="Average Response Time" fill="#36CBCB" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

        </>
      )
    },
    {
      key: 'players',
      label: 'Player Analysis',
      children: (
        <>
          <Card title="Score Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankedPlayers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} pts`, 'Score']}
                />
                <Legend />
                <Bar dataKey="score" name="Score" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Divider>Player Accuracy</Divider>

          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankedPlayers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Accuracy']}
                />
                <Legend />
                <Bar dataKey="correctRate" name="Accuracy" fill="#4ECB73">
                  {rankedPlayers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByRate(entry.correctRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Divider>Full Leaderboard</Divider>

          <Card>
            <Table 
              dataSource={rankedPlayers} 
              columns={leaderboardColumns}
              rowKey="name"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )
    }
  ];

  return (
    <div className="session-results-view">
      <Card>
        <Title level={2} style={{ textAlign: 'center', margin: '16px 0' }}>
          Game Results Overview
        </Title>

        <Tabs 
          defaultActiveKey="overview" 
          items={tabItems}
          type="card"
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}

export default SessionResultsView;
