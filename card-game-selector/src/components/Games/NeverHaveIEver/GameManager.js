// src/components/Games/NeverHaveIEver/GameManager.js

class GameManager {
  constructor() {
    this.eventListeners = new Map();
    this.pollInterval = null;
    this.lastStateHash = null;
  }

  // Generate unique game code
  generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create a new game
  createGame(gameCode, creatorData) {
    const gameState = {
      gameCode,
      creator: creatorData,
      players: [creatorData],
      status: 'lobby', // 'lobby', 'playing', 'finished'
      currentQuestion: null,
      currentQuestionIndex: 0,
      votes: {},
      questions: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    // Store game state (in real app, this would be sent to server)
    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Join existing game
  joinGame(gameCode, playerData) {
    const gameState = this.getGameState(gameCode);
    
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.status !== 'lobby') {
      throw new Error('Game has already started');
    }

    if (gameState.players.length >= 10) {
      throw new Error('Game is full');
    }

    // Check if player name already exists
    const existingPlayer = gameState.players.find(p => p.name === playerData.name);
    if (existingPlayer) {
      throw new Error('Player name already taken');
    }

    // Add player to game
    gameState.players.push(playerData);
    gameState.lastUpdated = Date.now();
    
    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Start game (creator only)
  startGame(gameCode, playerId, questions) {
    const gameState = this.getGameState(gameCode);
    
    if (!gameState) {
      throw new Error('Game not found');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.isCreator) {
      throw new Error('Only creator can start the game');
    }

    gameState.status = 'playing';
    gameState.questions = questions;
    gameState.currentQuestion = questions[0];
    gameState.currentQuestionIndex = 0;
    gameState.votes = {};
    gameState.lastUpdated = Date.now();

    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Submit vote
  submitVote(gameCode, playerId, vote) {
    const gameState = this.getGameState(gameCode);
    
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.status !== 'playing') {
      throw new Error('Game is not active');
    }

    gameState.votes[playerId] = vote;
    gameState.lastUpdated = Date.now();

    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Move to next question (creator only)
  nextQuestion(gameCode, playerId) {
    const gameState = this.getGameState(gameCode);
    
    if (!gameState) {
      throw new Error('Game not found');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.isCreator) {
      throw new Error('Only creator can advance questions');
    }

    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
      gameState.status = 'finished';
      gameState.currentQuestion = null;
    } else {
      gameState.currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    }
    
    gameState.votes = {};
    gameState.lastUpdated = Date.now();

    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Get current game state
  getGameState(gameCode) {
    try {
      const stored = localStorage.getItem(`nhie_game_${gameCode}`);
      if (!stored) return null;
      
      const gameState = JSON.parse(stored);
      
      // Clean up old games (older than 24 hours)
      if (Date.now() - gameState.createdAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`nhie_game_${gameCode}`);
        return null;
      }
      
      return gameState;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  // Save game state
  saveGameState(gameCode, gameState) {
    try {
      localStorage.setItem(`nhie_game_${gameCode}`, JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  // Listen for game state changes
  subscribeToGame(gameCode, callback) {
    if (!this.eventListeners.has(gameCode)) {
      this.eventListeners.set(gameCode, new Set());
    }
    
    this.eventListeners.get(gameCode).add(callback);
    
    // Start polling if not already started
    if (!this.pollInterval) {
      this.startPolling();
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(gameCode);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(gameCode);
        }
      }
      
      // Stop polling if no listeners
      if (this.eventListeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  // Start polling for changes
  startPolling() {
    this.pollInterval = setInterval(() => {
      this.eventListeners.forEach((listeners, gameCode) => {
        const currentState = this.getGameState(gameCode);
        if (currentState) {
          const stateHash = this.getStateHash(currentState);
          if (stateHash !== this.lastStateHash) {
            this.lastStateHash = stateHash;
            listeners.forEach(callback => callback(currentState));
          }
        }
      });
    }, 1000); // Poll every second
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Get state hash for change detection
  getStateHash(state) {
    return JSON.stringify({
      players: state.players.length,
      status: state.status,
      currentQuestionIndex: state.currentQuestionIndex,
      votes: Object.keys(state.votes).length,
      lastUpdated: state.lastUpdated
    });
  }

  // Remove player from game
  removePlayer(gameCode, playerId) {
    const gameState = this.getGameState(gameCode);
    
    if (!gameState) {
      throw new Error('Game not found');
    }

    gameState.players = gameState.players.filter(p => p.id !== playerId);
    
    // If creator leaves, assign to another player
    if (gameState.players.length > 0 && !gameState.players.find(p => p.isCreator)) {
      gameState.players[0].isCreator = true;
    }
    
    // If no players left, clean up game
    if (gameState.players.length === 0) {
      localStorage.removeItem(`nhie_game_${gameCode}`);
      return null;
    }

    gameState.lastUpdated = Date.now();
    this.saveGameState(gameCode, gameState);
    return gameState;
  }

  // Cleanup old games
  cleanupOldGames() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('nhie_game_')) {
        try {
          const gameState = JSON.parse(localStorage.getItem(key));
          if (Date.now() - gameState.createdAt > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// Create singleton instance
const gameManager = new GameManager();

// Cleanup old games on startup
gameManager.cleanupOldGames();

export default gameManager;