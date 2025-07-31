import { getActiveIntention, clearActiveIntention } from './intentionManager';
import { checkIntentionMatch } from './intentionMatcher';
import { initializeRouteInterceptor } from './routeInterceptor';

/**
 * Monitor user's browsing activity and check if it matches their intention
 * This runs in the background after user sets an intention
 */
export class IntentionMonitor {
  private checkInterval: number | null = null;
  private isMonitoring: boolean = false;
  
  // Check every 10 seconds while user is browsing
  private readonly CHECK_INTERVAL_MS = 10 * 1000;
  
  /**
   * Start monitoring the user's activity
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    console.log('🔍 Starting intention monitoring');
    this.isMonitoring = true;

    // Check immediately
    await this.checkCurrentActivity();

    // Set up periodic checking
    this.checkInterval = window.setInterval(async () => {
      await this.checkCurrentActivity();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔍 Stopped intention monitoring');
  }

  /**
   * Check if current activity matches the user's intention
   */
  private async checkCurrentActivity(): Promise<void> {
    try {
      // Get active intention
      const activeIntention = await getActiveIntention();
      if (!activeIntention) {
        // No active intention, stop monitoring
        this.stopMonitoring();
        return;
      }

      // Check if we're still on the same domain
      const currentUrl = window.location.href;
      const currentDomain = new URL(currentUrl).hostname.replace(/^www\./, '');
      
      if (currentDomain !== activeIntention.domain) {
        // User navigated to different domain, stop monitoring
        this.stopMonitoring();
        return;
      }

      // Use AI to check if current page content matches intention
      const result = await checkIntentionMatch(currentUrl);
      
      console.log('🎯 Intention match result:', {
        matches: result.matches,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      // If intention doesn't match, show interceptor again
      if (!result.matches) {
        console.log('❌ Intention mismatch detected, re-intercepting page');
        
        // Clear the active intention
        await clearActiveIntention();
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Re-initialize route interceptor to block access
        await initializeRouteInterceptor();
      } else {
        console.log('✅ Activity matches intention, continuing monitoring');
      }

    } catch (error) {
      console.error('❌ Error checking intention match:', error);
      // On error, continue monitoring rather than blocking user
    }
  }

  /**
   * Check if monitoring is currently active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Global monitor instance
let globalMonitor: IntentionMonitor | null = null;

/**
 * Start intention monitoring for the current page
 */
export const startIntentionMonitoring = async (): Promise<void> => {
  // Stop any existing monitoring
  if (globalMonitor) {
    globalMonitor.stopMonitoring();
  }

  // Create new monitor and start
  globalMonitor = new IntentionMonitor();
  await globalMonitor.startMonitoring();
};

/**
 * Stop intention monitoring
 */
export const stopIntentionMonitoring = (): void => {
  if (globalMonitor) {
    globalMonitor.stopMonitoring();
    globalMonitor = null;
  }
};

/**
 * Check if intention monitoring is currently active
 */
export const isIntentionMonitoringActive = (): boolean => {
  return globalMonitor?.isActive() || false;
};