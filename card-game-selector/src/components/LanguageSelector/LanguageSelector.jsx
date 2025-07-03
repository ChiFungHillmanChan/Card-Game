import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('languages.en') },
    { code: 'zh-Hant', name: t('languages.zh-Hant') }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const handleKeyDown = (e, languageCode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLanguageChange(languageCode);
    }
  };

  const handleDropdownKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="language-selector">
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleDropdownKeyDown}
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="language-selector-icon">🌐</span>
        <span className="language-selector-text">{currentLanguage.name}</span>
        <span className={`language-selector-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="language-selector-dropdown" role="listbox">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`language-selector-option ${
                language.code === i18n.language ? 'active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) => handleKeyDown(e, language.code)}
              role="option"
              aria-selected={language.code === i18n.language}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;