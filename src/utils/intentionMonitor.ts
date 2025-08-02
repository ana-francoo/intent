/**
 * Monitors page changes for intention matching and blocks if it doesn't match
 */





import { getIntention } from './storage';
import { checkIntentionMatch } from './intentionMatcher'; // this actually has api call to check intent vs scraped content
import { initializeRouteInterceptor } from './routeInterceptor';

const MONITORING_FLAG_KEY = 'intent_monitoring_active';

export class IntentionMonitor {
  private checkInterval: number | null = null;
  private isMonitoring: boolean = false;
  private previousUrl: string | null = null;  // Add this line
  private readonly CHECK_INTERVAL_MS = 10 * 1000;
  
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    console.log('🔍 Starting AI-powered intention monitoring');
    this.isMonitoring = true;
    sessionStorage.setItem(MONITORING_FLAG_KEY, 'true');

    await this.checkCurrentActivity();

    this.checkInterval = window.setInterval(async () => {
      await this.checkCurrentActivity();
    }, this.CHECK_INTERVAL_MS);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    sessionStorage.removeItem(MONITORING_FLAG_KEY);
    console.log('🔍 Stopped intention monitoring');
  }

  private async checkCurrentActivity(): Promise<void> {
    try {
      const currentUrl = window.location.href;
      
      const intentionData = await getIntention(currentUrl);
      if (!intentionData || !intentionData.intention) {
        console.log('🔍 No intention found for current URL, stopping monitoring');
        this.stopMonitoring();
        return;
      }

      console.log('🔍 Found intention for URL:', intentionData.intention);

      // 4. [KEY CHANGE] Check if URL has changed since last check
      if (currentUrl == this.previousUrl){
        // User is still on the same page, no need to re-analyze
        this.stopMonitoring();
        return;
      }
      // 5. URL has changed - proceed with existing logic
      const result = await checkIntentionMatch(currentUrl);
      // This does:
      //   - Scrapes the current page content
      //   - Sends intention + page content to AI
      //   - AI decides if they match (returns confidence score)
      
      // 6. Check if AI says the page matches user's intention
      if (result.matches == false){
        // User is doing something different than intended
        this.stopMonitoring();
        await initializeRouteInterceptor();  // Redirect to overlay to set new intention
      }else{
        // User is still on track, keep monitoring
        this.previousUrl = currentUrl;  // Update for next check
      }
    } catch (error) {
      console.error('❌ Error checking intention match:', error);
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}

let globalMonitor: IntentionMonitor | null = null;

export const startIntentionMonitoring = async (): Promise<void> => {
  const shouldMonitor = sessionStorage.getItem(MONITORING_FLAG_KEY) === 'true';
  
  if (!shouldMonitor) {
    if (globalMonitor) {
      globalMonitor.stopMonitoring();
      globalMonitor = null;
    }
    return;
  }

  if (globalMonitor) {
    globalMonitor.stopMonitoring();
  }

  globalMonitor = new IntentionMonitor();
  await globalMonitor.startMonitoring();
};

export const stopIntentionMonitoring = (): void => {
  if (globalMonitor) {
    globalMonitor.stopMonitoring();
    globalMonitor = null;
  }
};

export const isIntentionMonitoringActive = (): boolean => {
  return globalMonitor?.isActive() || false;
};