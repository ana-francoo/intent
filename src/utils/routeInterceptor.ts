import { getIntention, normalizeUrlToDomain, isUrlBlocked } from './storage';
import { shouldCheckIntentionForUrl } from './urlHandlers';
import { hasExtensionAccess } from './subscription';


export const initializeRouteInterceptor = async (): Promise<void> => {
  try {
    const currentUrl = window.location.href;

    // Don't intercept extension pages
    if (currentUrl.startsWith('chrome-extension://') || 
        currentUrl.startsWith('moz-extension://') ||
        currentUrl.startsWith('chrome://') ||
        currentUrl.startsWith('about:')) {
      return;
    }

    // Check if chrome storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return;
    }

    // Check if user has access to extension features
    const hasAccess = await hasExtensionAccess();
    if (!hasAccess) {
      return;
    }

    // Check if URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    if (!isBlocked) {
      return;
    }

    // Check custom URL handling rules
    const urlHandlerResult = shouldCheckIntentionForUrl(currentUrl);
    if (!urlHandlerResult.shouldCheckIntention) {
      return;
    }

    // Check if there's an existing intention for this URL
    const intentionData = await getIntention(currentUrl);
    
    if (intentionData && intentionData.intention) {
      
      sessionStorage.setItem('intent_monitoring_active', 'true');
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
        return;
      } else if ((Date.now() - intentionData.timestamp) >= 10000) {
        // Clean up expired flag
        sessionStorage.removeItem('intent_just_set');
      }
    }

    // Redirect to extension overlay page with the target URL
    const extensionOverlayUrl = chrome.runtime.getURL('src/popup/index.html') + `#/overlay?targetUrl=${encodeURIComponent(currentUrl)}`;
    window.location.href = extensionOverlayUrl;

  } catch (error) {
    console.error('❌ Error in route interceptor:', error);
  }
};