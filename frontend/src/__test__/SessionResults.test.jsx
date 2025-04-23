import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SessionResultsView from '../components/session/SessionResultsView';

describe('SessionResultsView Component', () => {
  // Sample test data
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is the capital of France?',
      type: 'single',
      points: 100,
      answers: [
        { id: 'a1', answer: 'Paris', correct: true },
        { id: 'a2', answer: 'London', correct: false },
        { id: 'a3', answer: 'Berlin', correct: false }
      ]
    },
    {
      id: 'q2',
      question: 'Which of these are primary colors?',
      type: 'multiple',
      points: 200,
      answers: [
        { id: 'a4', answer: 'Red', correct: true },
        { id: 'a5', answer: 'Blue', correct: true },
        { id: 'a6', answer: 'Green', correct: false },
        { id: 'a7', answer: 'Yellow', correct: true }
      ]
    }
  ];

  const mockResults = {
    players: [
      {
        name: 'Player1',
        answers: {
          q1: ['a1'], // Correct
          q2: ['a4', 'a5', 'a7'] // Correct
        },
        score: 300
      },
      {
        name: 'Player2',
        answers: {
          q1: ['a2'], // Incorrect
          q2: ['a4', 'a5'] // Partially correct
        },
        score: 100
      },
      {
        name: 'Player3',
        answers: {
          q1: ['a1'], // Correct
          q2: ['a4', 'a5', 'a6'] // Incorrect
        },
        score: 100
      }
    ],
    averageScore: 166.67,
    totalQuestions: 2
  };

  // Helper function to render component with required props
  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <SessionResultsView
          results={mockResults}
          questions={mockQuestions}
          {...props}
        />
      </BrowserRouter>
    );
  };
})