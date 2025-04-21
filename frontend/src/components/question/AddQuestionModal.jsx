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
}

export default AddQuestionModal;
