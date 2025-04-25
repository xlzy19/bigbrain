// src/components/question/QuestionList.jsx
import { Card, List, Button, Space, Tag, Typography, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Text } = Typography;

function QuestionList({ questions, gameId, onDelete }) {
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">No questions yet. Click the &quot;Add Question&quot; button.</Text>
        </div>
      </Card>
    );
  }

  return (
    <List
      className="question-list"
      itemLayout="horizontal"
      dataSource={questions}
      renderItem={(question, index) => (
        <List.Item
          key={index}
          actions={[
            <Link to={`/game/${gameId}/question/${index}`} key="edit">
              <Button 
                type="text" 
                icon={<EditOutlined />}
              >
                Edit
              </Button>
            </Link>,
            <Popconfirm
              key="delete"
              title="Are you sure you want to delete this question?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => onDelete(index)}
            >
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          ]}
        >
          <Card 
            style={{ width: '100%' }} 
            hoverable
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>Question {index + 1}:</Text>
                  <Text>{question.question}</Text>
                  <Tag color={getQuestionTypeColor(question.type)}>
                    {getQuestionTypeName(question.type)}
                  </Tag>
                </Space>
              }
              description={
                <Space size="large">
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{question.duration} sec</Text>
                  </Space>
                  <Space>
                    <TrophyOutlined />
                    <Text>{question.points} pts</Text>
                  </Space>
                  <Space>
                    <Text>Options:</Text>
                    <Text>{question.answers ? question.answers.length : 0}</Text>
                  </Space>
                  {question.media && (
                    <Tag color="blue">Media Attached</Tag>
                  )}
                </Space>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
}

function getQuestionTypeName(type) {
  switch (type) {
  case 'single':
    return 'Single Choice';
  case 'multiple':
    return 'Multiple Choice';
  case 'truefalse':
    return 'True/False';
  default:
    return 'Unknown Type';
  }
}

function getQuestionTypeColor(type) {
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
}

export default QuestionList;
