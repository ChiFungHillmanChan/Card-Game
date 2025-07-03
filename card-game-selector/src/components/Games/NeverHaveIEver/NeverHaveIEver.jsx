// src/components/Games/NeverHaveIEver/NeverHaveIEver.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionCard from './QuestionCard';
import questionsDataEn from './data/questions_en.json';
import questionsDataZhHant from './data/questions_zh-Hant.json';
import './NeverHaveIEver.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function NeverHaveIEver({ onBack }) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState(['All']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ownQuestions, setOwnQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionsData, setQuestionsData] = useState([]);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const categories = [
    'All',
    'General',
    'Dating',
    'Funny',
    'Weird',
    'Safe (ish)',
    'Sexy',
    'Juicy',
    'Easy',
    'Thought-provoking',
    'Kids'
  ];

  // Load questions based on current language
  useEffect(() => {
    const loadQuestionsForLanguage = () => {
      switch (i18n.language) {
        case 'zh-Hant':
          setQuestionsData(questionsDataZhHant);
          break;
        case 'en':
        default:
          setQuestionsData(questionsDataEn);
          break;
      }
    };

    loadQuestionsForLanguage();
  }, [i18n.language]);

  // Filter and shuffle questions when language, filter, or custom questions change
  useEffect(() => {
    const allQs = [...questionsData, ...ownQuestions];
    const filtered = filter.includes('All')
      ? allQs
      : allQs.filter(q => filter.includes(q.category));
    const shuffled = shuffleArray(filtered);
    setQuestions(shuffled);
    setCurrentIndex(0);
  }, [filter, ownQuestions, questionsData]);

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const newQ = { category: 'Custom', text: newQuestion.trim() };
      setOwnQuestions(prev => [...prev, newQ]);
      setNewQuestion('');
    }
  };

  const handleCategoryClick = (cat) => {
    if (cat === 'All') {
      setFilter(['All']);
    } else {
      let next;
      if (filter.includes('All')) {
        next = [cat];
      } 
      else if (filter.includes(cat)) {
        next = filter.filter(f => f !== cat);
      } 
      else {
        next = [...filter, cat];
      }
      if (next.length === 0) next = ['All'];
      setFilter(next);
    }
  };

  const handleNextCard = () => {
    if (questions.length > 0) {
      // Trigger animation first
      setAnimationTrigger(prev => prev + 1);
      
      // Change card index immediately so the new question is ready
      setCurrentIndex((prev) => (prev + 1) % questions.length);
    }
  };

  const cardsRemaining = questions.length > 0 ? questions.length - currentIndex - 1 : 0;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="never-have-i-ever-game">
      <button 
        className="never-have-i-ever-back-icon"
        onClick={onBack}
        tabIndex={0}
      >
        🔙
      </button>
      
      <h1 className="never-have-i-ever-game-title">{t('neverHaveIEver')}</h1>
      
      <div className="never-have-i-ever-category-bar">
        {categories.map(cat => {
          const active = filter.includes(cat) || (filter.includes('All') && cat === 'All');
          return (
            <button
              key={cat}
              className={`never-have-i-ever-category-button ${active ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {t(`categories.${cat}`)}
            </button>
          );
        })}
      </div>
      
      <div className="never-have-i-ever-card-display">
        <QuestionCard 
          question={currentQuestion}
          cardsRemaining={cardsRemaining}
          animationTrigger={animationTrigger}
        />
        
        {questions.length > 0 && (
          <button 
            className="never-have-i-ever-next-button"
            onClick={handleNextCard}
          >
            {t('nextCard')}
          </button>
        )}
      </div>
      
      <div className="never-have-i-ever-custom-question-section">
        <input
          type="text"
          className="never-have-i-ever-custom-input"
          placeholder={t('addYourOwnQuestion')}
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddQuestion();
            }
          }}
        />
        <button 
          className="never-have-i-ever-add-button"
          onClick={handleAddQuestion}
        >
          {t('addQuestion')}
        </button>
      </div>
    </div>
  );
}

export default NeverHaveIEver;