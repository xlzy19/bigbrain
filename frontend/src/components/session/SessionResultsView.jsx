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
}