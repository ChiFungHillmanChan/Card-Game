// src/components/Games/NeverHaveIEver/ResultsDisplay.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './ResultsDisplay.css';

function ResultsDisplay({ question, results, totalPlayers, onNext, isCreator, hasMoreQuestions }) {
  const { t } = useTranslation();

  const yesPercentage = totalPlayers > 0 ? (results.yes / totalPlayers) * 100 : 0;
  const noPercentage = totalPlayers > 0 ? (results.no / totalPlayers) * 100 : 0;

  return (
    <div className="results-display">
      <div className="results-question">
        <div className="question-text">
          "{question?.text}"
        </div>
      </div>

      <div className="results-chart">
        <div className="chart-title">
          {t('votingResults')}
        </div>
        
        <div className="results-bars">
          <div className="result-bar yes">
            <div className="bar-header">
              <div className="bar-label">
                <span className="bar-icon">✓</span>
                <span className="bar-text">{t('yes')}</span>
              </div>
              <div className="bar-count">{results.yes}</div>
            </div>
            <div className="bar-container">
              <div 
                className="bar-fill yes-fill"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
            <div className="bar-percentage">{yesPercentage.toFixed(1)}%</div>
          </div>

          <div className="result-bar no">
            <div className="bar-header">
              <div className="bar-label">
                <span className="bar-icon">✗</span>
                <span className="bar-text">{t('no')}</span>
              </div>
              <div className="bar-count">{results.no}</div>
            </div>
            <div className="bar-container">
              <div 
                className="bar-fill no-fill"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
            <div className="bar-percentage">{noPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="results-summary">
          <div className="summary-item">
            <span className="summary-label">{t('totalVotes')}:</span>
            <span className="summary-value">{totalPlayers}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('majority')}:</span>
            <span className="summary-value">
              {results.yes > results.no ? t('yes') : 
               results.no > results.yes ? t('no') : t('tie')}
            </span>
          </div>
        </div>
      </div>

      {isCreator && (
        <div className="results-actions">
          {hasMoreQuestions ? (
            <button 
              className="next-question-button"
              onClick={onNext}
            >
              {t('nextQuestion')}
            </button>
          ) : (
            <button 
              className="end-game-button"
              onClick={onNext}
            >
              {t('endGame')}
            </button>
          )}
        </div>
      )}

      {!isCreator && (
        <div className="waiting-message">
          {hasMoreQuestions ? t('waitingForNextQuestion') : t('waitingForGameEnd')}
        </div>
      )}
    </div>
  );
}

export default ResultsDisplay;