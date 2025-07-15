// src/components/Games/NeverHaveIEver/MultiplayerSyncManager.js
import simpleCrossBrowserSync from './SimpleCrossBrowserSync';

class MultiplayerSyncManager {
  constructor() {
    this.eventListeners = new Map();
    this.gameState = null;
    this.playerId = null;
    this.gameCode = null;
    this.isHost = false;
    this.unsubscribeFromGame = null;
    
    // Use simple cross-browser sync for testing
    this.syncProvider = simpleCrossBrowserSync;
  }

  // ==================== GAME MANAGEMENT ====================

  async createGame(creatorData) {
    const gameCode = this.generateGameCode();
    const gameState = {
      gameCode,
      hostId: creatorData.id,
      players: [{ ...creatorData, isHost: true }],
      status: 'lobby', // 'lobby', 'playing', 'finished'
      currentQuestion: null,
      currentQuestionIndex: 0,
      votes: {},
      questions: [],
      settings: {
        maxPlayers: 10,
        questionTimeout: 30000, // 30 seconds
        showResults: true
      },
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.gameCode = gameCode;
    this.playerId = creatorData.id;
    this.isHost = true;
    this.gameState = gameState;

    await this.syncProvider.saveGameState(gameState);
    this.subscribeToGameUpdates();
    
    return gameState;
  }

  async joinGame(gameCode, playerData) {
    try {
      const gameState = await this.syncProvider.loadGameState(gameCode);
      
      if (!gameState) {
        throw new Error('Game not found');
      }

      if (gameState.status !== 'lobby') {
        throw new Error('Game has already started');
      }

      if (gameState.players.length >= gameState.settings.maxPlayers) {
        throw new Error('Game is full');
      }

      // Check if player name already exists
      const existingPlayer = gameState.players.find(p => 
        p.name.toLowerCase() === playerData.name.toLowerCase()
      );
      if (existingPlayer) {
        throw new Error('Player name already taken');
      }

      // Add player to game
      gameState.players.push({ ...playerData, isHost: false });
      gameState.lastUpdated = Date.now();
      
      this.gameCode = gameCode;
      this.playerId = playerData.id;
      this.isHost = false;
      this.gameState = gameState;

      await this.syncProvider.saveGameState(gameState);
      this.subscribeToGameUpdates();
      
      return gameState;
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  }

  async startGame(questions) {
    if (!this.isHost) {
      throw new Error('Only host can start the game');
    }

    const gameState = { ...this.gameState };
    gameState.status = 'playing';
    gameState.questions = questions;
    gameState.currentQuestion = questions[0];
    gameState.currentQuestionIndex = 0;
    gameState.votes = {};
    gameState.lastUpdated = Date.now();

    this.gameState = gameState;
    await this.syncProvider.saveGameState(gameState);
    
    return gameState;
  }

  // ==================== VOTING SYSTEM ====================

  async submitVote(vote) {
    if (!this.gameState || this.gameState.status !== 'playing') {
      throw new Error('Game is not active');
    }

    if (this.gameState.votes[this.playerId]) {
      throw new Error('Already voted');
    }

    const gameState = { ...this.gameState };
    gameState.votes[this.playerId] = {
      playerId: this.playerId,
      vote: vote, // 'yes' or 'no'
      timestamp: Date.now()
    };
    gameState.lastUpdated = Date.now();

    this.gameState = gameState;
    await this.syncProvider.saveGameState(gameState);
    
    return gameState;
  }

  async nextQuestion() {
    if (!this.isHost) {
      throw new Error('Only host can advance questions');
    }

    const gameState = { ...this.gameState };
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
      gameState.status = 'finished';
      gameState.currentQuestion = null;
    } else {
      gameState.currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    }
    
    gameState.votes = {};
    gameState.lastUpdated = Date.now();

    this.gameState = gameState;
    await this.syncProvider.saveGameState(gameState);
    
    return gameState;
  }

  // ==================== SYNC METHODS ====================

  subscribeToGameUpdates() {
    if (this.unsubscribeFromGame) {
      this.unsubscribeFromGame();
    }
    
    this.unsubscribeFromGame = this.syncProvider.subscribe(this.gameCode, (updatedGameState) => {
      if (!this.gameState || updatedGameState.lastUpdated > this.gameState.lastUpdated) {
        this.gameState = updatedGameState;
        this.notifyListeners(updatedGameState);
      }
    });
  }

  stopSyncLoop() {
    if (this.unsubscribeFromGame) {
      this.unsubscribeFromGame();
      this.unsubscribeFromGame = null;
    }
  }

  // ==================== EVENT LISTENERS ====================

  subscribe(callback) {
    const listenerId = Date.now() + Math.random();
    this.eventListeners.set(listenerId, callback);
    
    return () => {
      this.eventListeners.delete(listenerId);
      if (this.eventListeners.size === 0) {
        this.stopSyncLoop();
      }
    };
  }

  notifyListeners(gameState) {
    this.eventListeners.forEach(callback => {
      try {
        callback(gameState);
      } catch (error) {
        console.error('Error in game state listener:', error);
      }
    });
  }

  // ==================== UTILITY METHODS ====================

  generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getVotingResults() {
    if (!this.gameState || !this.gameState.votes) return { yes: 0, no: 0 };
    
    const votes = Object.values(this.gameState.votes);
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length
    };
  }

  isVotingComplete() {
    if (!this.gameState) return false;
    
    const totalVotes = Object.keys(this.gameState.votes).length;
    const totalPlayers = this.gameState.players.length;
    return totalVotes === totalPlayers;
  }

  getCurrentPlayer() {
    if (!this.gameState || !this.playerId) return null;
    return this.gameState.players.find(p => p.id === this.playerId);
  }

  // ==================== CLEANUP ====================

  async leaveGame() {
    if (!this.gameState || !this.playerId) return;

    const gameState = { ...this.gameState };
    gameState.players = gameState.players.filter(p => p.id !== this.playerId);
    
    // If host leaves, assign to another player
    if (this.isHost && gameState.players.length > 0) {
      gameState.players[0].isHost = true;
      gameState.hostId = gameState.players[0].id;
    }
    
    // If no players left, clean up game
    if (gameState.players.length === 0) {
      await this.syncProvider.removeGameState(this.gameCode);
    } else {
      gameState.lastUpdated = Date.now();
      await this.syncProvider.saveGameState(gameState);
    }

    this.cleanup();
  }

  cleanup() {
    this.stopSyncLoop();
    
    this.gameState = null;
    this.playerId = null;
    this.gameCode = null;
    this.isHost = false;
    this.eventListeners.clear();
  }
}

// Create singleton instance
const multiplayerSync = new MultiplayerSyncManager();

export default multiplayerSync;