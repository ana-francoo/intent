import { getIntention, normalizeUrlToDomain, isUrlBlocked } from './storage';
import { shouldCheckIntentionForUrl } from './urlHandlers';
import { hasExtensionAccess } from './subscription';


export const initializeRouteInterceptor = async (): Promise<void> => {
  try {
    const currentUrl = window.location.href;
    console.log('🛡️ Route interceptor checking URL:', currentUrl);

    // Don't intercept extension pages
    if (currentUrl.startsWith('chrome-extension://') || 
        currentUrl.startsWith('moz-extension://') ||
        currentUrl.startsWith('chrome://') ||
        currentUrl.startsWith('about:')) {
      console.log('✅ Extension or browser page, skipping interception');
      return;
    }

    // Check if chrome storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.log('❌ Chrome storage not available, skipping interception');
      return;
    }

    // Check if user has access to extension features
    const hasAccess = await hasExtensionAccess();
    if (!hasAccess) {
      console.log('❌ User access expired, skipping interception');
      return;
    }

    // Check if URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    if (!isBlocked) {
      console.log('✅ URL not blocked, allowing normal loading');
      return;
    }

    // Check custom URL handling rules
    const urlHandlerResult = shouldCheckIntentionForUrl(currentUrl);
    if (!urlHandlerResult.shouldCheckIntention) {
      console.log('✅ Custom handler allows access:', urlHandlerResult.reason);
      return;
    }

    // Check if there's an existing intention for this URL
    const intentionData = await getIntention(currentUrl);
    console.log('🔍 Intention check result:', intentionData);
    
    if (intentionData && intentionData.intention) {
      console.log('✅ Existing intention found, allowing access and starting monitoring');
      
      // Start AI monitoring for existing intention
      const { startIntentionMonitoring } = await import('./intentionMonitor');
      await startIntentionMonitoring();
      
      return;
    }

    // Check if we just set an intention (to prevent infinite loop)
    const justSetIntention = sessionStorage.getItem('intent_just_set');
    if (justSetIntention) {
      const intentionData = JSON.parse(justSetIntention);
      const domain = normalizeUrlToDomain(currentUrl);
      
      // If we just set an intention for this domain and it's less than 10 seconds old
      if (intentionData.domain === domain && (Date.now() - intentionData.timestamp) < 10000) {
        console.log('✅ Just set intention for this domain, allowing access');
        return;
      } else if ((Date.now() - intentionData.timestamp) >= 10000) {
        // Clean up expired flag
        sessionStorage.removeItem('intent_just_set');
      }
    }

    // Redirect to extension overlay page with the target URL
    console.log('🛡️ Redirecting to extension overlay page');
    const extensionOverlayUrl = chrome.runtime.getURL('src/popup/index.html') + `#/overlay?targetUrl=${encodeURIComponent(currentUrl)}`;
    window.location.href = extensionOverlayUrl;

  } catch (error) {
    console.error('❌ Error in route interceptor:', error);
  }
};