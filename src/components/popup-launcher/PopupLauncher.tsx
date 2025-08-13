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
      console.log('[PopupLauncher] User just logged in, creating new tab for popup...');
      
      // Create a new tab and attach the popup there
      chrome.tabs.create({ url: 'https://www.google.com' }, async (newTab) => {
        if (newTab.id) {
          // Wait for tab to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              files: ['src/content/main.tsx-loader.js']
            });
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Create popup on the new tab
            await chrome.tabs.sendMessage(newTab.id, {
              type: 'CREATE_VISUAL_ELEMENT',
              elementType: 'floating-popup',
              position: { x: 100, y: 100 }
            });
            
            console.log('[PopupLauncher] Popup created on new tab');
            
            // Close this extension tab
            setTimeout(() => window.close(), 100);
            
          } catch (error) {
            console.error('[PopupLauncher] Failed to create popup on new tab:', error);
            // Fallback: create popup locally
            createFloatingPopup({ 
              route: '/dashboard', 
              draggable: true 
            });
          }
        }
      });
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