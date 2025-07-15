// src/components/Games/NeverHaveIEver/VotingInterface.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './VotingInterface.css';

function VotingInterface({ question, onVote, myVote, votedCount, totalPlayers, isComplete }) {
  const { t } = useTranslation();

  return (
    <div className="voting-interface">
      <div className="voting-question">
        <div className="question-text">
          "{question?.text}"
        </div>
      </div>
      
      <div className="voting-progress">
        <div className="progress-text">
          {t('votingProgress', { voted: votedCount, total: totalPlayers })}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

      <div className="voting-instruction">
        {myVote ? t('waitingForOthers') : t('castYourVote')}
      </div>

      <div className="voting-buttons">
        <button 
          className={`vote-button yes ${myVote === 'yes' ? 'selected' : ''}`}
          onClick={() => onVote('yes')}
          disabled={myVote !== null}
        >
          <div className="vote-icon">✓</div>
          <div className="vote-text">{t('yes')}</div>
        </button>

        <button 
          className={`vote-button no ${myVote === 'no' ? 'selected' : ''}`}
          onClick={() => onVote('no')}
          disabled={myVote !== null}
        >
          <div className="vote-icon">✗</div>
          <div className="vote-text">{t('no')}</div>
        </button>
      </div>

      {isComplete && (
        <div className="voting-complete">
          <div className="complete-icon">🎉</div>
          <div className="complete-text">{t('allVotesReceived')}</div>
        </div>
      )}
    </div>
  );
}

export default VotingInterface;