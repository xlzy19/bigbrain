// src/components/question/AddQuestionModal.jsx
import { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Radio, 
  Button, 
  Divider, 
  Switch,
  Typography,
  message
} from 'antd';
import { 
  PlusOutlined, 
  MinusCircleOutlined, 
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

function AddQuestionModal({ onClose, onAdd }) {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState('single');
  const [answers, setAnswers] = useState([
    { answer: '', correct: true },
    { answer: '', correct: false }
  ]);
  const [mediaType, setMediaType] = useState('none');
  const [mediaUrl, setMediaUrl] = useState('');

  const handleSubmit = () => {
    form.validateFields().then(values => {
      // Build the question object
      const newQuestion = {
        text: values.question,
        type: values.type,
        time: values.duration,
        points: values.points,
        answers: answers.map(answer => ({
          text: answer.answer,
          isCorrect: answer.correct
        }))
      };
      
      // Add media (if provided)
      if (mediaType === 'url' && mediaUrl) {
        newQuestion.media = mediaUrl;
      }
      
      onAdd(newQuestion);
    }).catch(err => {
      console.log("🚀 ~ handleSubmit ~ err:", err);
      message.error('Please check if the form is filled correctly.');
    });
  };

  const handleTypeChange = (value) => {
    setQuestionType(value);
    
    // Reset answer options
    if (value === 'truefalse') {
      setAnswers([
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ]);
    } else if (value === 'single' && answers.filter(a => a.correct).length > 1) {
      // If switching from multiple to single, keep only the first correct answer
      const updatedAnswers = [...answers];
      let foundCorrect = false;
      updatedAnswers.forEach((answer, index) => {
        if (answer.correct) {
          if (!foundCorrect) {
            foundCorrect = true;
          } else {
            updatedAnswers[index].correct = false;
          }
        }
      });
      setAnswers(updatedAnswers);
    }
  };

  const handleAnswerChange = (index, field, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index][field] = value;
    
    // Ensure only one correct answer for single choice
    if (field === 'correct' && value === true && questionType === 'single') {
      updatedAnswers.forEach((answer, i) => {
        if (i !== index) {
          updatedAnswers[i].correct = false;
        }
      });
    }
    
    setAnswers(updatedAnswers);
  };

  const addAnswer = () => {
    if (answers.length < 6) {
      setAnswers([...answers, { answer: '', correct: false }]);
    }
  };

  const removeAnswer = (index) => {
    if (answers.length > 2) {
      const newAnswers = [...answers];
      newAnswers.splice(index, 1);
      setAnswers(newAnswers);
    }
  };

  return (
    <Modal
      title="Add New Question"
      open={true}
      width={700}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>Add</Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'single',
          duration: 30,
          points: 100,
          mediaType: 'none'
        }}
      >
        <Form.Item
          name="type"
          label="Question Type"
          rules={[{ required: true, message: 'Please select question type' }]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="single">Single Choice</Option>
            <Option value="multiple">Multiple Choice</Option>
            <Option value="truefalse">True/False</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="question"
          label="Question Text"
          rules={[{ required: true, message: 'Please enter question text' }]}
        >
          <TextArea rows={3} placeholder="Enter the question..." />
        </Form.Item>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <Form.Item
            name="duration"
            label="Time Limit (seconds)"
            rules={[{ required: true, message: 'Please set time limit' }]}
            style={{ width: '50%' }}
          >
            <InputNumber min={5} max={300} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="points"
            label="Points"
            rules={[{ required: true, message: 'Please set the score' }]}
            style={{ width: '50%' }}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        
        <Form.Item name="mediaType" label="Media">
          <Radio.Group onChange={(e) => setMediaType(e.target.value)} value={mediaType}>
            <Radio value="none">None</Radio>
            <Radio value="url">Media URL</Radio>
          </Radio.Group>
        </Form.Item>
        
        {mediaType === 'url' && (
          <Form.Item
            name="mediaUrl"
            label="Media URL"
          >
            <Input 
              placeholder="Enter media URL..." 
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </Form.Item>
        )}
        
        <Divider>Answer Options</Divider>
        
        {questionType === 'truefalse' ? (
          <div>
            {answers.map((answer, index) => (
              <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <Text style={{ width: '100px' }}>{answer.answer}</Text>
                <Switch
                  checkedChildren={<CheckOutlined />}
                  unCheckedChildren={<CloseOutlined />}
                  checked={answer.correct}
                  onChange={(checked) => handleAnswerChange(index, 'correct', checked)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {answers.map((answer, index) => (
              <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, 'answer', e.target.value)}
                  style={{ flex: 1 }}
                />
                <Switch
                  checkedChildren={<CheckOutlined />}
                  unCheckedChildren={<CloseOutlined />}
                  checked={answer.correct}
                  onChange={(checked) => handleAnswerChange(index, 'correct', checked)}
                />
                {answers.length > 2 && (
                  <Button
                    type="text"
                    icon={<MinusCircleOutlined />}
                    onClick={() => removeAnswer(index)}
                    danger
                  />
                )}
              </div>
            ))}
            
            {answers.length < 6 && (
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={addAnswer}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  Add Option
                </Button>
              </Form.Item>
            )}
          </div>
        )}
      </Form>
    </Modal>
  );
}

export default AddQuestionModal;
