import React from 'react';
import { useTranslation } from 'react-i18next';
import './neverHaveIEver.css';

function QuestionCard({ question, cardsRemaining }) {
  const { t } = useTranslation();

  return (
    <div className="never-have-i-ever-question-card">
      {question ? (
        <>
          <div className="never-have-i-ever-question-text">
            "{question.text}"
          </div>
          <div className="never-have-i-ever-cards-remaining">
            {t('cardsRemaining', { count: cardsRemaining })}
          </div>
        </>
      ) : (
        <div className="never-have-i-ever-question-text">
          {t('noQuestionsAvailable')}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;