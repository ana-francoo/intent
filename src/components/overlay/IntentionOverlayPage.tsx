import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import IntentionOverlay from './IntentionOverlay';

const IntentionOverlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetUrl = searchParams.get('targetUrl');

  useEffect(() => {
    // Make the page fullscreen by setting body styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';

    return () => {
      // Clean up styles when component unmounts
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    // Redirect back to target URL after intention is set
    if (targetUrl) {
      window.location.href = targetUrl;
    } else {
      // Fallback to closing the tab/window
      window.close();
    }
  };

  if (!targetUrl) {
    return (
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/95 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4 text-white">
            Error: No target URL provided
          </h2>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <IntentionOverlay 
        url={decodeURIComponent(targetUrl)} 
        onClose={handleClose}
      />
    </div>
  );
};

export default IntentionOverlayPage;