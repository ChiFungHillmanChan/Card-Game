import React from 'react';
import './NeverHaveIEver.css';

function QuestionCard({ question, cardsRemaining }) {
  return (
    <div className="never-have-i-ever-question-card">
      {question ? (
        <>
          <div className="never-have-i-ever-question-text">
            "{question.text}"
          </div>
          <div className="never-have-i-ever-cards-remaining">
            Cards remaining: {cardsRemaining}
          </div>
        </>
      ) : (
        <div className="never-have-i-ever-question-text">
          No questions available for this category
        </div>
      )}
    </div>
  );
}

export default QuestionCard;