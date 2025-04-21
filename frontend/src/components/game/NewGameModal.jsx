import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Button,
  Upload,
  Radio,
  message,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

const NewGameModal = ({ onClose, onCreate }) => {
  const [form] = Form.useForm();
  const [answersMap, setAnswersMap] = useState({});
  const [formValid, setFormValid] = useState(true);

  // Listen for form field changes to update the answer map and debug state
  const onValuesChange = (changedValues, allValues) => {
    console.log("Form values changed:", changedValues, allValues);

    // Auto-set default answers when question type changes
    if (changedValues.questions) {
      const questions = allValues.questions || [];
      const newAnswersMap = { ...answersMap };

      questions.forEach((question, questionIndex) => {
        if (!question) return;

        const questionType = question.type;
        if (questionType && changedValues.questions[questionIndex]?.type) {
          // For true/false questions, set "Yes" and "No" as options
          if (questionType === "JUDGMENT") {
            const judgmentAnswers = ["Yes", "No"];
            form.setFieldValue(
              ["questions", questionIndex, "answers"],
              judgmentAnswers
            );
            form.setFieldValue(
              ["questions", questionIndex, "correctAnswers"],
              undefined
            );
          }
        }

        if (question.answers) {
          newAnswersMap[questionIndex] = question.answers;
        }
      });

      setAnswersMap(newAnswersMap);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    console.log("Submitted values:", values);

    const questions = values.questions || [];
    let isValid = true;

    questions.forEach((question, index) => {
      console.log(`Correct answers for question ${index + 1}:`, question.correctAnswers);
      if (!question.correctAnswers) {
        isValid = false;
      }
    });

    // if (!isValid) {
    //   setFormValid(false);
    //   return;
    // }

    setFormValid(true);

    const formattedQuestions = values.questions.map((question, index) => {
      let mediaInfo = null;
      if (question.mediaUrl) {
        const mediaType =
          question.mediaUrl.includes("youtube.com") ||
          question.mediaUrl.includes("youtu.be")
            ? "youtube"
            : "image";
        mediaInfo = {
          type: mediaType,
          url: question.mediaUrl,
        };
      }

      const correctAnswers = Array.isArray(question.correctAnswers)
        ? question.correctAnswers
        : [question.correctAnswers];

      let formattedAnswers = [];

      if (question.type === "JUDGMENT") {
        formattedAnswers = question.answers.map((answer, index) => ({
          answer: answer,
          correct: correctAnswers.includes(index),
        }));
      } else if (question.type === "MULTIPLE") {
        formattedAnswers = question.answers.map((answer, index) => ({
          answer: answer,
          correct: correctAnswers.includes(index),
        }));
      } else {
        formattedAnswers = question.answers.map((answer, index) => ({
          answer: answer,
          correct: correctAnswers.includes(index),
        }));
      }

      let questionType = "single";
      if (question.type === "MULTIPLE") {
        questionType = "multiple";
      } else if (question.type === "JUDGMENT") {
        questionType = "truefalse";
      }

      return {
        id: `question-${Date.now()}-${index}`,
        question: question.content,
        duration: question.timeLimit,
        correctAnswers: correctAnswers,
        points: question.points,
        type: questionType,
        media: mediaInfo,
        answers: formattedAnswers,
        answerAvailable: true
      };
    });

    const email = localStorage.getItem('email');
    const gameData = {
      id: `game-${Date.now()}`,
      name: values.name,
      owner: email,
      answerAvailable: true,
      questions: formattedQuestions,
    };

    console.log("🚀 ~ handleSubmit ~ gameData:", gameData);
    onCreate(gameData);
  };

  // Handle question type changes
  const handleQuestionTypeChange = (value, questionIndex) => {
    console.log("Question type changed:", value, questionIndex);

    if (value === "JUDGMENT") {
      form.setFieldValue(["questions", questionIndex, "answers"], ["Yes", "No"]);
      form.setFieldValue(
        ["questions", questionIndex, "correctAnswers"],
        undefined
      );
    }
  };
