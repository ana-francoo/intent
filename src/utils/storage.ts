import { supabase } from '../supabaseClient';
import { ENTERTAINMENT_SITES, SOCIAL_SITES, SHOPPING_SITES, NEWS_SITES } from './categoryPresets';

// Constants for intention expiration
const INTENTION_EXPIRY_HOURS = 8;
const INTENTION_EXPIRY_MS = INTENTION_EXPIRY_HOURS * 60 * 60 * 1000; // 8 hours in milliseconds

// Helper function to check if chrome.storage is available
export const isStorageAvailable = () => {
  try {
    // Check if we're in a valid extension context
    if (typeof chrome === 'undefined') {
      return false;
    }
    
    // Check if chrome.storage exists
    if (!chrome.storage || !chrome.storage.local) {
      return false;
    }
    
    // Check if chrome.runtime exists - but don't require runtime.id in content scripts
    // Content scripts can access storage even without runtime.id
    if (!chrome.runtime) {
      return false;
    }
    
    // In content scripts, runtime.id might not be available but storage still works
    // So we'll try a simple test instead
    return true;
  } catch (error) {
    // Don't log warnings for extension context invalidation in development
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      return false;
    }
    console.warn('Extension context error in isStorageAvailable:', error);
    return false;
  }
};

// Helper function to normalize URL to domain for robust matching
export const normalizeUrlToDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix and return just the hostname
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    // If URL parsing fails, try to extract domain manually
    const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)/);
    if (domainMatch) {
      return domainMatch[1];
    }
    // Fallback to original URL if all else fails
    return url;
  }
};

export interface IntentionData {
  intention: string;
  timestamp: number;
  expiresAt: number;
}

export const saveIntention = async (url: string, intentionText: string) => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    throw new Error('Chrome storage is not available');
  }

  try {
    // Normalize URL to domain for robust storage
    const normalizedUrl = normalizeUrlToDomain(url);

    const now = Date.now();
    const expiresAt = now + INTENTION_EXPIRY_MS;
    
    const data = {
      [normalizedUrl]: {
        intention: intentionText,
        timestamp: now,
        expiresAt: expiresAt
      }
    };
    await chrome.storage.local.set(data);
    
    // Set flag to indicate intention was just set (for immediate checking)
    const domain = normalizeUrlToDomain(url);
    sessionStorage.setItem('intent_just_set', JSON.stringify({
      domain: domain,
      timestamp: now
    }));
    
    console.log('💾 Intention saved and marked for immediate checking');
  } catch (error) {
    // Handle extension context invalidation specifically
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('Extension context invalidated - intention not saved');
      throw new Error('Extension context invalidated');
    }
    if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
      console.warn('Chrome storage not available - intention not saved');
      throw new Error('Chrome storage not available');
    }
    throw error;
  }
};

export const getIntention = async (url: string): Promise<IntentionData | null> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return null;
  }

  try {
    // Normalize URL to domain for robust retrieval
    const normalizedUrl = normalizeUrlToDomain(url);

    const result = await chrome.storage.local.get(normalizedUrl);
    const intentionData = result[normalizedUrl] as IntentionData | undefined;
    
    if (!intentionData) {
      return null;
    }
    
    // Check if intention has expired
    const now = Date.now();
    if (intentionData.expiresAt && now > intentionData.expiresAt) {
      await chrome.storage.local.remove(normalizedUrl);
      return null;
    }
    
    return intentionData;
  } catch (error) {
    // Handle extension context invalidation specifically
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('Extension context invalidated - intention not retrieved');
      return null;
    }
    if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
      console.warn('Chrome storage not available - intention not retrieved');
      return null;
    }
    console.error('Error getting intention:', error);
    return null;
  }
};

/**
 * Clean up expired intentions from storage
 * This function can be called periodically to remove expired intentions
 */
export const cleanupExpiredIntentions = async () => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return 0;
  }

  try {
    const allData = await chrome.storage.local.get(null);
    const now = Date.now();
    const urlsToRemove: string[] = [];
    
    for (const [url, data] of Object.entries(allData)) {
      const intentionData = data as IntentionData;
      
      // Check if this is an intention entry (has intention property)
      if (intentionData.intention && intentionData.expiresAt) {
        if (now > intentionData.expiresAt) {
          urlsToRemove.push(url);
        }
      }
    }
    
    if (urlsToRemove.length > 0) {
      await chrome.storage.local.remove(urlsToRemove);

    }
    
    return urlsToRemove.length;
  } catch (error) {
    // Handle extension context invalidation specifically
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('Extension context invalidated - storage cleanup skipped');
      return 0;
    }
    if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
      console.warn('Chrome storage not available - storage cleanup skipped');
      return 0;
    }
    console.error('Error cleaning up expired intentions:', error);
    return 0;
  }
};

/**
 * Get all active (non-expired) intentions
 */
export const getAllActiveIntentions = async (): Promise<Record<string, IntentionData>> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return {};
  }

  try {
    const allData = await chrome.storage.local.get(null);
    const now = Date.now();
    const activeIntentions: Record<string, IntentionData> = {};
    
    for (const [url, data] of Object.entries(allData)) {
      const intentionData = data as IntentionData;
      
      // Check if this is an intention entry and not expired
      if (intentionData.intention && intentionData.expiresAt && now <= intentionData.expiresAt) {
        activeIntentions[url] = intentionData;
      }
    }
    
    return activeIntentions;
  } catch (error) {
    console.error('Error getting active intentions:', error);
    return {};
  }
};

/**
 * Get intention with remaining time information
 */
export const getIntentionWithTimeRemaining = async (url: string): Promise<{
  intention: string;
  timeRemaining: number; // in milliseconds
  expiresAt: Date;
} | null> => {
  const intentionData = await getIntention(url);
  
  if (!intentionData) {
    return null;
  }
  
  const now = Date.now();
  const timeRemaining = intentionData.expiresAt - now;
  
  return {
    intention: intentionData.intention,
    timeRemaining: Math.max(0, timeRemaining),
    expiresAt: new Date(intentionData.expiresAt)
  };
};

/**
 * Debug utility to get storage information
 */
export const getStorageDebugInfo = async () => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return null;
  }

  try {
    const allData = await chrome.storage.local.get(null);
    const now = Date.now();
    const intentionEntries: Array<{
      url: string;
      intention: string;
      timestamp: Date;
      expiresAt: Date;
      isExpired: boolean;
      timeRemaining: number;
    }> = [];
    
    let totalEntries = 0;
    let expiredCount = 0;
    let activeCount = 0;
    
    for (const [url, data] of Object.entries(allData)) {
      totalEntries++;
      const intentionData = data as IntentionData;
      
      if (intentionData.intention && intentionData.expiresAt) {
        const isExpired = now > intentionData.expiresAt;
        const timeRemaining = Math.max(0, intentionData.expiresAt - now);
        
        if (isExpired) {
          expiredCount++;
        } else {
          activeCount++;
        }
        
        intentionEntries.push({
          url,
          intention: intentionData.intention,
          timestamp: new Date(intentionData.timestamp),
          expiresAt: new Date(intentionData.expiresAt),
          isExpired,
          timeRemaining
        });
      }
    }
    
    return {
      totalEntries,
      intentionEntries: intentionEntries.length,
      expiredCount,
      activeCount,
      intentions: intentionEntries.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
    };
  } catch (error) {
    console.error('Error getting storage debug info:', error);
    return null;
  }
};

export const saveBlockedSites = async (urls: string[]) => {
  try {
    
    // Get the current session (less intrusive than getUser)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      // In development, this is expected - just log and continue
      if (sessionError.message.includes('Auth session missing')) {
        return null;
      }
      throw new Error('Session error: ' + sessionError.message);
    }
    
    if (!session?.user) {
      return null;
    }
    
    const user = session.user;
    
    // First, let's check what's currently in the database for this user
    const { data: existingData, error: fetchError } = await supabase
      .from('blocked_sites')
      .select('url')
      .eq('user_id', user.id);
    
    if (fetchError) {
      console.error('❌ Error fetching existing blocked sites:', fetchError);
      throw fetchError;
    }
    
    const existingUrls = existingData?.map(item => item.url) || [];
    
    // Filter out URLs that already exist for this user
    const newUrls = urls.filter(url => !existingUrls.includes(url));
    
    if (newUrls.length === 0) {
      return existingData;
    }
    
    const { data, error } = await supabase
      .from('blocked_sites')
      .insert(
        newUrls.map(url => ({ 
          url,
          user_id: user.id 
        }))
      );
    
    if (error) {
      console.error('❌ Error saving blocked sites:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to save blocked sites:', error);
    // In development, don't throw the error - just log it
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return null;
    }
    throw error;
  }
};


export const getBlockedSites = async () => {
  try {
    
    // Get the current session (less intrusive than getUser)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      // In development, this is expected - just log and continue
      if (sessionError.message.includes('Auth session missing')) {
        // DEVELOPMENT: Return test blocked sites for development
        const testBlockedSites = [
          'https://instagram.com',
          'https://www.instagram.com',
          'https://youtube.com',
          'https://www.youtube.com',
          'https://linkedin.com',
          'https://www.linkedin.com',
          'https://facebook.com',
          'https://www.facebook.com',
          'https://twitter.com',
          'https://www.twitter.com',
          'https://x.com',
          'https://www.x.com',
          'https://tiktok.com',
          'https://www.tiktok.com'
        ];
        console.log('🧪 DEVELOPMENT: Using test blocked sites:', testBlockedSites);
        return testBlockedSites;
      }
      throw new Error('Session error: ' + sessionError.message);
    }
    
    if (!session?.user) {
      console.log('ℹ️ No authenticated user - this is normal in development');
      // DEVELOPMENT: Return test blocked sites for development
      const testBlockedSites = [
        'https://instagram.com',
        'https://www.instagram.com',
        'https://youtube.com',
        'https://www.youtube.com',
        'https://facebook.com',
        'https://www.facebook.com',
        'https://twitter.com',
        'https://www.twitter.com',
        'https://tiktok.com',
        'https://www.tiktok.com'
      ];
      console.log('🧪 DEVELOPMENT: Using test blocked sites:', testBlockedSites);
      return testBlockedSites;
    }
    
    const user = session.user;
    console.log('👤 Fetching blocked sites for user:', user.id);
    
    const { data, error } = await supabase
      .from('blocked_sites')
      .select('url')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Error fetching blocked sites:', error);
      // In development, return test sites instead of empty array
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('ℹ️ Development mode - using test blocked sites');
        const testBlockedSites = [
          'https://instagram.com',
          'https://www.instagram.com',
          'https://youtube.com',
          'https://www.youtube.com',
          'https://facebook.com',
          'https://www.facebook.com',
          'https://twitter.com',
          'https://www.twitter.com',
          'https://tiktok.com',
          'https://www.tiktok.com'
        ];
        console.log('🧪 DEVELOPMENT: Using test blocked sites:', testBlockedSites);
        return testBlockedSites;
      }
      throw error;
    }
    
    const urls = data?.map(item => item.url) || [];
    console.log('✅ Successfully fetched blocked sites for user:', urls);
    return urls;
  } catch (error) {
    console.error('❌ Failed to fetch blocked sites:', error);
    // In development, return test sites instead of empty array
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('ℹ️ Development mode - using test blocked sites');
      const testBlockedSites = [
        'https://instagram.com',
        'https://www.instagram.com',
        'https://youtube.com',
        'https://www.youtube.com',
        'https://facebook.com',
        'https://www.facebook.com',
        'https://twitter.com',
        'https://www.twitter.com',
        'https://tiktok.com',
        'https://www.tiktok.com'
      ];
      console.log('🧪 DEVELOPMENT: Using test blocked sites:', testBlockedSites);
      return testBlockedSites;
    }
    return [];
  }
};
  
  export const isUrlBlocked = async (currentUrl: string) => {
    try {
      console.log('🔍 Checking if URL is blocked:', currentUrl);
      // Hard block: YouTube Shorts should always be treated as blocked
      try {
        const urlObj = new URL(currentUrl);
        const host = urlObj.hostname.toLowerCase();
        const path = urlObj.pathname.toLowerCase();
        const isYouTubeDomain = host.endsWith('youtube.com') || host === 'm.youtube.com' || host === 'www.youtube.com';
        const isShortsPath = /(^|\/)shorts(\/|$)/.test(path);
        if (isYouTubeDomain && isShortsPath) {
          console.log('⛔ isUrlBlocked: YouTube Shorts detected — always blocked');
          return true;
        }
      } catch (e) {
        // Ignore URL parse errors and continue with regular checks
      }
      // New logic: default-blocked via category presets, with user overrides to UNBLOCK
      // 1) Build default-blocked domain list from presets
      let defaultBlockedDomains: string[] = [];
      try {
        defaultBlockedDomains = [
          ...ENTERTAINMENT_SITES,
          ...SOCIAL_SITES,
          ...SHOPPING_SITES,
          ...NEWS_SITES
        ]
          .filter(Boolean)
          .map(d => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''));
      } catch {}

      const currentDomain = new URL(currentUrl).hostname.replace(/^www\./, '').toLowerCase();
      const isDefaultBlocked = defaultBlockedDomains.some(domain => currentDomain === domain || currentDomain.endsWith(`.${domain}`));

      // 2) Fetch user's unblocked overrides
      const userOverrides = await getBlockedSites();
      console.log('📋 User unblocked overrides (from blocked_sites table):', userOverrides);
      const unblockedDomains = (userOverrides || [])
        .map(url => {
          try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
        })
        .filter(Boolean) as string[];

      const isExplicitlyUnblocked = unblockedDomains.some(domain => currentDomain === domain || currentDomain.endsWith(`.${domain}`));

      // 3) Final decision: blocked by default unless explicitly unblocked
      const finalBlocked = isDefaultBlocked && !isExplicitlyUnblocked;
      if (isDefaultBlocked) {
        console.log('📚 Default-blocked category match', { currentDomain, isExplicitlyUnblocked, finalBlocked });
      }
      if (isExplicitlyUnblocked) {
        console.log('✅ User override: domain explicitly unblocked', { currentDomain });
      }
      if (isDefaultBlocked || isExplicitlyUnblocked) {
        console.log(`🔍 URL ${currentUrl} is ${finalBlocked ? 'BLOCKED' : 'NOT BLOCKED'} (default+override logic)`);
        return finalBlocked;
      }

      // 4) If not in defaults and no overrides, treat as not blocked
      console.log(`🔍 URL ${currentUrl} is NOT BLOCKED (no default match and no override)`);
      return false;
    } catch (error) {
      console.error('❌ Error checking if URL is blocked:', error);
      return false;
    }
  };

/**
 * Remove one or more blocked sites for the current user
 */
export const deleteBlockedSites = async (urls: string[]) => {
  try {
    // Get the current session (less intrusive than getUser)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      if (sessionError.message.includes('Auth session missing')) return null;
      throw new Error('Session error: ' + sessionError.message);
    }
    if (!session?.user) return null;
    const user = session.user;

    // Delete matching rows for this user
    const { error } = await supabase
      .from('blocked_sites')
      .delete()
      .eq('user_id', user.id)
      .in('url', urls);

    if (error) {
      console.error('❌ Error deleting blocked sites:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to delete blocked sites:', error);
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return null;
    }
    throw error;
  }
};

  


