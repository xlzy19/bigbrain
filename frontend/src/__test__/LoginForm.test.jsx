import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockImplementation((email, password) => {
      // Simulate login success/failure based on credentials
      if (email === 'valid@example.com' && password === 'password123') {
        return Promise.resolve({ success: true });
      } else {
        return Promise.reject(new Error('Invalid credentials'));
      }
    }),
    isAuthenticated: false
  })
}));

// Import the mocked auth hook for test manipulation
import { useAuth } from '../contexts/AuthContext';

describe('LoginForm Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // Helper function to render component with router
  const renderWithRouter = (ui) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };
  
  // Test 1: Basic Rendering
  it('should render login form with email and password fields', () => {
    renderWithRouter(<LoginForm />);
    
    // Check if form elements are present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    
    // Check if the register link is present
    expect(screen.getByText(/register now/i)).toBeInTheDocument();
  });
  
  // Test 2: Form Validation
  it('should display validation errors for empty fields', async () => {
    renderWithRouter(<LoginForm />);
    
    // Submit the form without filling fields
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please input your email/i)).toBeInTheDocument();
      expect(screen.getByText(/please input your password/i)).toBeInTheDocument();
    });
    
    // Verify login was not called
    expect(useAuth().login).not.toHaveBeenCalled();
  });
  
  // Test 3: Email Format Validation
  it('should validate email format', async () => {
    renderWithRouter(<LoginForm />);
    
    // Enter invalid email format
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Enter valid password
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Check for email validation error
    await waitFor(() => {
      expect(screen.getByText(/the input is not valid email/i)).toBeInTheDocument();
    });
    
    // Verify login was not called
    expect(useAuth().login).not.toHaveBeenCalled();
  });
  
  // Test 4: Successful Login
  it('should submit form with valid credentials and redirect on success', async () => {
    // Setup mock for navigation testing
    const mockNavigate = vi.fn();
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm navigate={mockNavigate} />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    // Fill in valid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Verify login was called with correct credentials
    await waitFor(() => {
      expect(useAuth().login).toHaveBeenCalledWith('valid@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // Test 5: Login Failure
  it('should display error message on login failure', async () => {
    renderWithRouter(<LoginForm />);
    
    // Fill in invalid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Verify login was called with provided credentials
    expect(useAuth().login).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
  
  // Test 6: Loading State
  it('should display loading state during login process', async () => {
    // Override the login mock to delay response
    useAuth().login.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      });
    });
    
    renderWithRouter(<LoginForm />);
    
    // Fill in valid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Verify loading state
    expect(submitButton).toHaveAttribute('disabled');
    
    // Wait for login to complete
    await waitFor(() => {
      expect(useAuth().login).toHaveBeenCalled();
    });
  });
  
  // Test 7: Navigation to Register
  it('should navigate to register page when clicking register link', () => {
    // Setup mock for navigation testing
    const mockNavigate = vi.fn();
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm navigate={mockNavigate} />} />
          <Route path="/register" element={<div>Register Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    // Click the register link
    const registerLink = screen.getByText(/register now/i);
    fireEvent.click(registerLink);
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
}); 