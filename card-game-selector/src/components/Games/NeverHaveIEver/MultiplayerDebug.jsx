// src/components/Games/NeverHaveIEver/MultiplayerDebug.jsx
import React, { useState, useEffect } from 'react';
import simpleCrossBrowserSync from './SimpleCrossBrowserSync';

function MultiplayerDebug() {
  const [games, setGames] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const refreshGames = () => {
    const allGames = simpleCrossBrowserSync.getAllGames();
    setGames(allGames);
  };

  useEffect(() => {
    if (isVisible) {
      refreshGames();
      const interval = setInterval(refreshGames, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const clearAllGames = () => {
    // Clear all game storage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('nhie_') || key.startsWith('bin_'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Clear shared memory
    if (window.NHIE_SHARED_GAMES) {
      window.NHIE_SHARED_GAMES.clear();
    }
    
    refreshGames();
    alert('All games cleared!');
  };

  const createTestGame = async () => {
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const testGame = {
      gameCode,
      hostId: 'test_host',
      players: [
        { id: 'test_host', name: 'Test Host', isHost: true },
        { id: 'test_player1', name: 'Test Player 1', isHost: false }
      ],
      status: 'lobby',
      currentQuestion: null,
      currentQuestionIndex: 0,
      votes: {},
      questions: [],
      settings: { maxPlayers: 10 },
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    await simpleCrossBrowserSync.saveGameState(testGame);
    refreshGames();
    alert(`Test game created with code: ${gameCode}`);
  };

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999
      }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            background: '#ff69b4',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
          title="Debug Multiplayer"
        >
          🔧
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      background: 'white',
      border: '2px solid #ff69b4',
      borderRadius: '10px',
      padding: '15px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
      zIndex: 9999,
      fontSize: '12px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#ff69b4' }}>Multiplayer Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={refreshGames}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '11px'
          }}
        >
          Refresh
        </button>
        
        <button
          onClick={createTestGame}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '11px'
          }}
        >
          Create Test Game
        </button>
        
        <button
          onClick={clearAllGames}
          style={{
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear All
        </button>
      </div>
      
      <div>
        <h4 style={{ margin: '10px 0 5px 0', color: '#333' }}>
          Active Games ({games.length})
        </h4>
        
        {games.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No games found</p>
        ) : (
          games.map((game, index) => (
            <div
              key={index}
              style={{
                background: '#f9f9f9',
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '8px',
                marginBottom: '8px'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#ff69b4' }}>
                {game.gameCode} ({game.source})
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Status: {game.gameState.status} | 
                Players: {game.gameState.players.length} |
                Updated: {new Date(game.gameState.lastUpdated).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>
                Players: {game.gameState.players.map(p => p.name).join(', ')}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '5px',
        fontSize: '10px',
        color: '#666'
      }}>
        <strong>Testing Instructions:</strong><br/>
        1. Create a game in this browser<br/>
        2. Open another browser (Chrome, Firefox, etc.)<br/>
        3. Go to the same URL<br/>
        4. Try to join using the game code<br/>
        5. Watch the debug panel for sync updates
      </div>
    </div>
  );
}

export default MultiplayerDebug;