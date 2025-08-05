/**
 * Monitors page changes for intention matching and blocks if it doesn't match
 */

import { getWebsiteCategory } from './domainCategories';
import { getIntention } from './storage';
import { checkIntentionMatch } from './intentionMatcher'; // this actually has api call to check intent vs scraped content
import { initializeRouteInterceptor } from './routeInterceptor';

const MONITORING_FLAG_KEY = 'intent_monitoring_active';
const NEW_INTENTION_FLAG_KEY = 'intent_new_intention_set';
// Module-level variable (outside the class)
let previousUrl: string | null = null;

export class IntentionMonitor {
  private checkInterval: number | null = null;
  private isMonitoring: boolean = false;
  private readonly CHECK_INTERVAL_MS = 10 * 1000;
  
  // Add doom scrolling tracking
  private doomScrollingData: {
    startTime: number;
    startScrollY: number;
    lastCheckTime: number;
    scrollDistance: number;
    timeSpent: number;
  } | null = null;
  
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    sessionStorage.setItem(MONITORING_FLAG_KEY, 'true');

    // Check if this is a new intention that needs immediate validation
    const isNewIntention = sessionStorage.getItem(NEW_INTENTION_FLAG_KEY) === 'true';
    if (isNewIntention) {
      console.log('🆕 New intention detected - performing immediate check');
      sessionStorage.removeItem(NEW_INTENTION_FLAG_KEY);
      await this.performImmediateCheck();
    }

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

  // New method for immediate check after intention is set
  private async performImmediateCheck(): Promise<void> {
    try {
      console.log('🔍 Performing immediate intention check...');
      const currentUrl = window.location.href;
      
      // Get the intention that was just set
      const intentionData = await getIntention(currentUrl);
      if (!intentionData || !intentionData.intention) {
        console.log('❌ No intention found for immediate check');
        return;
      }

      // Determine which type of check to perform based on website category
      const websiteCategory = await getWebsiteCategory(currentUrl);
      
      if (websiteCategory === 'social') {
        // For social sites, we don't do immediate content check since content might not be loaded yet
        console.log('📱 Social site detected - skipping immediate content check');
        return;
      } else {
        // For non-social sites, perform immediate content check
        await this.checkActivity(currentUrl);
      }
    } catch (error) {
      console.error('❌ Error in immediate intention check:', error);
      // Don't stop monitoring for immediate check errors
    }
  }

  //////////////////////////////
  private async checkCurrentActivity(): Promise<void> {
    try {
      const currentUrl = window.location.href;

      //apply doom scrolling check depending on website s. Actually it sokay, because if there isnt an intention set for this url, the call will return false
      const intentionData = await getIntention(currentUrl); 

      //if there isnt an intention set for this url, stop monitoring
      if (!intentionData || !intentionData.intention) {
        previousUrl = null;
        this.stopMonitoring();
        return;
      }

      if (currentUrl === previousUrl){
        this.stopMonitoring();
        return;
      }

      
      previousUrl = currentUrl;

      //
      //call either checkIntentionmatch or checkDoomScrolling depending on website
      //
      const websiteCategory = await getWebsiteCategory(currentUrl);
      if (websiteCategory === 'social'){
        await this.checkDoomScrolling();
      }else{
        await this.checkActivity(currentUrl);
      }
    } catch (error) {
      console.error('❌ Error in checkCurrentActivity:', error);
      this.stopMonitoring();
    }
  }

  ///
  private async checkActivity(currentUrl: string): Promise<void> {
    try {
      const result = await checkIntentionMatch(currentUrl);
      
      if (result.match == false){
        // User is doing something different than intended
        console.log('Intention mismatch, stopping monitoring');
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

  private async checkDoomScrolling(): Promise<void> {
    try {
  // Get scroll position and time spent
      const scrollY = window.scrollY;
      const currentTime = Date.now();
      
      // Initialize doom scrolling tracking if not exists
      if (!this.doomScrollingData) {
        this.doomScrollingData = {
          startTime: currentTime,
          startScrollY: scrollY,
          lastCheckTime: currentTime,
          scrollDistance: 0,
          timeSpent: 0
        };
      }
      
      // Calculate metrics
      const timeSinceLastCheck = currentTime - this.doomScrollingData.lastCheckTime;
      const scrollDistance = Math.abs(scrollY - this.doomScrollingData.startScrollY);
      
      // Update tracking data
      this.doomScrollingData.scrollDistance = scrollDistance;
      this.doomScrollingData.timeSpent += timeSinceLastCheck;
      this.doomScrollingData.lastCheckTime = currentTime;
      
      // Check for doom scrolling patterns
      const timeSpentMinutes = this.doomScrollingData.timeSpent / (1000 * 60);
      const scrollDistanceThreshold = 5000; // 5 screens worth of scrolling
      const timeThreshold = 10; // 10 minutes
      
      if (scrollDistance > scrollDistanceThreshold && timeSpentMinutes > timeThreshold) {

        await initializeRouteInterceptor();
        
        // Reset tracking data
        this.doomScrollingData = null;
      }
      
    } catch (error) {
      console.error('❌ Error in doom scrolling check:', error);
      // Don't stop monitoring for doom scrolling errors
    }
  }
  
  private async triggerDoomScrollingIntervention(): Promise<void> { //use if you make custom overlay for doom scroling
    // Redirect to intention overlay with doom scrolling message
    const overlayUrl = chrome.runtime.getURL('src/popup/index.html') + 
      `#/overlay?doomScrolling=true&targetUrl=${encodeURIComponent(window.location.href)}`;
    window.location.href = overlayUrl;
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

// New function to mark that a new intention was set
export const markNewIntentionSet = (): void => {
  sessionStorage.setItem(NEW_INTENTION_FLAG_KEY, 'true');
  console.log('🏷️ Marked new intention as set - will perform immediate check');
};