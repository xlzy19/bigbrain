import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewGameModal from '../components/game/NewGameModal';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('NewGameModal Component', () => {
  // Mock props
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test@example.com');
  });
  
  // Test 1: Basic Rendering
  it('should render the modal with form fields', () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Check for title and form elements
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByLabelText('Game Name')).toBeInTheDocument();
    expect(screen.getByText('Add New Question')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Game')).toBeInTheDocument();
  });
  
  // Test 2: Form Validation
  it('should display validation errors when submitting empty form', async () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Attempt to submit the form without filling required fields
    const createButton = screen.getByText('Create Game');
    fireEvent.click(createButton);
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText('Please input game name')).toBeInTheDocument();
    });
    
    // Verify onCreate wasn't called
    expect(mockOnCreate).not.toHaveBeenCalled();
  });
  
  // Test 3: Question Type Changes
  it('should update answer options when question type changes to JUDGMENT', async () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Find the question type selector and change to JUDGMENT
    const typeSelector = screen.getByLabelText('Question Type');
    fireEvent.change(typeSelector, { target: { value: 'JUDGMENT' } });
    
    // Verify answers are set to "Yes" and "No"
    await waitFor(() => {
      const answerInputs = screen.getAllByPlaceholderText(/answer/i);
      expect(answerInputs.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  // Test 4: Add Question Button
  it('should add new question when "Add New Question" button is clicked', async () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Count initial question sections
    const initialQuestionSections = screen.getAllByText('Question Type').length;
    
    // Click add new question button
    const addButton = screen.getByText('Add New Question');
    fireEvent.click(addButton);
    
    // Verify new question section appears
    await waitFor(() => {
      const newQuestionSections = screen.getAllByText('Question Type').length;
      expect(newQuestionSections).toBe(initialQuestionSections + 1);
    });
  });
  
  // Test 5: Cancel Button
  it('should call onClose when Cancel button is clicked', () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  // Test 6: Form Submission
  it('should call onCreate with formatted data when form is submitted with valid data', async () => {
    render(
      <NewGameModal 
        onClose={mockOnClose} 
        onCreate={mockOnCreate} 
      />
    );
    
    // Fill in game name
    const nameInput = screen.getByLabelText('Game Name');
    fireEvent.change(nameInput, { target: { value: 'Test Quiz Game' } });
    
    // Fill in first question details
    const questionTypeSelect = screen.getByLabelText('Question Type');
    fireEvent.change(questionTypeSelect, { target: { value: 'SINGLE' } });
    
    const questionContent = screen.getByLabelText('Question Content');
    fireEvent.change(questionContent, { target: { value: 'What is the capital of France?' } });
    
    const timeLimit = screen.getByLabelText('Time Limit(sec)');
    fireEvent.change(timeLimit, { target: { value: '30' } });
    
    const points = screen.getByLabelText('Points');
    fireEvent.change(points, { target: { value: '100' } });
    
    // Add answer options
    const answerInputs = screen.getAllByPlaceholderText(/answer/i);
    fireEvent.change(answerInputs[0], { target: { value: 'Paris' } });
    fireEvent.change(answerInputs[1], { target: { value: 'London' } });
    
    // Select correct answer
    const correctAnswerSelect = screen.getByLabelText('Correct Answer');
    fireEvent.change(correctAnswerSelect, { target: { value: '0' } }); // First option (Paris)
    
    // Submit the form
    const createButton = screen.getByText('Create Game');
    fireEvent.click(createButton);
    
    // Verify onCreate was called with properly formatted data
    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledTimes(1);
      const calledData = mockOnCreate.mock.calls[0][0];
      
      expect(calledData.name).toBe('Test Quiz Game');
      expect(calledData.owner).toBe('test@example.com');
      expect(calledData.questions.length).toBe(1);
      expect(calledData.questions[0].type).toBe('single');
      expect(calledData.questions[0].duration).toBe(30);
      expect(calledData.questions[0].points).toBe(100);
    });
  });
}); 