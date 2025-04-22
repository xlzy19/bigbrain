function QuestionView({ 
    question, 
    selectedAnswers, 
    onAnswerSelect, 
    showAnswer,
    correctAnswers
  }) {
    return (
      <div className="question-view">
        <h2 className="question-text">{question.text}</h2>
        
        {/* Display media */}
        {question.image && (
          <div className="question-media">
            <img src={question.image} alt="Question image" />
          </div>
        )}
        
        {question.video && (
          <div className="question-media">
            <iframe
              width="560"
              height="315"
              src={question.video}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
        
        <div className="question-type">
          {question.type === 'single' && <p>Single Choice (Select one correct answer)</p>}
          {question.type === 'multiple' && <p>Multiple Choice (Select all correct answers)</p>}
          {question.type === 'judgement' && <p>True/False (Select correct or incorrect)</p>}
        </div>
        
        <div className="answer-options">
          {question.answers.map((answer) => {
            const isSelected = selectedAnswers.includes(answer.id);
            const isCorrect = showAnswer && correctAnswers.includes(answer.id);
            
            let className = 'answer-option';
            if (showAnswer) {
              if (isCorrect) {
                className += ' correct';
              } else if (isSelected && !isCorrect) {
                className += ' incorrect';
              }
            } else if (isSelected) {
              className += ' selected';
            }
            
            return (
              <div 
                key={answer.id}
                className={className}
                onClick={() => onAnswerSelect(answer.id)}
              >
                <span className="answer-text">{answer.text}</span>
                {showAnswer && isCorrect && <span className="answer-mark">✓</span>}
                {showAnswer && isSelected && !isCorrect && <span className="answer-mark">✗</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  export default QuestionView;
  