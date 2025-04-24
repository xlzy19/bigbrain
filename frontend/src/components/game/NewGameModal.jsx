import React, { useState} from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Button,
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

    if (!isValid) {
      setFormValid(false);
      return;
    }

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

  return (
    <Modal
      title="Create New Game"
      open={true}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={onValuesChange}
        initialValues={{
          questions: [
            {
              answers: ["", ""],
            },
          ],
        }}
      >
        <Form.Item
          name="name"
          label="Game Name"
          rules={[{ required: true, message: "Please enter the game name" }]}
        >
          <Input placeholder="Enter game name" />
        </Form.Item>

        <Form.List name="questions">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{
                    border: "1px dashed #d9d9d9",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Form.Item
                      {...field}
                      label="Question Type"
                      name={[field.name, "type"]}
                      rules={[{ required: true, message: "Please select question type" }]}
                    >
                      <Select
                        onChange={(value) =>
                          handleQuestionTypeChange(value, field.name)
                        }
                      >
                        <Option value="SINGLE">Single Choice</Option>
                        <Option value="MULTIPLE">Multiple Choice</Option>
                        <Option value="JUDGMENT">True/False</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...field}
                      label="Question Content"
                      name={[field.name, "content"]}
                      rules={[{ required: true, message: "Please enter question content" }]}
                    >
                      <Input.TextArea />
                    </Form.Item>

                    <Space>
                      <Form.Item
                        {...field}
                        label="Time Limit (seconds)"
                        name={[field.name, "timeLimit"]}
                        rules={[{ required: true, message: "Please set time limit" }]}
                      >
                        <InputNumber min={1} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="Points"
                        name={[field.name, "points"]}
                        rules={[{ required: true, message: "Please set points" }]}
                      >
                        <InputNumber min={1} />
                      </Form.Item>
                    </Space>

                    <Form.Item
                      {...field}
                      label="Media URL (optional)"
                      name={[field.name, "mediaUrl"]}
                      extra="Supports image URLs or YouTube video links"
                    >
                      <Input placeholder="Enter YouTube or image URL" />
                    </Form.Item>

                    <Form.List name={[field.name, "answers"]}>
                      {(
                        answerFields,
                        { add: addAnswer, remove: removeAnswer }
                      ) => (
                        <>
                          {answerFields.map((answerField, answerIndex) => (
                            <Space
                              key={`answer-${field.name}-${answerField.key}`}
                              align="baseline"
                            >
                              <Form.Item
                                {...answerField}
                                validateTrigger={["onChange", "onBlur"]}
                                rules={[
                                  { required: true, message: "Please enter an answer" }
                                ]}
                              >
                                <Input
                                  placeholder={`Answer ${answerIndex + 1}`}
                                />
                              </Form.Item>
                              {answerFields.length > 2 && (
                                <MinusCircleOutlined
                                  onClick={() => removeAnswer(answerField.name)}
                                />
                              )}
                            </Space>
                          ))}
                          {answerFields.length < 6 &&
                            form.getFieldValue([
                              "questions",
                              field.name,
                              "type",
                            ]) !== "JUDGMENT" && (
                            <Button
                              type="dashed"
                              onClick={() => addAnswer()}
                              icon={<PlusOutlined />}
                            >
                                Add Answer Option
                            </Button>
                          )}
                        </>
                      )}
                    </Form.List>

                    <Form.Item
                      shouldUpdate={(prevValues, currentValues) => {
                        return (
                          prevValues.questions?.[field.name]?.answers !==
                            currentValues.questions?.[field.name]?.answers ||
                          prevValues.questions?.[field.name]?.type !==
                            currentValues.questions?.[field.name]?.type
                        );
                      }}
                    >
                      {() => {
                        const questionType = form.getFieldValue([
                          "questions",
                          field.name,
                          "type",
                        ]);
                        const answers =
                          form.getFieldValue([
                            "questions",
                            field.name,
                            "answers",
                          ]) || [];

                        if (!answers || answers.length === 0) {
                          return null;
                        }

                        return (
                          <Form.Item
                            {...field}
                            label="Correct Answer(s)"
                            name={[field.name, "correctAnswers"]}
                            rules={[
                              { required: true, message: "Please select correct answer(s)" },
                            ]}
                          >
                            <Select
                              mode={
                                questionType === "MULTIPLE"
                                  ? "multiple"
                                  : undefined
                              }
                              placeholder="Select correct answer(s)"
                              style={{ width: "100%" }}
                            >
                              {answers.map((answer, ansIndex) => (
                                <Option
                                  key={`option-${field.name}-${ansIndex}`}
                                  value={ansIndex}
                                >
                                  {answer || `Option ${ansIndex + 1}`}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        );
                      }}
                    </Form.Item>

                    {fields.length > 1 && (
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(field.name)}
                      >
                        Remove this question
                      </Button>
                    )}
                  </Space>
                </div>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add New Question
              </Button>
            </>
          )}
        </Form.List>

        <Form.Item style={{ marginTop: "24px" }}>
          <Space>
            <Button type="primary" htmlType="submit">
              Create Game
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Space>
        </Form.Item>

        {!formValid && (
          <div style={{ color: "red", marginTop: "10px" }}>
            Please make sure all questions have selected correct answers.
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default NewGameModal;
