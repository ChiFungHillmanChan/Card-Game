// src/components/Games/NeverHaveIEver/MultiplayerGame.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionCard from './QuestionCard';
import VotingInterface from './VotingInterface';
import ResultsDisplay from './ResultsDisplay';
import multiplayerSync from './MultiplayerSyncManager';
import questionsDataEn from './data/questions_en.json';
import questionsDataZhHant from './data/questions_zh-Hant.json';
import './MultiplayerGame.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function MultiplayerGame({ gameData, onBack }) {
  const { t, i18n } = useTranslation();
  const [gameState, setGameState] = useState(null);
  const [localGamePhase, setLocalGamePhase] = useState('loading'); // 'loading', 'question', 'voting', 'results'
  const [myVote, setMyVote] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [questionsData, setQuestionsData] = useState([]);
  const [error, setError] = useState('');

  const { gameCode, isCreator, playerId } = gameData;

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

  // Initialize game with questions (creator only)
  useEffect(() => {
    const initializeGame = async () => {
      if (isCreator && questionsData.length > 0) {
        try {
          // Shuffle and select questions for the game
          const shuffled = shuffleArray(questionsData);
          const gameQuestions = shuffled.slice(0, 20); // Limit to 20 questions
          
          await multiplayerSync.startGame(gameQuestions);
        } catch (error) {
          console.error('Failed to initialize game:', error);
          setError(t('failedToStartGame'));
        }
      }
    };

    if (questionsData.length > 0) {
      initializeGame();
    }
  }, [questionsData, isCreator, t]);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = multiplayerSync.subscribe((newGameState) => {
      console.log('Game state updated:', newGameState);
      setGameState(newGameState);
      
      // Reset vote when new question starts
      if (newGameState.votes && !newGameState.votes[playerId]) {
        setMyVote(null);
        setShowResults(false);
      }
      
      // Determine current game phase
      if (newGameState.status === 'playing') {
        const isVotingComplete = multiplayerSync.isVotingComplete();
        
        if (isVotingComplete && !showResults) {
          setShowResults(true);
          setLocalGamePhase('results');
        } else if (!isVotingComplete) {
          setLocalGamePhase('voting');
        }
      }
    });

    return unsubscribe;
  }, [playerId, showResults]);

  // Handle vote submission
  const handleVote = async (vote) => {
    if (myVote) return; // Already voted
    
    try {
      setMyVote(vote);
      await multiplayerSync.submitVote(vote);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      setMyVote(null);
      setError(t('failedToSubmitVote'));
    }
  };

  // Handle next question (creator only)
  const handleNextQuestion = async () => {
    if (!isCreator) return;
    
    try {
      setAnimationTrigger(prev => prev + 1);
      setShowResults(false);
      setLocalGamePhase('question');
      
      // Brief delay to show the new question before starting voting
      setTimeout(() => {
        setLocalGamePhase('voting');
      }, 2000);
      
      await multiplayerSync.nextQuestion();
    } catch (error) {
      console.error('Failed to advance to next question:', error);
      setError(t('failedToAdvanceQuestion'));
      
      // If game ended
      if (error.message.includes('finished')) {
        handleEndGame();
      }
    }
  };

  // Handle game end
  const handleEndGame = async () => {
    try {
      await multiplayerSync.leaveGame();
      onBack();
    } catch (error) {
      console.error('Failed to end game:', error);
      onBack(); // Still go back even if cleanup fails
    }
  };

  // Handle leaving game
  const handleLeaveGame = async () => {
    try {
      await multiplayerSync.leaveGame();
      onBack();
    } catch (error) {
      console.error('Failed to leave game:', error);
      onBack(); // Still go back even if cleanup fails
    }
  };

  // Auto-start voting when question is shown (creator only)
  useEffect(() => {
    if (localGamePhase === 'question' && isCreator) {
      const timer = setTimeout(() => {
        setLocalGamePhase('voting');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [localGamePhase, isCreator]);

  // Loading state
  if (!gameState || gameState.status !== 'playing') {
    return (
      <div className="multiplayer-game">
        <div className="game-header">
          <button className="game-back-button" onClick={handleLeaveGame}>
            🔙
          </button>
          <div className="game-info">
            <div className="game-code-display">
              {t('gameCode')}: {gameCode}
            </div>
          </div>
        </div>
        <div className="game-content">
          <div className="loading-message">
            {isCreator ? t('preparingGame') : t('waitingForGameToStart')}
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  const currentQuestion = gameState.currentQuestion;
  const votedCount = Object.keys(gameState.votes).length;
  const totalPlayers = gameState.players.length;
  const results = multiplayerSync.getVotingResults();
  const hasMoreQuestions = gameState.currentQuestionIndex < gameState.questions.length - 1;

  return (
    <div className="multiplayer-game">
      <div className="game-header">
        <button className="game-back-button" onClick={handleLeaveGame}>
          🔙
        </button>
        
        <div className="game-info">
          <div className="game-code-display">
            {t('gameCode')}: {gameCode}
          </div>
          <div className="question-counter">
            {t('questionNumber', { 
              current: gameState.currentQuestionIndex + 1, 
              total: gameState.questions.length 
            })}
          </div>
        </div>
      </div>

      <div className="game-content">
        {error && <div className="error-message">{error}</div>}

        {localGamePhase === 'question' && (
          <div className="question-display">
            <QuestionCard 
              question={currentQuestion}
              cardsRemaining={gameState.questions.length - gameState.currentQuestionIndex - 1}
              animationTrigger={animationTrigger}
            />
            <div className="question-instruction">
              {t('getReadyToVote')}
            </div>
          </div>
        )}

        {localGamePhase === 'voting' && (
          <VotingInterface
            question={currentQuestion}
            onVote={handleVote}
            myVote={myVote}
            votedCount={votedCount}
            totalPlayers={totalPlayers}
            isComplete={multiplayerSync.isVotingComplete()}
          />
        )}

        {localGamePhase === 'results' && showResults && (
          <ResultsDisplay
            question={currentQuestion}
            results={results}
            totalPlayers={totalPlayers}
            onNext={handleNextQuestion}
            isCreator={isCreator}
            hasMoreQuestions={hasMoreQuestions}
          />
        )}
      </div>

      <div className="players-status">
        <div className="online-players">
          {gameState.players.map(player => (
            <div key={player.id} className="player-status">
              <span className="player-name">{player.name}</span>
              {localGamePhase === 'voting' && (
                <span className={`vote-status ${gameState.votes[player.id] ? 'voted' : 'waiting'}`}>
                  {gameState.votes[player.id] ? '✓' : '⏳'}
                </span>
              )}
              <span className="connection-status">🟢</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MultiplayerGame;