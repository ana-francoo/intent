import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { saveIntention, getIntention, isUrlBlocked } from '../utils/storage'
import { injectOverlay } from '../utils/overlay'

console.log('[CRXJS] Hello world from content script!')

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Function to check and trigger overlay for blocked URLs
const checkAndTriggerOverlay = async () => {
  try {
    const currentUrl = window.location.href;
    const isBlocked = await isUrlBlocked(currentUrl);
    
    if (isBlocked) {
      console.log('Blocked URL detected:', currentUrl);
      injectOverlay();
    }
  } catch (error) {
    console.error('Error checking blocked URL:', error);
  }
};

// Check for blocked URLs when page loads
checkAndTriggerOverlay();

// Listen for URL changes (for single-page applications)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Add a small delay to ensure the page has fully loaded
    setTimeout(checkAndTriggerOverlay, 100);
  }
});

// Start observing URL changes
observer.observe(document, { subtree: true, childList: true });

// Listen for overlay trigger messages
if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'SHOW_OVERLAY') {
      injectOverlay();
    }
  });
}
