// src/components/Games/NeverHaveIEver/SimpleCrossBrowserSync.js

class SimpleCrossBrowserSync {
  constructor() {
    this.gameStorage = new Map();
    this.eventListeners = new Map();
    this.syncInterval = null;
    this.lastKnownStates = new Map();
    
    // Simulate a shared "server" using a global variable
    if (!window.NHIE_SHARED_GAMES) {
      window.NHIE_SHARED_GAMES = new Map();
    }
    this.sharedGames = window.NHIE_SHARED_GAMES;
    
    // Also use localStorage as a backup sync mechanism
    this.initializeCrossBrowserSync();
  }

  initializeCrossBrowserSync() {
    // Listen for localStorage changes (works across browser tabs, not different browsers)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('nhie_game_')) {
        const gameCode = e.key.replace('nhie_game_', '');
        if (e.newValue) {
          try {
            const gameState = JSON.parse(e.newValue);
            this.notifyListeners(gameCode, gameState);
          } catch (error) {
            console.warn('Failed to parse game state from storage event:', error);
          }
        }
      }
    });

    // Periodically check for updates (for cross-browser sync)
    this.startSyncLoop();
  }

  // Save game state to multiple storage locations
  async saveGameState(gameState) {
    const gameCode = gameState.gameCode;
    
    // 1. Save to shared memory (same browser instance)
    this.sharedGames.set(gameCode, gameState);
    
    // 2. Save to localStorage (cross-tab sync)
    localStorage.setItem(`nhie_game_${gameCode}`, JSON.stringify(gameState));
    
    // 3. Save to a "shared" localStorage key with timestamp (cross-browser polling)
    const sharedKey = `nhie_shared_${gameCode}`;
    const sharedData = {
      gameState,
      timestamp: Date.now(),
      lastUpdated: gameState.lastUpdated
    };
    localStorage.setItem(sharedKey, JSON.stringify(sharedData));
    
    // 4. Broadcast to same browser
    this.broadcastUpdate(gameState);
    
    console.log(`Game ${gameCode} saved to all storage locations`);
    return true;
  }

  // Load game state from multiple storage locations
  async loadGameState(gameCode) {
    // Try different storage locations in order of preference
    
    // 1. Check shared memory first (fastest)
    if (this.sharedGames.has(gameCode)) {
      console.log(`Game ${gameCode} loaded from shared memory`);
      return this.sharedGames.get(gameCode);
    }
    
    // 2. Check localStorage
    const localKey = `nhie_game_${gameCode}`;
    const localStored = localStorage.getItem(localKey);
    if (localStored) {
      try {
        const gameState = JSON.parse(localStored);
        console.log(`Game ${gameCode} loaded from localStorage`);
        // Also save to shared memory for faster access
        this.sharedGames.set(gameCode, gameState);
        return gameState;
      } catch (error) {
        console.warn('Failed to parse game from localStorage:', error);
      }
    }
    
    // 3. Check shared localStorage key (for cross-browser)
    const sharedKey = `nhie_shared_${gameCode}`;
    const sharedStored = localStorage.getItem(sharedKey);
    if (sharedStored) {
      try {
        const sharedData = JSON.parse(sharedStored);
        console.log(`Game ${gameCode} loaded from shared localStorage`);
        // Save to other locations too
        this.sharedGames.set(gameCode, sharedData.gameState);
        localStorage.setItem(localKey, JSON.stringify(sharedData.gameState));
        return sharedData.gameState;
      } catch (error) {
        console.warn('Failed to parse game from shared localStorage:', error);
      }
    }
    
    console.log(`Game ${gameCode} not found in any storage`);
    return null;
  }

  // Remove game from all storage locations
  async removeGameState(gameCode) {
    // Remove from all storage locations
    this.sharedGames.delete(gameCode);
    localStorage.removeItem(`nhie_game_${gameCode}`);
    localStorage.removeItem(`nhie_shared_${gameCode}`);
    
    console.log(`Game ${gameCode} removed from all storage`);
  }

  // Broadcast update to same browser
  broadcastUpdate(gameState) {
    // Custom event for same-page communication
    window.dispatchEvent(new CustomEvent('nhie-game-update', {
      detail: { gameState, timestamp: Date.now() }
    }));
  }

  // Subscribe to game updates
  subscribe(gameCode, callback) {
    if (!this.eventListeners.has(gameCode)) {
      this.eventListeners.set(gameCode, new Set());
    }
    
    this.eventListeners.get(gameCode).add(callback);
    
    // Listen for custom events
    const eventHandler = (event) => {
      if (event.detail.gameState.gameCode === gameCode) {
        callback(event.detail.gameState);
      }
    };
    
    window.addEventListener('nhie-game-update', eventHandler);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(gameCode);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(gameCode);
        }
      }
      window.removeEventListener('nhie-game-update', eventHandler);
    };
  }

  // Notify all listeners for a specific game
  notifyListeners(gameCode, gameState) {
    const listeners = this.eventListeners.get(gameCode);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(gameState);
        } catch (error) {
          console.error('Error in game state listener:', error);
        }
      });
    }
  }

  // Start sync loop for cross-browser updates
  startSyncLoop() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      this.checkForUpdates();
    }, 2000); // Check every 2 seconds
  }

  // Check for updates from other browsers
  checkForUpdates() {
    // Check all shared localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nhie_shared_')) {
        const gameCode = key.replace('nhie_shared_', '');
        
        try {
          const sharedData = JSON.parse(localStorage.getItem(key));
          const lastKnown = this.lastKnownStates.get(gameCode);
          
          // Check if this is a newer state
          if (!lastKnown || sharedData.lastUpdated > lastKnown) {
            this.lastKnownStates.set(gameCode, sharedData.lastUpdated);
            
            // Update local storage
            this.sharedGames.set(gameCode, sharedData.gameState);
            localStorage.setItem(`nhie_game_${gameCode}`, JSON.stringify(sharedData.gameState));
            
            // Notify listeners
            this.notifyListeners(gameCode, sharedData.gameState);
            
            console.log(`Sync update detected for game ${gameCode}`);
          }
        } catch (error) {
          console.warn('Failed to parse shared game state:', error);
        }
      }
    }
  }

  // Stop sync loop
  stopSyncLoop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get all active games (for debugging)
  getAllGames() {
    const games = [];
    
    // From shared memory
    for (const [gameCode, gameState] of this.sharedGames.entries()) {
      games.push({ gameCode, source: 'memory', gameState });
    }
    
    // From localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nhie_game_')) {
        const gameCode = key.replace('nhie_game_', '');
        if (!games.find(g => g.gameCode === gameCode)) {
          try {
            const gameState = JSON.parse(localStorage.getItem(key));
            games.push({ gameCode, source: 'localStorage', gameState });
          } catch (error) {
            console.warn('Failed to parse game:', error);
          }
        }
      }
    }
    
    return games;
  }

  // Cleanup old games
  cleanupOldGames() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('nhie_game_') || key.startsWith('nhie_shared_'))) {
        try {
          let gameState;
          if (key.startsWith('nhie_shared_')) {
            const sharedData = JSON.parse(localStorage.getItem(key));
            gameState = sharedData.gameState;
          } else {
            gameState = JSON.parse(localStorage.getItem(key));
          }
          
          if (now - gameState.createdAt > maxAge) {
            localStorage.removeItem(key);
            console.log(`Cleaned up old game: ${key}`);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          console.log(`Removed corrupted game entry: ${key}`);
        }
      }
    }
  }
}

// Create singleton instance
const simpleCrossBrowserSync = new SimpleCrossBrowserSync();

// Cleanup old games on startup
simpleCrossBrowserSync.cleanupOldGames();

export default simpleCrossBrowserSync;