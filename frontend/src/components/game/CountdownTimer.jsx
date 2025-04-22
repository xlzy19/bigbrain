// src/components/game/CountdownTimer.jsx
import { useState, useEffect } from 'react';

function CountdownTimer({ initialTime, onTimerEnd }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    if (initialTime !== timeLeft) {
      setTimeLeft(initialTime);
    }
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimerEnd();
      return;
    }
    
    const timerId = setInterval(() => {
      setTimeLeft(time => {
        const newTime = time - 1;
        if (newTime <= 0) {
          clearInterval(timerId);
          onTimerEnd();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, onTimerEnd]);

  // Format time as mins:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate the value for the circular progress bar
  const calculateProgress = () => {
    return (timeLeft / initialTime) * 100;
  };

  return (
    <div className="countdown-timer">
      <div 
        className="timer-circle"
        style={{
          background: `conic-gradient(
            #4CAF50 ${calculateProgress() * 3.6}deg,
            #f3f3f3 ${calculateProgress() * 3.6}deg
          )`
        }}
      >
        <div className="timer-text">{formatTime(timeLeft)}</div>
      </div>
    </div>
  );
}

export default CountdownTimer;