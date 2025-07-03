import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NeverHaveIEver from './components/Games/NeverHaveIEver/NeverHaveIEver';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
import './i18n'; 

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { t } = useTranslation();

  if (currentPage === 'home') {
    return (
      <div className="app home-screen">
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        
        <h1 className="title">{t('selectGame')}</h1>
        
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
            <h3>{t('neverHaveIEver')}</h3>
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