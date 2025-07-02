import React, { useState } from 'react';
import NeverHaveIEver from './components/Games/NeverHaveIEver/NeverHaveIEver';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [musicOn, setMusicOn] = useState(true);

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
      <NeverHaveIEver onBack={() => setCurrentPage('home')} />
    );
  }

  return null;
}

export default App;