import { cleanupExpiredIntentions } from '../utils/storage'
import { checkExistingSession } from '../utils/auth'
import { initializeRouteInterceptor } from '../utils/routeInterceptor'
import { startIntentionMonitoring } from '../utils/intentionMonitor'
import { createFloatingPopup } from '../utils/floatingPopup'

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    __mainContentScriptLoaded?: boolean;
  }
}

// Simple guard against multiple injections
if (window.__mainContentScriptLoaded) {
  console.log('🎯 Main content script already loaded, skipping...');
  throw new Error('Main content script already loaded');
}

window.__mainContentScriptLoaded = true;

// Clean up expired intentions on content script load
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  cleanupExpiredIntentions().then(cleanedCount => {
    if (cleanedCount > 0) {
      console.log(`[CRXJS] Cleaned up ${cleanedCount} expired intentions`);
    }
  });
} else {
  console.warn('[CRXJS] Chrome storage not available, skipping cleanup');
}

// Route interceptor initialization - runs as early as possible
const initializeInterceptor = async () => {
  try {
    console.log('🛡️ Initializing route interceptor for:', window.location.href);
    await initializeRouteInterceptor();
  } catch (error) {
    console.error('❌ Error initializing route interceptor:', error);
  }
};

// Initialize route interceptor immediately
// Ensure session is hydrated in this page context before intercepting
checkExistingSession().finally(() => initializeInterceptor());

// Check if we should start monitoring (after successful intention setting)
if (sessionStorage.getItem('intent_start_monitoring') === 'true') {
  sessionStorage.removeItem('intent_start_monitoring');
  console.log('🔍 Starting AI-powered intention monitoring after redirect');
  startIntentionMonitoring();
  
  // Clean up the intent_just_set flag after a delay to ensure we don't need it anymore
  setTimeout(() => {
    sessionStorage.removeItem('intent_just_set');
    console.log('🧹 Cleaned up intent_just_set flag after successful access');
  }, 5000);
}

// Listen for URL changes (for single-page applications)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Re-initialize interceptor for new URL
    setTimeout(() => {
      initializeInterceptor();
    }, 100);
  }
});

// Start observing URL changes
observer.observe(document, { subtree: true, childList: true });

// Listen for overlay trigger messages
if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'PING') {
      // Respond to ping to confirm content script is loaded
      sendResponse({ pong: true });
      return true;
    }
    
    if (msg && msg.type === 'SHOW_OVERLAY') {
      initializeInterceptor();
    }
    
    if (msg && msg.type === 'CREATE_VISUAL_ELEMENT') {
      console.log('🎯 Creating visual element:', msg.elementType, msg.position, 'skipAuth:', msg.skipAuth, 'route:', msg.route);
      createVisualElement(msg.elementType, msg.position, msg.skipAuth, msg.route);
    }
  });
}

// Listen for close floating popup messages
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLOSE_FLOATING_POPUP') {
    console.log('🔌 Received CLOSE_FLOATING_POPUP message, closing popup...');
    const floatingPopup = document.getElementById('floating-popup-container');
    if (floatingPopup) {
      floatingPopup.style.animation = 'floating-popup-disappear 0.3s ease-in forwards';
      setTimeout(() => {
        floatingPopup.remove();
      }, 300);
    }
  }
});

// Function to create visual elements on the page
function createVisualElement(elementType: string, position: { x: number, y: number }, skipAuth?: boolean, route?: string) {
  const element = document.createElement('div');
  
  switch (elementType) {
    case 'red-blob':
      element.style.cssText = `
        position: fixed;
        top: ${position.y}px;
        left: ${position.x}px;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, #ff4444, #cc0000);
        border-radius: 50%;
        z-index: 2147483646;
        pointer-events: none;
        animation: blob-pulse 2s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
      `;
      break;
      
    case 'flame':
      element.style.cssText = `
        position: fixed;
        top: ${position.y}px;
        left: ${position.x}px;
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg, #ff6b35, #f7931e, #ff4444);
        border-radius: 50% 50% 20% 20%;
        z-index: 2147483646;
        pointer-events: none;
        animation: flame-flicker 1.5s ease-in-out infinite;
        box-shadow: 0 0 30px rgba(255, 107, 53, 0.8);
      `;
      break;
      
    case 'floating-popup':
      const popupRoute = route || (skipAuth ? '/?skipAuth=true' : '');
      createFloatingPopup({ draggable: true, route: popupRoute });
      return;
      
    default:
      element.style.cssText = `
        position: fixed;
        top: ${position.y}px;
        left: ${position.x}px;
        width: 50px;
        height: 50px;
        background: #f26419;
        border-radius: 8px;
        z-index: 2147483646;
        pointer-events: none;
        animation: fade-in-out 3s ease-in-out;
      `;
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blob-pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    
    @keyframes flame-flicker {
      0%, 100% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.1) rotate(2deg); }
      50% { transform: scale(0.9) rotate(-1deg); }
      75% { transform: scale(1.05) rotate(1deg); }
    }
    
    @keyframes fade-in-out {
      0% { opacity: 0; transform: scale(0.5); }
      20% { opacity: 1; transform: scale(1); }
      80% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.5); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(element);
  
  // Only auto-remove for non-floating-popup elements
  if (elementType !== 'floating-popup') {
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 5000);
  }
}