import { supabase } from '../supabaseClient';

// Constants for intention expiration
const INTENTION_EXPIRY_HOURS = 8;
const INTENTION_EXPIRY_MS = INTENTION_EXPIRY_HOURS * 60 * 60 * 1000; // 8 hours in milliseconds

// Helper function to check if chrome.storage is available
const isStorageAvailable = () => {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.storage && 
           chrome.storage.local &&
           chrome.runtime && 
           chrome.runtime.id; // Check if extension context is valid
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
const normalizeUrlToDomain = (url: string): string => {
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
    
    console.log(`Intention saved for ${normalizedUrl} (original: ${url}), expires at ${new Date(expiresAt).toLocaleString()}`);
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
      console.log(`Intention for ${normalizedUrl} has expired, removing from storage`);
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
      console.log(`Cleaned up ${urlsToRemove.length} expired intentions`);
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
    console.log('💾 Saving blocked sites:', urls);
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Authentication error:', userError);
      // In development, this is expected - just log and continue
      if (userError.message.includes('Auth session missing')) {
        console.log('ℹ️ No active session - this is normal in development');
        return null;
      }
      throw new Error('Authentication error: ' + userError.message);
    }
    
    if (!user) {
      console.log('ℹ️ No authenticated user - this is normal in development');
      return null;
    }
    
    console.log('👤 Authenticated user:', user.id);
    
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
    console.log('📋 Existing blocked sites for user:', existingUrls);
    
    // Filter out URLs that already exist for this user
    const newUrls = urls.filter(url => !existingUrls.includes(url));
    console.log('🆕 New URLs to add:', newUrls);
    
    if (newUrls.length === 0) {
      console.log('ℹ️ No new URLs to add');
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
    
    console.log('✅ Successfully saved blocked sites:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to save blocked sites:', error);
    // In development, don't throw the error - just log it
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('ℹ️ Development mode - continuing without saving to database');
      return null;
    }
    throw error;
  }
};


export const getBlockedSites = async () => {
  try {
    console.log('📋 Fetching blocked sites for authenticated user...');
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Authentication error:', userError);
      // In development, this is expected - just log and continue
      if (userError.message.includes('Auth session missing')) {
        console.log('ℹ️ No active session - this is normal in development');
        return [];
      }
      throw new Error('Authentication error: ' + userError.message);
    }
    
    if (!user) {
      console.log('ℹ️ No authenticated user - this is normal in development');
      return [];
    }
    
    console.log('👤 Fetching blocked sites for user:', user.id);
    
    const { data, error } = await supabase
      .from('blocked_sites')
      .select('url')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Error fetching blocked sites:', error);
      // In development, return empty array instead of throwing
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('ℹ️ Development mode - returning empty blocked sites list');
        return [];
      }
      throw error;
    }
    
    const urls = data?.map(item => item.url) || [];
    console.log('✅ Successfully fetched blocked sites for user:', urls);
    return urls;
  } catch (error) {
    console.error('❌ Failed to fetch blocked sites:', error);
    // In development, return empty array instead of throwing
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('ℹ️ Development mode - returning empty blocked sites list');
      return [];
    }
    return [];
  }
};
  
  export const isUrlBlocked = async (currentUrl: string) => {
    try {
      const blockedSites = await getBlockedSites();
      
      // Check if current URL matches any blocked site
      return blockedSites.some(blockedUrl => {
        // Convert URLs to domain for comparison
        const currentDomain = new URL(currentUrl).hostname;
        const blockedDomain = new URL(blockedUrl).hostname;
        
        return currentDomain === blockedDomain || currentUrl.includes(blockedDomain);
      });
    } catch (error) {
      console.error('Error checking if URL is blocked:', error);
      return false;
    }
  };

  


