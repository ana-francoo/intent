import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFloatingPopup } from '@/utils/floatingPopup';
import { useAuth } from '@/hooks/useAuth';

export default function PopupLauncher() {
  const navigate = useNavigate();
  const { data: session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    
    const isInsideIframe = window.parent !== window;
    
    if (isInsideIframe) {
      console.log('[PopupLauncher] Already inside floating popup iframe, navigating to dashboard');
      navigate('/dashboard');
      return;
    }
    
    const isExtensionUrl = location.href.includes('chrome-extension://');
    
    const isPopupWindow = isExtensionUrl && window.outerWidth <= 500 && window.outerHeight <= 700;
    
    const isOnTourPage = location.href.includes('#/tour') || location.href.includes('tour=1');
    
    console.log('[PopupLauncher] Auth check:', { session: !!session, isPopupWindow, isOnTourPage });
    
    if (!session && isPopupWindow && !isOnTourPage) {
      console.log('[PopupLauncher] Not authenticated in popup window, opening welcome page in new tab');
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html#/welcome'),
        active: true
      });
      window.close();
      return;
    }
    
    if (isExtensionUrl && typeof chrome !== 'undefined' && chrome.tabs) {
      console.log('[PopupLauncher] Opening popup in current context');
      createFloatingPopup({ route: '/dashboard', draggable: true });
    } else {
      // Regular web page - just create the popup here
      console.log('[PopupLauncher] Creating floating popup on current page');
      createFloatingPopup({ 
        route: '/dashboard', 
        draggable: true 
      });
    }
  }, [navigate, session, isLoading]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse text-white/60">Opening extension...</div>
      </div>
    </div>
  );
}