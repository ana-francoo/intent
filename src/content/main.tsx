import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { saveIntention, getIntention, isUrlBlocked, cleanupExpiredIntentions, getBlockedSites } from '../utils/storage'
import { injectOverlay, injectIntentionMismatchOverlay } from '../utils/overlay'
import { shouldCheckIntentionForUrl } from '../utils/urlHandlers'
import { hasExtensionAccess } from '../utils/subscription'

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
document.body.appendChild(container)
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Single consolidated function for checking intention and triggering appropriate overlay
const checkIntentionAndTriggerOverlay = async (currentUrl: string) => {
  try {
    console.log('🎬 Starting intention check for URL:', currentUrl);
    
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.error('❌ Chrome storage is not available, skipping intention check');
      return;
    }
    
    // Check if user has access to extension features
    const hasAccess = await hasExtensionAccess();
    console.log('🔐 User has access:', hasAccess);
    if (!hasAccess) {
      console.log('❌ User access expired, skipping intention check');
      // Still allow basic browsing but no intention features
      return;
    }
    
    // Check if the URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    console.log('🚫 URL blocked status:', isBlocked);
  
    // Only proceed if the URL is blocked
    if (isBlocked) {
      // Check custom URL handling rules
      const urlHandlerResult = shouldCheckIntentionForUrl(currentUrl);
      console.log('🔗 URL handler result:', urlHandlerResult);
      
      // If custom handler says not to check intention, allow access
      if (!urlHandlerResult.shouldCheckIntention) {
        console.log('✅ Custom handler allows access:', urlHandlerResult.reason);
        return;
      }

      // Get/pull/extract the most recent intention statement associated to that url
      const intentionData = await getIntention(currentUrl);
      
      // If intention statement associated to that url exists
      if (intentionData && intentionData.intention) {
        console.log('📝 Intention found:', intentionData.intention);
        
        // Call the intentionMatcher function and capture the value of whether the alignment of intention is true or false
        const { checkIntentionMatch } = await import('../utils/intentionMatcher');
        console.log('🔍 Calling checkIntentionMatch with URL:', currentUrl);
        console.log('🔍 Calling checkIntentionMatch with intention:', intentionData.intention);
        
        const result = await checkIntentionMatch(currentUrl);
        console.log('🎯 Intention match result:', result);
        console.log('🎯 Intention matches (boolean):', result.matches);
        console.log('🎯 Confidence score:', result.confidence);
        console.log('🎯 Reasoning:', result.reasoning);
        console.log('🎯 User intention:', result.userIntention);
        console.log('🎯 Scraped page content:', result.pageContent);
        console.log('🎯 Timestamp:', result.timestamp);
        
        // If intention statement matched returns false
        if (!result.matches) {
          console.log('❌ Intention mismatch detected, showing overlay #2');
          // Prompt overlay film #2
          injectIntentionMismatchOverlay();
          return;
        } else {
          console.log('✅ Intention matches, no overlay needed');
        }
      } else {
        console.log('📝 No intention found, showing overlay #1');
        // Else (intention statement doesn't exist yet)
        // Prompt appearance of overlay #1
        injectOverlay();
        return;
      }
    } else {
      // URL is not blocked, no overlay needed
    }
  } catch (error) {
    console.error('❌ Error checking intention and triggering overlay:', error);
  }
};

// Check for blocked URLs when page loads
checkIntentionAndTriggerOverlay(window.location.href);

// Listen for URL changes (for single-page applications)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Add a small delay to ensure the page has fully loaded
    setTimeout(() => {
      checkIntentionAndTriggerOverlay(currentUrl);
    }, 100);
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

// Add global function to manually trigger overlay
(window as any).triggerOverlay = () => {
  console.log('🎬 Manually triggering overlay...');
  injectOverlay();
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
    
    // Test 3: If blocked, trigger overlay
    if (isBlocked) {
      console.log('🎬 Triggering overlay for blocked URL...');
      injectOverlay();
    } else {
      console.log('✅ URL is not blocked, no overlay needed');
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
