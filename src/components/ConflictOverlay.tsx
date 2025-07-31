import React, { useState } from 'react';
import './ConflictOverlay.css';

interface ConflictOverlayProps {
  currentDomain: string;
  activeIntention: { domain: string; intention: string };
  onClose: () => void;
  onSetNewIntention: () => void;
}

const ConflictOverlay: React.FC<ConflictOverlayProps> = ({ 
  currentDomain, 
  activeIntention, 
  onClose,
  onSetNewIntention 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const currentSiteName = currentDomain.charAt(0).toUpperCase() + currentDomain.slice(1);
  const activeSiteName = activeIntention.domain.charAt(0).toUpperCase() + activeIntention.domain.slice(1);



  const handleContinueWithActive = () => {
    window.location.href = `https://${activeIntention.domain}`;
  };

  const handleSetNewIntention = () => {
    setIsClosing(true);
    setTimeout(() => {
      onSetNewIntention();
    }, 300);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className={`conflict-overlay ${isClosing ? 'closing' : ''}`}>
      <div className="conflict-overlay-content">
        <h2 className="conflict-title">You have an active intention</h2>
        
        <div className="intention-display">
          <div className="intention-label">
            Your intention for {activeSiteName}:
          </div>
          <div className="intention-text">
            {activeIntention.intention}
          </div>
        </div>

        <p className="conflict-message">
          You're trying to visit {currentSiteName}. What would you like to do?
        </p>

        <div className="conflict-buttons">
          <button 
            className="conflict-button continue-button"
            onClick={handleContinueWithActive}
          >
            Continue with {activeSiteName}
          </button>
          
          <button 
            className="conflict-button new-intention-button"
            onClick={handleSetNewIntention}
          >
            Set intention for {currentSiteName}
          </button>
          
          <button 
            className="conflict-button cancel-button"
            onClick={handleGoBack}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictOverlay;