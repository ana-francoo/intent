import { getIntention, isUrlBlocked } from './storage';
import { showReactIntentionOverlay } from './reactOverlayManager';

/**
 * Main controller that decides what to do when a page loads
 */
export const handlePageLoad = async (url: string): Promise<void> => {
  try {
    // First check if this URL is blocked
    const isBlocked = await isUrlBlocked(url);
    if (!isBlocked) {
      console.log(`URL ${url} is not blocked, allowing access`);
      return;
    }

    console.log(`URL ${url} is blocked, checking for existing intention`);

    // Check if there's already an intention for this URL
    const intentionData = await getIntention(url);
    
    if (intentionData && intentionData.intention) {
      console.log(`Found existing intention for ${url}, allowing access`);
      // No overlay needed, user can browse freely
      return;
    } else {
      console.log(`No intention found for ${url}, showing overlay`);
      showReactIntentionOverlay(url);
    }
  } catch (error) {
    console.error('Error in handlePageLoad:', error);
    // Fallback to showing intention overlay
    showReactIntentionOverlay(url);
  }
};

/**
 * Force show intention overlay (for testing or manual triggers)
 */
export const forceShowIntentionOverlay = (url: string): void => {
  showReactIntentionOverlay(url);
};

/**
 * Check if user should have access to current page
 */
export const checkPageAccess = async (url: string): Promise<boolean> => {
  try {
    const isBlocked = await isUrlBlocked(url);
    if (!isBlocked) {
      return true; // Not a blocked site, allow access
    }

    // Check if there's an intention for this URL
    const intentionData = await getIntention(url);
    return !!(intentionData && intentionData.intention);
  } catch (error) {
    console.error('Error checking page access:', error);
    return false; // Default to blocking on error
  }
};