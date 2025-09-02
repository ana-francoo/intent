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
      navigate('/dashboard');
      return;
    }
    
    const isExtensionUrl = location.href.includes('chrome-extension://');
    const isPopupWindow = isExtensionUrl && window.outerWidth <= 500 && window.outerHeight <= 700;
    
    if (isPopupWindow) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabUrl = tabs[0]?.url || '';
        const isOnTourPage = activeTabUrl.includes('#/tour') || activeTabUrl.includes('tour=1');
        const isRestrictedPage = activeTabUrl.startsWith('chrome://')
        
        if (!session && !isOnTourPage) {
          chrome.tabs.create({
            url: chrome.runtime.getURL('src/popup/index.html#/welcome'),
            active: true
          });
          window.close();
          return;
        }
        
        if (isRestrictedPage) {
          document.documentElement.classList.add('show-popup');
          navigate(isOnTourPage ? '/tour-dashboard' : '/dashboard');
          return;
        }
        
        chrome.runtime.sendMessage({
          type: 'CREATE_FLOATING_IFRAME_ON_TAB',
          route: isOnTourPage ? '/tour-dashboard' : '/dashboard',
          skipAuth: isOnTourPage
        }, (response) => {
          if (response?.success) {
            window.close();
          } else {
            console.log('Cannot inject iframe, showing popup instead:', response?.error);
            document.documentElement.classList.add('show-popup');
            navigate(isOnTourPage ? '/tour-dashboard' : '/dashboard');
          }
        });
      });
      return;
    }
    
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