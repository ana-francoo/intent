/**
 * Monitors page changes for intention matching and blocks if it doesn't match
 */





import { getIntention } from './storage';
import { checkIntentionMatch } from './intentionMatcher'; // this actually has api call to check intent vs scraped content
import { initializeRouteInterceptor } from './routeInterceptor';

const MONITORING_FLAG_KEY = 'intent_monitoring_active';
// Module-level variable (outside the class)
let previousUrl: string | null = null;

export class IntentionMonitor {
  private checkInterval: number | null = null;
  private isMonitoring: boolean = false;
  private readonly CHECK_INTERVAL_MS = 10 * 1000;
  
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

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
  }

  private async checkCurrentActivity(): Promise<void> {
    try {
      const currentUrl = window.location.href;
      
      const intentionData = await getIntention(currentUrl);
      if (!intentionData || !intentionData.intention) {
        previousUrl = null;
        this.stopMonitoring();
        return;
      }
      console.log('🔍 Previous URL:', previousUrl);
      console.log('🔍 URLs match?', currentUrl === previousUrl);
      
      if (currentUrl === previousUrl){
        // User is still on the same page, no need to re-analyze
        console.log('🔍 Same URL detected, stopping monitoring');
        this.stopMonitoring();
        return;
      }
      
      previousUrl = currentUrl;
      
      const result = await checkIntentionMatch(currentUrl);
      
      if (result.matches == false){
        // User is doing something different than intended
        console.log('🔍 Intention mismatch, stopping monitoring');
        this.stopMonitoring();
        await initializeRouteInterceptor();  // Redirect to overlay to set new intention
      }else{
        // User is still on track, keep monitoring
        console.log('🔍 Intention matches, continuing monitoring');
      }
      console.log('🔍 checkCurrentActivity completed successfully');
    } catch (error) {
      // Enhanced error handling for different types of failures
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      console.error('❌ Error in checkCurrentActivity:', {
        error: errorMessage,
        type: errorName,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });

      // Handle specific error types - ALL errors should stop monitoring to prevent weird states
      if (errorName === 'NetworkError' || errorMessage.includes('fetch')) {
        console.error('🌐 Network error detected - stopping monitoring to prevent infinite loops');
        this.stopMonitoring();
        return;
      }
      
      if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
        console.error('⏰ AI analysis timeout - stopping monitoring to prevent infinite loops');
        this.stopMonitoring();
        return;
      }
      
      if (errorMessage.includes('API') || errorMessage.includes('OpenRouter')) {
        console.error('🤖 AI service error - stopping monitoring to prevent cost escalation');
        this.stopMonitoring();
        return;
      }
      
      if (errorMessage.includes('storage') || errorMessage.includes('chrome.storage')) {
        console.error('💾 Storage error - stopping monitoring');
        this.stopMonitoring();
        return;
      }
      
      this.stopMonitoring();
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