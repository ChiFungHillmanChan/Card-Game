import React, { useState, useEffect } from 'react';
import questionsData from './data/questions.json';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [musicOn, setMusicOn] = useState(true);
  const [filter, setFilter] = useState(['All']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ownQuestions, setOwnQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([]);

  const categories = [
    'General',
    'Dating',
    'Funny',
    'Weird',
    'Safe (ish)',
    'Sexy',
    'Juicy',
    'Easy',
    'Thought-provoking',
    'Kid'
  ];

  useEffect(() => {
    const allQs = [...questionsData, ...ownQuestions];
    const filtered = filter.includes('All')
      ? allQs
      : allQs.filter(q => filter.includes(q.category));
    const shuffled = shuffleArray(filtered);
    setQuestions(shuffled);
    setCurrentIndex(0);
  }, [filter, ownQuestions]);

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
      setCurrentIndex((prev) => (prev + 1) % questions.length);
    }
  };

  const cardsRemaining = questions.length > 0 ? questions.length - currentIndex - 1 : 0;
  const currentQuestion = questions[currentIndex];

  if (currentPage === 'home') {
    return (
      <div className="app home-screen">
        <button 
          className="settings-icon disabled"
          onClick={() => setMusicOn(!musicOn)}
          tabIndex={0}
        >
          🎵
        </button>
        
        <h1 className="title">Select Game</h1>
        
        <div className="games-grid">
          <div 
            className="game-card"
            onClick={() => setCurrentPage('neverHaveIEver')}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCurrentPage('neverHaveIEver');
              }
            }}
          >
            <h3>Never Have I Ever</h3>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'neverHaveIEver') {
    return (
      <div className="app game-screen">
        <button 
          className="back-icon"
          onClick={() => setCurrentPage('home')}
          tabIndex={0}
        >
          🔙
        </button>
        
        <h1 className="game-title">Never Have I Ever</h1>
        
        <div className="category-bar">
          {categories.map(cat => {
            const active = filter.includes(cat);
            return (
              <button
                key={cat}
                className={`category-button ${active ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
        
        <div className="card-display">
          <div className="question-card">
            {currentQuestion ? (
              <>
                <div className="question-text">
                  "{currentQuestion.text}"
                </div>
                <div className="cards-remaining">
                  Cards remaining: {cardsRemaining}
                </div>
              </>
            ) : (
              <div className="question-text">
                No questions available for this category
              </div>
            )}
          </div>
          
          {questions.length > 0 && (
            <button 
              className="next-button"
              onClick={handleNextCard}
            >
              Next Card
            </button>
          )}
        </div>
        
        <div className="custom-question-section">
          <input
            type="text"
            className="custom-input"
            placeholder="Add your own question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddQuestion();
              }
            }}
          />
          <button 
            className="add-button"
            onClick={handleAddQuestion}
          >
            Add Question
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
