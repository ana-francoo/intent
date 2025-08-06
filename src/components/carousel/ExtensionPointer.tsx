import './ExtensionPointer.css';
import { useState, useEffect } from 'react';

interface ExtensionPointerProps {
  onComplete?: () => void;
}

const ExtensionPointer = ({ onComplete }: ExtensionPointerProps) => {
  const [extensionClicked, setExtensionClicked] = useState(false);

  useEffect(() => {
    // Listen for when the extension icon is clicked
    const handleExtensionClick = (message: any) => {
      if (message.type === 'CREATE_VISUAL_ELEMENT' && message.elementType === 'floating-popup') {
        console.log('🎯 Extension icon clicked, hiding arrow and text');
        setExtensionClicked(true);
      }
    };

    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleExtensionClick);
    }

    // Cleanup listener on unmount
    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleExtensionClick);
      }
    };
  }, []);

  const handleOverlayClick = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="extension-pointer-overlay" onClick={handleOverlayClick}>
      {/* Grainy white background */}
      <div className="grainy-background"></div>
      
      {/* Squiggly arrow pointing to top right - hidden when extension is clicked */}
      {!extensionClicked && (
        <div className="squiggly-arrow">
          <svg 
            width="160" 
            height="120" 
            viewBox="0 0 120 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="arrow-svg"
          >
            <path 
              d="M10 50 Q60 25 100 25 L100 15 L120 25 L100 35 L100 25" 
              stroke="#ff6b35" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
              className="arrow-path"
            />
          </svg>
        </div>
      )}
      
      {/* Text hint - hidden when extension is clicked */}
      {!extensionClicked && (
        <div className="pointer-text">
          <p>Click the extension icon to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ExtensionPointer; 