// src/components/Games/NeverHaveIEver/NeverHaveIEver.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GameLobby from './GameLobby';
import MultiplayerGame from './MultiplayerGame';
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
  const [gameMode, setGameMode] = useState('select'); // 'select', 'lobby', 'multiplayer', 'solo'
  const [gameData, setGameData] = useState(null);
  
  // Solo game state
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

  // Filter and shuffle questions when language, filter, or custom questions change (solo mode)
  useEffect(() => {
    if (gameMode === 'solo') {
      const allQs = [...questionsData, ...ownQuestions];
      const filtered = filter.includes('All')
        ? allQs
        : allQs.filter(q => filter.includes(q.category));
      const shuffled = shuffleArray(filtered);
      setQuestions(shuffled);
      setCurrentIndex(0);
    }
  }, [filter, ownQuestions, questionsData, gameMode]);

  const handleGameModeSelect = (mode) => {
    setGameMode(mode);
  };

  const handleStartMultiplayerGame = (data) => {
    setGameData(data);
    setGameMode('multiplayer');
  };

  const handleBackToSelect = () => {
    setGameMode('select');
    setGameData(null);
  };

  const handleBackToMain = () => {
    setGameMode('select');
    setGameData(null);
    onBack();
  };

  // Solo game functions
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
      setAnimationTrigger(prev => prev + 1);
      setCurrentIndex((prev) => (prev + 1) % questions.length);
    }
  };

  // Game mode selection screen
  if (gameMode === 'select') {
    return (
      <div className="never-have-i-ever-game">
        <button 
          className="never-have-i-ever-back-icon"
          onClick={handleBackToMain}
          tabIndex={0}
        >
          🔙
        </button>
        
        <h1 className="never-have-i-ever-game-title">{t('neverHaveIEver')}</h1>
        
        <div className="game-mode-selection">
          <button 
            className="game-mode-button multiplayer"
            onClick={() => handleGameModeSelect('lobby')}
          >
            <div className="mode-icon">👥</div>
            <div className="mode-title">{t('multiplayerMode')}</div>
            <div className="mode-description">{t('playWithFriends')}</div>
          </button>
          
          <button 
            className="game-mode-button solo"
            onClick={() => handleGameModeSelect('solo')}
          >
            <div className="mode-icon">🎲</div>
            <div className="mode-title">{t('soloMode')}</div>
            <div className="mode-description">{t('playAlone')}</div>
          </button>
        </div>
      </div>
    );
  }

  // Multiplayer lobby
  if (gameMode === 'lobby') {
    return (
      <GameLobby 
        onStartGame={handleStartMultiplayerGame}
        onBack={handleBackToSelect}
      />
    );
  }

  // Multiplayer game
  if (gameMode === 'multiplayer') {
    return (
      <MultiplayerGame 
        gameData={gameData}
        onBack={handleBackToSelect}
      />
    );
  }

  // Solo game mode (original functionality)
  const cardsRemaining = questions.length > 0 ? questions.length - currentIndex - 1 : 0;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="never-have-i-ever-game">
      <button 
        className="never-have-i-ever-back-icon"
        onClick={handleBackToSelect}
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