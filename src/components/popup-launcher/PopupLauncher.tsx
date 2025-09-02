import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      // Already inside floating popup iframe, navigate to dashboard
      navigate('/dashboard');
      return;
    }
    
    const isExtensionUrl = location.href.includes('chrome-extension://');
    const isPopupWindow = isExtensionUrl && window.outerWidth <= 500 && window.outerHeight <= 700;
    
    // If we're in a popup window, check the active tab to make decisions
    if (isPopupWindow) {
      // Query the active tab to check if we're on the tour page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabUrl = tabs[0]?.url || '';
        const isOnTourPage = activeTabUrl.includes('#/tour') || activeTabUrl.includes('tour=1');
        
        // Check auth and tour page status
        if (!session && !isOnTourPage) {
          // Not authenticated and not on tour - open welcome page in new tab
          chrome.tabs.create({
            url: chrome.runtime.getURL('src/popup/index.html#/welcome'),
            active: true
          });
          window.close();
          return;
        }
        
        // Has session OR on tour page - create floating iframe on the actual webpage
        chrome.runtime.sendMessage({
          type: 'CREATE_FLOATING_IFRAME_ON_TAB',
          route: isOnTourPage ? '/tour-dashboard' : '/dashboard',
          skipAuth: isOnTourPage
        }, () => {
          window.close();
        });
      });
      return;
    }
    
   // Not in popup window or extension tab - just navigate normally
    navigate('/dashboard');
  }, [navigate, session, isLoading]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse text-white/60">Opening extension...</div>
      </div>
    </div>
  );
}