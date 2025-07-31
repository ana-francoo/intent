import { checkIntentionStatus } from './intentionManager';
import { showReactIntentionOverlay, showReactConflictOverlay } from './reactOverlayManager';
import { isUrlBlocked } from './storage';

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

    console.log(`URL ${url} is blocked, checking intention status`);

    // Check intention status
    const status = await checkIntentionStatus(url);
    
    switch (status.action) {
      case 'allow':
        console.log(`Allowing access to ${status.domain} with active intention`);
        // No overlay needed, user can browse freely
        break;
        
      case 'show_overlay':
        console.log(`Showing intention overlay for ${status.domain}`);
        showReactIntentionOverlay(url);
        break;
        
      case 'show_conflict':
        console.log(`Showing conflict overlay for ${status.domain} (active: ${status.activeIntention?.domain})`);
        if (status.activeIntention) {
          showReactConflictOverlay(status.domain, status.activeIntention);
        }
        break;
        
      default:
        console.warn('Unknown action:', status.action);
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

    const status = await checkIntentionStatus(url);
    return status.action === 'allow';
  } catch (error) {
    console.error('Error checking page access:', error);
    return false; // Default to blocking on error
  }
};