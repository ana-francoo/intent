import { normalizeUrlToDomain, isStorageAvailable } from './storage';

// Timer duration for intentions (30 seconds for testing)
const INTENTION_TIMER_MS = 30 * 1000; // 30 seconds

export interface ActiveIntention {
  domain: string;
  intention: string;
  startTime: number;
  expiresAt: number;
}

export interface AccessibleSites {
  [domain: string]: boolean;
}

/**
 * Get the currently active intention (only one can be active at a time)
 */
export const getActiveIntention = async (): Promise<ActiveIntention | null> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return null;
  }

  try {
    const result = await chrome.storage.local.get('active_intention');
    const activeIntention = result.active_intention as ActiveIntention | undefined;
    
    if (!activeIntention) {
      return null;
    }
    
    // Check if intention has expired
    const now = Date.now();
    if (now > activeIntention.expiresAt) {
      console.log(`Active intention for ${activeIntention.domain} has expired, clearing`);
      await clearActiveIntention();
      return null;
    }
    
    return activeIntention;
  } catch (error) {
    console.error('Error getting active intention:', error);
    return null;
  }
};

/**
 * Set a new active intention (clears any existing one)
 */
export const setActiveIntention = async (domain: string, intention: string): Promise<void> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    throw new Error('Chrome storage is not available');
  }

  try {
    const now = Date.now();
    const expiresAt = now + INTENTION_TIMER_MS;
    
    const activeIntention: ActiveIntention = {
      domain,
      intention,
      startTime: now,
      expiresAt
    };
    
    // Clear any existing accessible sites and set new one
    const accessibleSites: AccessibleSites = { [domain]: true };
    
    await chrome.storage.local.set({
      active_intention: activeIntention,
      accessible_sites: accessibleSites
    });
    
    console.log(`Active intention set for ${domain}: "${intention}" (expires in ${INTENTION_TIMER_MS/1000}s)`);
    
    // Set up timer to clear intention when it expires
    setTimeout(async () => {
      const current = await getActiveIntention();
      if (current && current.startTime === activeIntention.startTime) {
        console.log(`Timer expired for intention on ${domain}`);
        await clearActiveIntention();
      }
    }, INTENTION_TIMER_MS);
    
  } catch (error) {
    console.error('Error setting active intention:', error);
    throw error;
  }
};

/**
 * Clear the active intention and all accessible sites
 */
export const clearActiveIntention = async (): Promise<void> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return;
  }

  try {
    await chrome.storage.local.remove(['active_intention', 'accessible_sites']);
    console.log('Active intention and accessible sites cleared');
  } catch (error) {
    console.error('Error clearing active intention:', error);
  }
};

/**
 * Check if a domain is currently accessible
 */
export const isDomainAccessible = async (domain: string): Promise<boolean> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return false;
  }

  try {
    const result = await chrome.storage.local.get('accessible_sites');
    const accessibleSites = result.accessible_sites as AccessibleSites | undefined;
    
    if (!accessibleSites) {
      return false;
    }
    
    return accessibleSites[domain] === true;
  } catch (error) {
    console.error('Error checking domain accessibility:', error);
    return false;
  }
};

/**
 * Get all currently accessible sites
 */
export const getAccessibleSites = async (): Promise<AccessibleSites> => {
  if (!isStorageAvailable()) {
    console.error('Chrome storage is not available');
    return {};
  }

  try {
    const result = await chrome.storage.local.get('accessible_sites');
    return result.accessible_sites as AccessibleSites || {};
  } catch (error) {
    console.error('Error getting accessible sites:', error);
    return {};
  }
};

/**
 * Check what should happen when visiting a URL
 */
export const checkIntentionStatus = async (url: string): Promise<{
  action: 'allow' | 'show_overlay' | 'show_conflict';
  activeIntention?: ActiveIntention;
  domain: string;
}> => {
  const domain = normalizeUrlToDomain(url);
  const activeIntention = await getActiveIntention();
  
  // No active intention - show overlay to set one
  if (!activeIntention) {
    return { action: 'show_overlay', domain };
  }
  
  // Same domain as active intention - allow access
  if (activeIntention.domain === domain) {
    return { action: 'allow', activeIntention, domain };
  }
  
  // Different domain with active intention - show conflict overlay
  return { action: 'show_conflict', activeIntention, domain };
};

/**
 * Get time remaining for active intention
 */
export const getTimeRemaining = async (): Promise<number> => {
  const activeIntention = await getActiveIntention();
  if (!activeIntention) {
    return 0;
  }
  
  const now = Date.now();
  return Math.max(0, activeIntention.expiresAt - now);
};

/**
 * Extend the current intention timer (for AI matching success)
 */
export const extendIntentionTimer = async (additionalMs: number = INTENTION_TIMER_MS): Promise<void> => {
  const activeIntention = await getActiveIntention();
  if (!activeIntention) {
    return;
  }
  
  const newExpiresAt = activeIntention.expiresAt + additionalMs;
  const updatedIntention: ActiveIntention = {
    ...activeIntention,
    expiresAt: newExpiresAt
  };
  
  await chrome.storage.local.set({ active_intention: updatedIntention });
  console.log(`Intention timer extended by ${additionalMs/1000}s for ${activeIntention.domain}`);
};

// Helper function to normalize URL to domain (re-export from storage)
export { normalizeUrlToDomain };