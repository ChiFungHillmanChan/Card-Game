// src/components/Games/NeverHaveIEver/SharedStorageManager.js

class SharedStorageManager {
  constructor() {
    this.baseUrl = 'https://api.jsonbin.io/v3/b'; // Free JSON storage service
    this.apiKey = '$2a$10$8VvXIU8YqN.D9QbQGLCHLeF8Ev2rOTa0UQ6ZHaKLYl8UGOEwmQ4Ze'; // Demo key
    this.gameStorage = new Map(); // Fallback in-memory storage
    this.useOnlineStorage = true; // Set to false to use in-memory only
  }

  // Generate a simple shared storage key
  getStorageKey(gameCode) {
    return `nhie_game_${gameCode}`;
  }

  // Save game state to shared storage
  async saveGameState(gameState) {
    const storageKey = this.getStorageKey(gameState.gameCode);
    
    try {
      if (this.useOnlineStorage) {
        // Try online storage first
        const response = await fetch(`${this.baseUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': this.apiKey,
            'X-Bin-Name': storageKey
          },
          body: JSON.stringify(gameState)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Store the bin ID for later retrieval
          localStorage.setItem(`bin_${gameState.gameCode}`, result.metadata.id);
          console.log('Game saved to online storage:', gameState.gameCode);
          return true;
        }
      }
    } catch (error) {
      console.warn('Online storage failed, using fallback:', error);
    }
    
    // Fallback to shared memory storage
    this.gameStorage.set(gameState.gameCode, gameState);
    // Also save to localStorage as backup
    localStorage.setItem(storageKey, JSON.stringify(gameState));
    console.log('Game saved to local storage:', gameState.gameCode);
    return true;
  }

  // Load game state from shared storage
  async loadGameState(gameCode) {
    const storageKey = this.getStorageKey(gameCode);
    
    try {
      if (this.useOnlineStorage) {
        // Try to get bin ID from localStorage
        const binId = localStorage.getItem(`bin_${gameCode}`);
        if (binId) {
          const response = await fetch(`${this.baseUrl}/${binId}/latest`, {
            headers: {
              'X-Master-Key': this.apiKey
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Game loaded from online storage:', gameCode);
            return result.record;
          }
        }
      }
    } catch (error) {
      console.warn('Online storage retrieval failed, trying fallback:', error);
    }
    
    // Fallback to memory storage
    if (this.gameStorage.has(gameCode)) {
      console.log('Game loaded from memory storage:', gameCode);
      return this.gameStorage.get(gameCode);
    }
    
    // Last resort: localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      console.log('Game loaded from localStorage:', gameCode);
      return JSON.parse(stored);
    }
    
    console.log('Game not found:', gameCode);
    return null;
  }

  // Update existing game state
  async updateGameState(gameState) {
    return this.saveGameState(gameState);
  }

  // Remove game from storage
  async removeGameState(gameCode) {
    const storageKey = this.getStorageKey(gameCode);
    
    try {
      if (this.useOnlineStorage) {
        const binId = localStorage.getItem(`bin_${gameCode}`);
        if (binId) {
          await fetch(`${this.baseUrl}/${binId}`, {
            method: 'DELETE',
            headers: {
              'X-Master-Key': this.apiKey
            }
          });
          localStorage.removeItem(`bin_${gameCode}`);
        }
      }
    } catch (error) {
      console.warn('Failed to delete from online storage:', error);
    }
    
    // Remove from fallback storages
    this.gameStorage.delete(gameCode);
    localStorage.removeItem(storageKey);
    console.log('Game removed:', gameCode);
  }

  // List all active games (for debugging)
  async listGames() {
    const games = [];
    
    // Get from memory storage
    for (const [gameCode, gameState] of this.gameStorage.entries()) {
      games.push({ gameCode, source: 'memory', gameState });
    }
    
    // Get from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nhie_game_')) {
        const gameCode = key.replace('nhie_game_', '');
        if (!games.find(g => g.gameCode === gameCode)) {
          try {
            const gameState = JSON.parse(localStorage.getItem(key));
            games.push({ gameCode, source: 'localStorage', gameState });
          } catch (error) {
            console.warn('Failed to parse game from localStorage:', key);
          }
        }
      }
    }
    
    return games;
  }
}

// Create singleton instance
const sharedStorage = new SharedStorageManager();

export default sharedStorage;