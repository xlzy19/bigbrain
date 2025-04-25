# Testing Documentation

## Component Testing

We have used Vitest and React Testing Library to test key components of our frontend application. The main components tested include:

1. **GameCard Component** (`GameCard.test.jsx`): Tests rendering and interaction behaviors of the game card in different states.
2. **PlayGame Component** (`PlayGame.test.jsx`): Tests core game functionality during gameplay, including question display, answer selection, and timers.
3. **Dashboard Component** (`Dashboard.test.jsx`): Tests game management functionality in the dashboard, including starting and stopping games.

These tests cover the core functionality of the application, ensuring components work properly under various conditions.

## UI Testing - Admin Happy Path

### Test Objective

Test the complete workflow of an admin user from registration to creating, managing, and deleting games, ensuring all key functionalities work as expected.

### Test Steps

1. **Register Successfully**
   - Visit the application's registration page
   - Enter a valid email address and password
   - Click the "Register" button
   - Verify the user is successfully registered and redirected to the dashboard

2. **Create a New Presentation Successfully**
   - Click the "Create New Game" button on the dashboard page
   - Fill in the game name in the popup modal
   - Add at least one question, including content, type, time limit, and answers
   - Click the "Create Game" button
   - Verify the new game appears in the game list on the dashboard

3. **Update the Thumbnail and Name of the Presentation Successfully**
   - Click the "Edit" button for the game you want to edit on the dashboard
   - Click the "Edit Game Information" button on the game edit page
   - Modify the game name and upload a new thumbnail
   - Click the "Save" button
   - Verify the game information is successfully updated

4. **Add Some Slides in a Slideshow Deck Successfully**
   - On the game edit page, click the "Add Question" button
   - Fill in the question details, including question text, type, time limit, points, and answer options
   - Mark the correct answer(s)
   - Click the "Add" button
   - Verify the new question appears in the question list

5. **Switch Between Slides Successfully**
   - On the game edit page, view the question list
   - Click the view button for different questions
   - Verify the question detail view updates to show the selected question
   - Edit details of different questions
   - Verify changes to each question are correctly saved

6. **Delete a Presentation Successfully**
   - Find the game you want to delete on the dashboard page
   - Click the "Delete Game" button
   - Click "Confirm Delete" in the confirmation dialog
   - Verify the game is removed from the game list

7. **Log Out of the Application Successfully**
   - Click the "Logout" button in the top navigation bar
   - Verify the user is redirected to the login page
   - Verify protected routes (such as the dashboard) cannot be accessed

8. **Log Back into the Application Successfully**
   - Visit the login page
   - Enter the previously registered email and password
   - Click the "Login" button
   - Verify the user is successfully redirected to the dashboard
   - Verify previously created games (except deleted ones) are still visible

### Test Implementation

This test can be implemented using end-to-end testing tools such as Cypress or Playwright to simulate real user interactions in the browser. The test script will execute the actions according to the steps above and verify the results.

Example Cypress test framework:

```javascript
describe('Admin Happy Path', () => {
  it('should complete the full admin workflow successfully', () => {
    // 1. Register successfully
    cy.visit('/register');
    cy.get('[data-testid=email-input]').type('admin@example.com');
    cy.get('[data-testid=password-input]').type('securepassword');
    cy.get('[data-testid=register-button]').click();
    cy.url().should('include', '/dashboard');
    
    // 2. Create a new presentation
    cy.get('[data-testid=create-game-button]').click();
    cy.get('[data-testid=game-name-input]').type('Test Game');
    // Add questions and answers...
    cy.get('[data-testid=create-game-submit]').click();
    cy.contains('Test Game').should('be.visible');
    
    // Continue with other test steps...
  });
});
```

## Another Test Path - Game Host Session Management

### Test Objective

Test the workflow of a game host creating a game, starting a session, and controlling the game in real-time, focusing on session management and real-time interaction features. This path differs from the admin happy path as it focuses on game execution and control processes, rather than just game creation and management.

### Test Steps

1. **Login Successfully**
   - Login to the application using an existing account
   - Verify successful login and redirection to the dashboard

2. **Start a Game Session**
   - Select an existing game from the dashboard
   - Click the "Start" button to initiate a game session
   - Verify the session starts and displays a session code and control interface

3. **Invite Players to Join**
   - Copy the session code and share it with test players
   - In another browser, join the game as a player by entering the session code
   - Verify the player successfully joins and appears in the host interface

4. **Control Game Progress**
   - Click the "Start Question" button in the host interface
   - Verify the first question is displayed to all players
   - Wait for the timer to end or manually advance to reveal the answer
   - Verify the correct answer is shown to players and scores are recorded

5. **View Real-time Results**
   - Check the scoreboard between questions
   - Verify player scores are correctly updated
   - Verify rankings change according to scores

6. **Switch to the Next Question**
   - Click the "Next Question" button
   - Verify the new question is displayed to all players
   - Repeat the steps for controlling game progress and viewing results

7. **End the Game Session**
   - After the last question, click the "End Game" button
   - Verify the game ends and displays final results
   - Verify all players are redirected to the results page

8. **View and Export Game Results**
   - Review detailed game result statistics
   - Test the export results functionality
   - Verify the exported data format is correct

### Rationale for This Test Path

This test path focuses on the real-time execution and control of game sessions, which is distinctly different from the admin happy path:

1. **Real-time Interaction Testing**: Tests interaction features during live gameplay, including question presentation, timing, and answer submission
2. **Multi-user Scenarios**: Tests interaction between host and players, verifying application behavior in multi-user environments
3. **Data Synchronization**: Verifies real-time synchronization of game state across all participants
4. **Score Calculation**: Tests the accuracy of the scoring and ranking system
5. **Session Management**: Tests the lifecycle management of game sessions from start to finish

This path covers key functionalities related to game execution, while the admin happy path focuses on game content creation and management. By testing both paths, we comprehensively validate the core functionality of the application.

### Test Implementation

This can also be implemented using end-to-end testing tools, but requires setting up multiple browser contexts to simulate host and player interactions.

Example Playwright test framework:

```javascript
test('Game Host Session Management', async ({ browser }) => {
  // Create two browser contexts - one for the host and one for the player
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  
  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();
  
  // Host login
  await hostPage.goto('/login');
  await hostPage.fill('[data-testid=email]', 'host@example.com');
  await hostPage.fill('[data-testid=password]', 'password');
  await hostPage.click('[data-testid=login-button]');
  
  // Start game session
  await hostPage.click('[data-testid=start-game]');
  
  // Get session code
  const sessionCode = await hostPage.textContent('[data-testid=session-code]');
  
  // Player joins game
  await playerPage.goto('/join');
  await playerPage.fill('[data-testid=session-code-input]', sessionCode);
  await playerPage.click('[data-testid=join-button]');
  
  // Host starts question
  await hostPage.click('[data-testid=start-question]');
  
  // Verify player sees question
  await playerPage.waitForSelector('[data-testid=question-text]');
  
  // Continue testing game flow...
});
```