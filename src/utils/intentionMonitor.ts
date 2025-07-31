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
  private startTime: number = 0;
  
  // Check every 30 seconds while user is browsing (less aggressive)
  private readonly CHECK_INTERVAL_MS = 30 * 1000;
  // Grace period after redirect before starting strict checking (60 seconds)
  private readonly GRACE_PERIOD_MS = 60 * 1000;
  
  /**
   * Start monitoring the user's activity
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    console.log('🔍 Starting intention monitoring with grace period');
    this.isMonitoring = true;
    this.startTime = Date.now();

    // Don't check immediately - give user time to settle on the page
    // Set up periodic checking after the grace period
    setTimeout(() => {
      if (this.isMonitoring) {
        this.checkInterval = window.setInterval(async () => {
          await this.checkCurrentActivity();
        }, this.CHECK_INTERVAL_MS);
      }
    }, this.GRACE_PERIOD_MS);
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

      // Check if we're still in grace period
      const timeSinceStart = Date.now() - this.startTime;
      if (timeSinceStart < this.GRACE_PERIOD_MS) {
        console.log(`🕐 Still in grace period (${Math.round((this.GRACE_PERIOD_MS - timeSinceStart) / 1000)}s remaining), skipping check`);
        return;
      }

      // Use AI to check if current page content matches intention
      const result = await checkIntentionMatch(currentUrl);
      
      console.log('🎯 Intention match result:', {
        matches: result.matches,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      // Only clear intention if we have very low confidence and user has been browsing for a while
      if (!result.matches && result.confidence < 0.1 && timeSinceStart > (5 * 60 * 1000)) { // 5 minutes
        console.log('❌ Persistent intention mismatch detected after 5 minutes, re-intercepting page');
        
        // Clear the active intention
        await clearActiveIntention();
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Re-initialize route interceptor to block access
        await initializeRouteInterceptor();
      } else {
        console.log('✅ Activity acceptable or not enough time elapsed, continuing monitoring');
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