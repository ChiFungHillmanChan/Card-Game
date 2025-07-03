import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './NeverHaveIEver.css';

function QuestionCard({ question, cardsRemaining, animationTrigger }) {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState('flipping');
  const [displayQuestion, setDisplayQuestion] = useState(question);

  useEffect(() => {
    if (animationTrigger > 0) {
      setIsAnimating(true);
      
      // Choose animation type randomly for variety
      const animations = ['flipping', 'bouncing', 'sliding'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setAnimationType(randomAnimation);
      
      // For flip animation, change content at the middle of animation
      if (randomAnimation === 'flipping') {
        setTimeout(() => {
          setDisplayQuestion(question);
        }, 300); // Half way through the flip
      } else {
        setDisplayQuestion(question);
      }
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Match the longest animation duration
      
      return () => clearTimeout(timer);
    } else {
      setDisplayQuestion(question);
    }
  }, [animationTrigger, question]);

  return (
    <div className={`never-have-i-ever-question-card ${isAnimating ? animationType : ''}`}>
      {displayQuestion ? (
        <>
          <div className="never-have-i-ever-question-text">
            "{displayQuestion.text}"
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