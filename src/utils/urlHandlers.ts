// Custom URL handling logic for different websites
// This allows us to implement site-specific behavior for intention checking

export interface UrlHandlerResult {
  shouldCheckIntention: boolean;
  reason: string;
  customData?: any;
}

export interface UrlHandler {
  pattern: RegExp;
  handler: (url: string) => UrlHandlerResult;
  name: string;
}

/**
 * YouTube handler - allow homepage, check intentions only after search
 */
const youtubeHandler: UrlHandler = {
  pattern: /^https?:\/\/(www\.)?youtube\.com/,
  handler: (url: string): UrlHandlerResult => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Always allow homepage
    if (path === '/' || path === '/feed/') {
      return {
        shouldCheckIntention: false,
        reason: 'YouTube homepage - allowing access without intention check'
      };
    }
    
    // Allow trending, subscriptions, library pages
    if (['/trending', '/subscriptions', '/library', '/history', '/playlists'].includes(path)) {
      return {
        shouldCheckIntention: false,
        reason: `YouTube ${path} - allowing access without intention check`
      };
    }
    
    // Check intentions for search results
    if (path === '/results' || path === '/search') {
      return {
        shouldCheckIntention: true,
        reason: 'YouTube search results - checking intention alignment',
        customData: {
          searchQuery: searchParams.get('search_query') || 'unknown',
          type: 'search_results'
        }
      };
    }
    
    // Check intentions for video pages
    if (path === '/watch') {
      return {
        shouldCheckIntention: true,
        reason: 'YouTube video page - checking intention alignment',
        customData: {
          videoId: searchParams.get('v') || 'unknown',
          type: 'video_page'
        }
      };
    }
    
    // Check intentions for channel pages
    if (path.startsWith('/@') || path.startsWith('/channel/') || path.startsWith('/c/')) {
      return {
        shouldCheckIntention: true,
        reason: 'YouTube channel page - checking intention alignment',
        customData: {
          channelPath: path,
          type: 'channel_page'
        }
      };
    }
    
    // Default: check intentions for other pages
    return {
      shouldCheckIntention: true,
      reason: 'YouTube other page - checking intention alignment'
    };
  },
  name: 'YouTube'
};

/**
 * Instagram handler - check intentions for all pages
 */
const instagramHandler: UrlHandler = {
  pattern: /^https?:\/\/(www\.)?instagram\.com/,
  handler: (url: string): UrlHandlerResult => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Check intentions for all Instagram pages
    return {
      shouldCheckIntention: true,
      reason: 'Instagram page - checking intention alignment',
      customData: {
        path: path,
        type: 'instagram_page'
      }
    };
  },
  name: 'Instagram'
};

/**
 * LinkedIn handler - allow feed, check intentions for other pages
 */
const linkedinHandler: UrlHandler = {
  pattern: /^https?:\/\/(www\.)?linkedin\.com/,
  handler: (url: string): UrlHandlerResult => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Allow main feed
    if (path === '/' || path === '/feed/') {
      return {
        shouldCheckIntention: false,
        reason: 'LinkedIn feed - allowing access without intention check'
      };
    }
    
    // Allow messages
    if (path === '/messaging/') {
      return {
        shouldCheckIntention: false,
        reason: 'LinkedIn messaging - allowing access without intention check'
      };
    }
    
    // Check intentions for search
    if (path === '/search/') {
      return {
        shouldCheckIntention: true,
        reason: 'LinkedIn search - checking intention alignment',
        customData: {
          type: 'search_page'
        }
      };
    }
    
    // Check intentions for job pages
    if (path.includes('/jobs/')) {
      return {
        shouldCheckIntention: true,
        reason: 'LinkedIn jobs - checking intention alignment',
        customData: {
          type: 'jobs_page'
        }
      };
    }
    
    // Default: check intentions for other pages
    return {
      shouldCheckIntention: true,
      reason: 'LinkedIn other page - checking intention alignment'
    };
  },
  name: 'LinkedIn'
};

/**
 * Facebook handler - allow feed, check intentions for other pages
 */
const facebookHandler: UrlHandler = {
  pattern: /^https?:\/\/(www\.)?facebook\.com/,
  handler: (url: string): UrlHandlerResult => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Allow main feed
    if (path === '/' || path === '/home.php') {
      return {
        shouldCheckIntention: false,
        reason: 'Facebook feed - allowing access without intention check'
      };
    }
    
    // Allow messages
    if (path === '/messages/') {
      return {
        shouldCheckIntention: false,
        reason: 'Facebook messages - allowing access without intention check'
      };
    }
    
    // Check intentions for marketplace
    if (path.includes('/marketplace/')) {
      return {
        shouldCheckIntention: true,
        reason: 'Facebook marketplace - checking intention alignment',
        customData: {
          type: 'marketplace'
        }
      };
    }
    
    // Check intentions for groups
    if (path.includes('/groups/')) {
      return {
        shouldCheckIntention: true,
        reason: 'Facebook groups - checking intention alignment',
        customData: {
          type: 'groups'
        }
      };
    }
    
    // Default: check intentions for other pages
    return {
      shouldCheckIntention: true,
      reason: 'Facebook other page - checking intention alignment'
    };
  },
  name: 'Facebook'
};

/**
 * Twitter/X handler - allow timeline, check intentions for other pages
 */
const twitterHandler: UrlHandler = {
  pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)/,
  handler: (url: string): UrlHandlerResult => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Allow main timeline
    if (path === '/' || path === '/home') {
      return {
        shouldCheckIntention: false,
        reason: 'Twitter timeline - allowing access without intention check'
      };
    }
    
    // Allow messages
    if (path === '/messages/') {
      return {
        shouldCheckIntention: false,
        reason: 'Twitter messages - allowing access without intention check'
      };
    }
    
    // Check intentions for explore/trending
    if (path === '/explore' || path === '/trending') {
      return {
        shouldCheckIntention: true,
        reason: 'Twitter explore - checking intention alignment',
        customData: {
          type: 'explore_page'
        }
      };
    }
    
    // Check intentions for search
    if (path === '/search') {
      return {
        shouldCheckIntention: true,
        reason: 'Twitter search - checking intention alignment',
        customData: {
          type: 'search_page'
        }
      };
    }
    
    // Default: check intentions for other pages
    return {
      shouldCheckIntention: true,
      reason: 'Twitter other page - checking intention alignment'
    };
  },
  name: 'Twitter'
};

// Array of all URL handlers
const urlHandlers: UrlHandler[] = [
  youtubeHandler,
  instagramHandler,
  linkedinHandler,
  facebookHandler,
  twitterHandler
];

/**
 * Get the appropriate handler for a given URL
 */
export const getUrlHandler = (url: string): UrlHandler | null => {
  return urlHandlers.find(handler => handler.pattern.test(url)) || null;
};

/**
 * Check if intention should be verified for a given URL
 */
export const shouldCheckIntentionForUrl = (url: string): UrlHandlerResult => {
  const handler = getUrlHandler(url);
  
  if (!handler) {
    // Default behavior for unhandled URLs
    return {
      shouldCheckIntention: true,
      reason: 'No custom handler - using default intention check'
    };
  }
  
  return handler.handler(url);
};

/**
 * Get debug information about URL handling
 */
export const getUrlHandlerDebugInfo = (url: string) => {
  const handler = getUrlHandler(url);
  const result = shouldCheckIntentionForUrl(url);
  
  return {
    url,
    hasCustomHandler: !!handler,
    handlerName: handler?.name || 'None',
    shouldCheckIntention: result.shouldCheckIntention,
    reason: result.reason,
    customData: result.customData
  };
}; 