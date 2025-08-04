import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { isUrlBlocked, cleanupExpiredIntentions, getBlockedSites } from '../utils/storage'
import { initializeRouteInterceptor } from '../utils/routeInterceptor'
import { startIntentionMonitoring } from '../utils/intentionMonitor'
import { hasExtensionAccess } from '../utils/subscription'

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

const container = document.createElement('div')
container.id = 'crxjs-app'
container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647;'
document.body.appendChild(container)

console.log('🎯 Content script container created:', container)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
initializeInterceptor();

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
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'SHOW_OVERLAY') {
      initializeInterceptor();
    }
  });
}

// Add global test function for debugging
(window as any).testBlockedSites = async () => {
  console.log('🧪 Testing blocked sites from content script...');
  
  try {
    // Test 1: Get blocked sites
    const blockedSites = await getBlockedSites();
    console.log('📋 Blocked sites:', blockedSites);
    
    // Test 2: Check current URL
    const currentUrl = window.location.href;
    console.log('🔍 Current URL:', currentUrl);
    
    // Test 3: Check if current URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    console.log('🚫 Is current URL blocked?', isBlocked);
    
    // Test 4: Test some known URLs
    const testUrls = [
      'https://instagram.com',
      'https://www.instagram.com',
      'https://youtube.com',
      'https://www.youtube.com',
      'https://linkedin.com',
      'https://www.linkedin.com'
    ];
    
    for (const testUrl of testUrls) {
      const blocked = await isUrlBlocked(testUrl);
      console.log(`🔍 ${testUrl} - Blocked: ${blocked}`);
    }
    
    return {
      blockedSites,
      currentUrl,
      isCurrentUrlBlocked: isBlocked
    };
  } catch (error) {
    console.error('❌ Error testing blocked sites:', error);
    return null;
  }
};

// Add global function to add test blocked sites
(window as any).addTestBlockedSites = async () => {
  console.log('🧪 Adding test blocked sites...');
  console.log('❌ Function not available - removed from storage.ts');
  return null;
};

// Add global function to check Supabase table
(window as any).checkSupabaseTable = async () => {
  console.log('🧪 Checking Supabase table...');
  console.log('❌ Function not available - removed from storage.ts');
  return null;
};

// Add global function to check table schema
(window as any).checkTableSchema = async () => {
  console.log('🧪 Checking table schema...');
  console.log('❌ Function not available - removed from storage.ts');
  return null;
};

// Add global function to test specific URL
(window as any).testSpecificUrl = async (url: string) => {
  console.log('🧪 Testing specific URL:', url);
  console.log('❌ Function not available - removed from storage.ts');
  return null;
};

// Add global function to manually trigger interceptor
(window as any).triggerOverlay = () => {
  console.log('🛡️ Manually triggering route interceptor...');
  initializeInterceptor();
};

// Add global function to test the full flow
(window as any).testFullFlow = async () => {
  console.log('🧪 Testing full overlay flow...');
  const currentUrl = window.location.href;
  console.log('🔍 Current URL:', currentUrl);
  
  try {
    // Test 1: Check if user has access
    const hasAccess = await hasExtensionAccess();
    console.log('🔐 User has access:', hasAccess);
    
    // Test 2: Check if URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    console.log('🚫 URL is blocked:', isBlocked);
    
    // Test 3: If blocked, trigger interceptor
    if (isBlocked) {
      console.log('🛡️ Triggering route interceptor for blocked URL...');
      await initializeRouteInterceptor();
    } else {
      console.log('✅ URL is not blocked, no interceptor needed');
    }
    
    return { hasAccess, isBlocked, currentUrl };
  } catch (error) {
    console.error('❌ Error in test flow:', error);
    return null;
  }
};

// Add global function to check if overlay exists
(window as any).checkOverlay = () => {
  const overlay = document.getElementById('intent-overlay-film');
  console.log('🎬 Overlay element exists:', !!overlay);
  if (overlay) {
    console.log('🎬 Overlay styles:', {
      display: overlay.style.display,
      visibility: overlay.style.visibility,
      opacity: overlay.style.opacity,
      zIndex: overlay.style.zIndex,
      position: overlay.style.position
    });
  }
  return overlay;
};

// Add global function to debug Chrome storage
(window as any).debugStorage = async () => {
  console.log('🔍 Debugging Chrome storage...');
  
  try {
    // Check all storage data
    const allData = await chrome.storage.local.get(null);
    console.log('📦 All Chrome storage data:', allData);
    
    // Check specific intention data
    const intentionData = await chrome.storage.local.get(['active_intention', 'accessible_sites']);
    console.log('🎯 Intention-specific data:', intentionData);
    
    // Check if there's an intention for current URL
    const { getIntention } = await import('../utils/storage');
    const intentionForUrl = await getIntention(window.location.href);
    console.log('🔍 getIntention(currentUrl) result:', intentionForUrl);
    
    return {
      allData,
      intentionData,
      intentionForUrl
    };
  } catch (error) {
    console.error('❌ Error debugging storage:', error);
    return null;
  }
};

// Add global function to test URL normalization
(window as any).testUrlNormalization = async () => {
  console.log('🧪 Testing URL normalization...');
  
  const testUrls = [
    'https://www.youtube.com/shorts/abc123',
    'http://youtube.com/watch?v=xyz',
    'https://www.instagram.com/p/123456',
    'instagram.com/stories/user',
    'https://linkedin.com/in/profile',
    'www.linkedin.com/feed/',
    'https://www.facebook.com/groups/123',
    'facebook.com/marketplace'
  ];
  
  for (const testUrl of testUrls) {
    try {
      // Test saving intention
      const { saveIntention } = await import('../utils/storage');
      await saveIntention(testUrl, `Test intention for ${testUrl}`);
      console.log(`✅ Saved intention for: ${testUrl}`);
      
      // Test retrieving intention
      const { getIntention } = await import('../utils/storage');
      const intention = await getIntention(testUrl);
      console.log(`📝 Retrieved intention for ${testUrl}:`, intention?.intention);
      
    } catch (error) {
      console.error(`❌ Error testing ${testUrl}:`, error);
    }
  }
  
  // Test cross-domain matching
  console.log('🔄 Testing cross-domain matching...');
  const { getIntention } = await import('../utils/storage');
  
  const youtubeVariations = [
    'https://www.youtube.com/shorts/abc123',
    'http://youtube.com/watch?v=xyz',
    'youtube.com/feed/trending'
  ];
  
  for (const variation of youtubeVariations) {
    const intention = await getIntention(variation);
    console.log(`🎯 ${variation} -> ${intention?.intention || 'No intention found'}`);
  }
};

// Add global function to test improved scraper
(window as any).testImprovedScraper = async () => {
  console.log('🧪 Testing Improved Scraper...');
  
  try {
    const { scrapeCurrentPage } = await import('../utils/scraper');
    const pageContent = scrapeCurrentPage();
    
    console.log('📄 Raw page title:', document.title);
    console.log('📄 Filtered page title:', pageContent.title);
    console.log('📄 Page description:', pageContent.description);
    console.log('📄 Domain:', pageContent.domain);
    console.log('📄 Relevant text length:', pageContent.relevantText.length);
    console.log('📄 First 500 chars of relevant text:', pageContent.relevantText.substring(0, 500));
    console.log('📄 Full relevant text:', pageContent.relevantText);
    
    return pageContent;
  } catch (error) {
    console.error('❌ Error testing scraper:', error);
    return null;
  }
};
