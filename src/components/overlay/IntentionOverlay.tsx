import React, { useState, useEffect, useRef } from 'react';
import { setActiveIntention, normalizeUrlToDomain } from '../utils/intentionManager';
import Flame from './home/Flame';
import './IntentionOverlay.css';

interface IntentionOverlayProps {
  url: string;
  onClose: () => void;
}

const IntentionOverlay: React.FC<IntentionOverlayProps> = ({ url, onClose }) => {
  const [intention, setIntention] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlame, setShowFlame] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const domain = normalizeUrlToDomain(url);
  const websiteName = domain.charAt(0).toUpperCase() + domain.slice(1);

  useEffect(() => {
    // Focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!intention.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Show flame animation
      setShowFlame(true);
      
      // Save intention
      await setActiveIntention(domain, intention.trim());
      
      // Wait for flame animation, then close
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error setting intention:', error);
      setIsSubmitting(false);
      setShowFlame(false);
      alert('Error setting intention. Please try again.');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match CSS transition duration
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIntention(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className={`intention-overlay ${isClosing ? 'closing' : ''}`}>
      <div className="intention-overlay-content">
        {!showFlame ? (
          // Input phase - show candle
          <>
            <div className="candle-container">
              <div className="candle">
                <img 
                  src={chrome.runtime.getURL('src/assets/logo2.png')} 
                  alt="Intent Logo" 
                  className="candle-logo"
                />
                <div className="wick"></div>
              </div>
            </div>
            
            <div className="input-section">
              <h2 className="question">
                What's your intention for visiting {websiteName}?
              </h2>
              
              <textarea
                ref={textareaRef}
                value={intention}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your intention here..."
                className="intention-input"
                disabled={isSubmitting}
              />
            </div>
          </>
        ) : (
          // Flame phase - show flame with intention
          <div className="flame-container">
            <div className="flame-with-logo">
              <img 
                src={chrome.runtime.getURL('src/assets/logo2.png')} 
                alt="Intent Logo" 
                className="flame-logo"
              />
              <Flame />
            </div>
            
            <div className="intention-text">
              {intention}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntentionOverlay;