// src/components/Games/NeverHaveIEver/GameLobby.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import multiplayerSync from './MultiplayerSyncManager';
import MultiplayerDebug from './MultiplayerDebug';
import './GameLobby.css';

function GameLobby({ onStartGame, onBack }) {
  const { t } = useTranslation();
  const [gameMode, setGameMode] = useState(null); // 'create' or 'join'
  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to game state changes
  useEffect(() => {
    let unsubscribe = null;
    
    if (gameState) {
      unsubscribe = multiplayerSync.subscribe((newGameState) => {
        setGameState(newGameState);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [gameState]);

  // Create game
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError(t('pleaseEnterPlayerName'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const creatorData = {
        id: `player_${Date.now()}`,
        name: playerName.trim(),
        isCreator: true,
        joinedAt: Date.now()
      };
      
      const newGameState = await multiplayerSync.createGame(creatorData);
      setGameState(newGameState);
      setGameCode(newGameState.gameCode);
      setGameMode('create');
      setIsCreator(true);
    } catch (error) {
      console.error('Failed to create game:', error);
      setError(t('failedToCreateGame'));
    } finally {
      setIsLoading(false);
    }
  };

  // Join game
  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError(t('pleaseEnterPlayerName'));
      return;
    }
    
    if (!joinCode.trim()) {
      setError(t('pleaseEnterGameCode'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const playerData = {
        id: `player_${Date.now()}`,
        name: playerName.trim(),
        isCreator: false,
        joinedAt: Date.now()
      };
      
      const joinedGameState = await multiplayerSync.joinGame(joinCode.trim().toUpperCase(), playerData);
      setGameState(joinedGameState);
      setGameCode(joinedGameState.gameCode);
      setGameMode('join');
      setIsCreator(false);
    } catch (error) {
      console.error('Failed to join game:', error);
      setError(error.message || t('failedToJoinGame'));
    } finally {
      setIsLoading(false);
    }
  };

  // Start game (creator only)
  const handleStartGame = async () => {
    if (!gameState || gameState.players.length < 2) {
      setError(t('needMorePlayers'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, you would pass the selected questions here
      // For now, we'll let the MultiplayerGame component handle question loading
      const questions = []; // This will be populated by MultiplayerGame
      
      await multiplayerSync.startGame(questions);
      
      // Pass the current game state to the game component
      onStartGame({
        gameCode: gameState.gameCode,
        players: gameState.players,
        isCreator,
        playerId: multiplayerSync.playerId
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      setError(t('failedToStartGame'));
    } finally {
      setIsLoading(false);
    }
  };

  // Leave game
  const handleLeaveGame = async () => {
    try {
      await multiplayerSync.leaveGame();
      setGameState(null);
      setGameCode('');
      setGameMode(null);
      setIsCreator(false);
      setError('');
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  };

  // Back to main menu
  const handleBack = () => {
    if (gameState) {
      handleLeaveGame();
    }
    onBack();
  };

  // Initial lobby screen
  if (!gameMode) {
    return (
      <div className="game-lobby">
        <button 
          className="lobby-back-button"
          onClick={handleBack}
        >
          🔙
        </button>
        
        <h1 className="lobby-title">{t('neverHaveIEver')}</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="lobby-player-input">
          <input
            type="text"
            className="lobby-input"
            placeholder={t('enterYourName')}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            disabled={isLoading}
          />
        </div>
        
        <div className="lobby-game-options">
          <button 
            className="lobby-option-button create"
            onClick={handleCreateGame}
            disabled={!playerName.trim() || isLoading}
          >
            <div className="option-icon">🎮</div>
            <div className="option-text">
              {isLoading ? t('creating') : t('createGame')}
            </div>
          </button>
          
          <button 
            className="lobby-option-button join"
            onClick={() => setGameMode('join-input')}
            disabled={!playerName.trim() || isLoading}
          >
            <div className="option-icon">🔗</div>
            <div className="option-text">{t('joinGame')}</div>
          </button>
        </div>
      </div>
    );
  }

  // Join game input screen
  if (gameMode === 'join-input') {
    return (
      <div className="game-lobby">
        <button 
          className="lobby-back-button"
          onClick={() => {
            setGameMode(null);
            setError('');
          }}
        >
          🔙
        </button>
        
        <h1 className="lobby-title">{t('joinGame')}</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="lobby-join-section">
          <input
            type="text"
            className="lobby-input game-code-input"
            placeholder={t('enterGameCode')}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={isLoading}
          />
          
          <button 
            className="lobby-join-button"
            onClick={handleJoinGame}
            disabled={!joinCode.trim() || isLoading}
          >
            {isLoading ? t('joining') : t('joinGame')}
          </button>
        </div>
      </div>
    );
  }

  // Game lobby (waiting for players)
  return (
    <div className="game-lobby">
      <MultiplayerDebug />
      
      <button 
        className="lobby-back-button"
        onClick={handleLeaveGame}
      >
        🔙
      </button>
      
      <h1 className="lobby-title">{t('gameRoom')}</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="lobby-game-code">
        <div className="code-label">{t('gameCode')}</div>
        <div className="code-value">{gameCode}</div>
        <div className="code-instruction">
          {t('shareCodeWithFriends')}
        </div>
      </div>
      
      {gameState && (
        <div className="lobby-players-section">
          <h3 className="players-title">
            {t('players')} ({gameState.players.length}/10)
          </h3>
          
          <div className="players-list">
            {gameState.players.map(player => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                {player.isCreator && <span className="creator-badge">{t('creator')}</span>}
                <span className="player-status online">🟢</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isCreator && gameState && (
        <button 
          className="lobby-start-button"
          onClick={handleStartGame}
          disabled={gameState.players.length < 2 || isLoading}
        >
          {isLoading ? t('starting') : t('startGame')}
        </button>
      )}
      
      {!isCreator && (
        <div className="waiting-message">
          {t('waitingForCreator')}
        </div>
      )}
    </div>
  );
}

export default GameLobby;