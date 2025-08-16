import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFloatingPopup } from '@/utils/floatingPopup';

export default function PopupLauncher() {
  const navigate = useNavigate();

  useEffect(() => {
    const isInsideIframe = window.parent !== window;
    
    if (isInsideIframe) {
      console.log('[PopupLauncher] Already inside floating popup iframe, navigating to dashboard');
      navigate('/dashboard');
      return;
    }
    
    // Check if we're in a chrome-extension:// URL (user just logged in)
    const isExtensionUrl = location.href.includes('chrome-extension://');
    
    if (isExtensionUrl && typeof chrome !== 'undefined' && chrome.tabs) {
      // Open directly in current context; avoid creating a new tab
      console.log('[PopupLauncher] User just logged in, opening popup in current context');
      createFloatingPopup({ route: '/dashboard', draggable: true });
    } else {
      // Regular web page - just create the popup here
      console.log('[PopupLauncher] Creating floating popup on current page');
      createFloatingPopup({ 
        route: '/dashboard', 
        draggable: true 
      });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse text-white/60">Opening extension...</div>
      </div>
    </div>
  );
}