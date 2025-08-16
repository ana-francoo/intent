import { getIntention, normalizeUrlToDomain, isUrlBlocked } from './storage';
// import { shouldCheckIntentionForUrl } from './urlHandlers';
import { hasExtensionAccess } from './subscription';
import { checkExistingSession } from './auth';
import { markNewIntentionSet } from './intentionMonitor';

export const initializeRouteInterceptor = async (): Promise<void> => {
  try {
    const currentUrl = window.location.href;
    console.log('🚦 RouteInterceptor.start', { currentUrl });

    // Track previous/current URLs to aid back-navigation from overlay
    try {
      const prevTracked = sessionStorage.getItem('intent_current_url');
      if (prevTracked) {
        sessionStorage.setItem('intent_prev_url', prevTracked);
      }
      sessionStorage.setItem('intent_current_url', currentUrl);
    } catch {}

    // Don't intercept extension pages
    if (currentUrl.startsWith('chrome-extension://') || 
        currentUrl.startsWith('moz-extension://') ||
        currentUrl.startsWith('chrome://') ||
        currentUrl.startsWith('about:')) {
      return;
    }

    // Check if chrome storage is available
    const hasStorage = !(typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local);
    if (!hasStorage) {
      console.log('🛑 RouteInterceptor: chrome.storage not available, aborting');
      return;
    }

    // Ensure Supabase session is restored in this page context before access check
    try {
      await checkExistingSession();
    } catch {}

    // Check if user has access to extension features (trial/active)
    const hasAccess = await hasExtensionAccess();
    console.log('🔐 RouteInterceptor: hasExtensionAccess', { hasAccess });
    if (!hasAccess) {
      console.log('🚫 RouteInterceptor: No access — skipping interception');
      return;
    }

    // Check if URL is blocked
    const isBlocked = await isUrlBlocked(currentUrl);
    console.log('🧱 RouteInterceptor: isUrlBlocked', { isBlocked, url: currentUrl });
    if (!isBlocked) {
      console.log('✅ RouteInterceptor: URL not blocked — no action');
      try { sessionStorage.setItem('intent_last_safe_url', currentUrl); } catch {}
      return;
    }

    // Special case: YouTube homepage should not be blocked if an intention already exists
    try {
      const urlObj = new URL(currentUrl);
      const host = urlObj.hostname.replace(/^www\./, '').toLowerCase();
      const path = urlObj.pathname;
      const isYouTubeHome = (host === 'youtube.com' || host === 'm.youtube.com') && (path === '/' || path === '/feed/');
      if (isYouTubeHome) {
        const ytIntention = await getIntention(currentUrl);
        if (ytIntention && ytIntention.intention) {
          console.log('📺 RouteInterceptor: YouTube home with existing intention — skipping overlay');
          try { sessionStorage.setItem('intent_last_safe_url', currentUrl); } catch {}
          return;
        }
      }
    } catch {}

    // For blocked sites, always proceed to intention prompt/monitoring
    // even if custom URL handlers would normally skip checks (e.g., social feeds)
    // const urlHandlerResult = shouldCheckIntentionForUrl(currentUrl);
    // console.log('🎯 RouteInterceptor: URL handler result', urlHandlerResult);
    
    // if (!urlHandlerResult.shouldCheckIntention) {
    //   console.log('✅ RouteInterceptor: URL handler says no intention needed', { 
    //     reason: urlHandlerResult.reason 
    //   });
    //   return; // Allow access without intention prompt
    // }
    // Check if there's an existing intention for this URL
    const intentionData = await getIntention(currentUrl);
    console.log('🧠 RouteInterceptor: intention lookup', {
      hasIntention: !!(intentionData && intentionData.intention),
      intentionPreview: intentionData?.intention?.slice?.(0, 120) || null
    });
    
    if (intentionData && intentionData.intention) {
      console.log('📡 RouteInterceptor: intention exists — starting monitoring');
      try { sessionStorage.setItem('intent_last_safe_url', currentUrl); } catch {}
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
        console.log('⏱️ RouteInterceptor: recent intention set detected — marking for immediate monitoring');
        // Mark for immediate checking since this is a new intention
        markNewIntentionSet();
        return;
      } else if ((Date.now() - intentionData.timestamp) >= 10000) {
        // Clean up expired flag
        console.log('🧹 RouteInterceptor: clearing expired intent_just_set flag');
        sessionStorage.removeItem('intent_just_set');
      }
    }

    // Redirect to extension overlay page with the target URL
    // Use the standard overlay for setting/refining intention
    const extensionOverlayUrl = chrome.runtime.getURL('src/popup/index.html') + `#/overlay?targetUrl=${encodeURIComponent(currentUrl)}`;
    console.log('🎯 RouteInterceptor: prompting overlay', { extensionOverlayUrl });
    try { sessionStorage.setItem('intent_last_blocked_url', currentUrl); } catch {}
    window.location.href = extensionOverlayUrl;

  } catch (error) {
    console.error('❌ Error in route interceptor:', error);
  }
};