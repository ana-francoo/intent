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

      const result = await checkIntentionMatch(currentUrl);
      
      console.log('🎯 Intention match result:', {
        matches: result.matches,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      if (!result.matches) {
        console.log('❌ Intention mismatch detected, re-intercepting page');
        this.stopMonitoring();
        await initializeRouteInterceptor();
      } else {
        console.log('✅ Activity matches intention, continuing monitoring');
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