/**
 * Monitors page changes for intention matching and blocks if it doesn't match
 */

import { getWebsiteCategory } from './domainCategories';
import { getIntention } from './storage';
import { checkIntentionMatch } from './intentionMatcher'; // this actually has api call to check intent vs scraped content
// import { initializeRouteInterceptor } from './routeInterceptor';

const MONITORING_FLAG_KEY = 'intent_monitoring_active';
const NEW_INTENTION_FLAG_KEY = 'intent_new_intention_set';
// Module-level variable (outside the class)
let previousUrl: string | null = null;

export class IntentionMonitor {
  private checkInterval: number | null = null;
  private isMonitoring: boolean = false;
  private readonly CHECK_INTERVAL_MS = 3 * 1000;
  
  // Add doom scrolling tracking
  private doomScrollingData: {
    startTime: number;
    startScrollY: number;
    lastCheckTime: number;
    scrollDistance: number;
    timeSpent: number;
  } | null = null;

  // Event-based scroll tracking to handle inner scroll containers (e.g., Instagram)
  private accumulatedScrollDistancePx: number = 0;
  private lastTouchY: number | null = null;
  private scrollListenersAttached: boolean = false;
  private onWheelBound?: (e: WheelEvent) => void;
  private onTouchStartBound?: (e: TouchEvent) => void;
  private onTouchMoveBound?: (e: TouchEvent) => void;
  private wheelEventCount: number = 0;
  private touchMoveEventCount: number = 0;
  private lastCheckedAtMs: number | null = null;

  private isLinkedinHome(url: string): boolean {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      const path = u.pathname;
      if (host !== 'linkedin.com') return false;
      return path === '/' || path === '/feed/';
    } catch {
      return false;
    }
  }
  
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    sessionStorage.setItem(MONITORING_FLAG_KEY, 'true');
    console.log('🛰️ IntentionMonitor.startMonitoring', {
      url: window.location.href,
      intervalMs: this.CHECK_INTERVAL_MS,
      time: new Date().toISOString()
    });

    // Attach scroll listeners for robust distance tracking
    this.attachScrollListeners();

    // Check if this is a new intention that needs immediate validation
    const isNewIntention = sessionStorage.getItem(NEW_INTENTION_FLAG_KEY) === 'true';
    if (isNewIntention) {
      console.log('🆕 New intention detected - performing immediate check');
      sessionStorage.removeItem(NEW_INTENTION_FLAG_KEY);
      await this.performImmediateCheck();
    } else {
      const currentUrl = window.location.href;
      if (!sessionStorage.getItem('intent_last_safe_url')) {
        sessionStorage.setItem('intent_last_safe_url', currentUrl);
        console.log('💾 Stored initial safe URL on monitoring start:', currentUrl);
      }
    }

    console.log('🧭 IntentionMonitor: initial activity check');
    await this.checkCurrentActivity();

    this.checkInterval = window.setInterval(async () => {
      console.log('⏲️ IntentionMonitor: interval activity check');
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
    this.detachScrollListeners();
    console.log('🛑 IntentionMonitor.stopMonitoring', {
      url: window.location.href,
      time: new Date().toISOString()
    });
  }

  private attachScrollListeners(): void {
    if (this.scrollListenersAttached) return;
    this.onWheelBound = (e: WheelEvent) => {
      this.accumulatedScrollDistancePx += Math.abs(e.deltaY || 0);
      this.wheelEventCount += 1;
    };
    this.onTouchStartBound = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        this.lastTouchY = e.touches[0].clientY;
      }
    };
    this.onTouchMoveBound = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        if (this.lastTouchY != null) {
          this.accumulatedScrollDistancePx += Math.abs(currentY - this.lastTouchY);
        }
        this.lastTouchY = currentY;
        this.touchMoveEventCount += 1;
      }
    };
    window.addEventListener('wheel', this.onWheelBound, { passive: true } as AddEventListenerOptions);
    window.addEventListener('touchstart', this.onTouchStartBound, { passive: true } as AddEventListenerOptions);
    window.addEventListener('touchmove', this.onTouchMoveBound, { passive: true } as AddEventListenerOptions);
    this.scrollListenersAttached = true;
    console.log('🧷 IntentionMonitor: scroll listeners attached');
  }

  private detachScrollListeners(): void {
    if (!this.scrollListenersAttached) return;
    if (this.onWheelBound) window.removeEventListener('wheel', this.onWheelBound as EventListener);
    if (this.onTouchStartBound) window.removeEventListener('touchstart', this.onTouchStartBound as EventListener);
    if (this.onTouchMoveBound) window.removeEventListener('touchmove', this.onTouchMoveBound as EventListener);
    this.scrollListenersAttached = false;
    this.lastTouchY = null;
    this.accumulatedScrollDistancePx = 0;
    this.wheelEventCount = 0;
    this.touchMoveEventCount = 0;
    console.log('🧹 IntentionMonitor: scroll listeners detached');
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
      
      if (websiteCategory === 'social' || websiteCategory === 'entertainment') {
        // For social/entertainment sites, skip immediate content check; monitor doom scrolling instead
        console.log('📱 Social/Entertainment site detected - skipping immediate content check');
        sessionStorage.setItem('intent_last_safe_url', currentUrl);
        console.log('💾 Stored initial safe URL (social/entertainment):', currentUrl);
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
      const nowMs = Date.now();

      // Determine site category early for flow control
      const websiteCategory = await getWebsiteCategory(currentUrl);

      // Intention lookup (may be absent for social/entertainment where we still want to monitor)
      const intentionData = await getIntention(currentUrl);
      const hasIntention = !!(intentionData && intentionData.intention);

      // If not social/entertainment and no intention, stop monitoring
      if (!hasIntention && !(websiteCategory === 'social' || websiteCategory === 'entertainment')) {
        previousUrl = null;
        console.log('ℹ️ No intention found for URL (non-social/entertainment), stopping monitoring', { currentUrl });
        this.stopMonitoring();
        return;
      }

      // For logging insight
      console.log('🧭 IntentionMonitor.checkCurrentActivity', {
        currentUrl,
        websiteCategory,
        hasIntention,
        intentionPreview: intentionData?.intention?.slice?.(0, 160) || null,
        previousUrl,
        secondsSinceLastCheck: this.lastCheckedAtMs ? Number(((nowMs - this.lastCheckedAtMs) / 1000).toFixed(2)) : null
      });

      // Always run doom-scrolling checks for social/entertainment, with LinkedIn exception
      if (websiteCategory === 'social' || websiteCategory === 'entertainment') {
        // Custom LinkedIn rule: only consider doom scrolling on home page
        if (this.isLinkedinHome(currentUrl)) {
          await this.checkDoomScrolling();
          previousUrl = currentUrl;
          this.lastCheckedAtMs = nowMs;
          return;
        }
        // If LinkedIn but not home, run content check instead of doom scrolling
        try {
          const urlHost = new URL(currentUrl).hostname.replace(/^www\./, '').toLowerCase();
          if (urlHost === 'linkedin.com') {
            console.log('🔎 LinkedIn non-home page — using content check instead of doom-scrolling');
            if (currentUrl === previousUrl) {
              console.log('⏸️ URL unchanged on LinkedIn non-home; skipping this tick');
              return;
            }
            previousUrl = currentUrl;
            this.lastCheckedAtMs = nowMs;
            await this.checkActivity(currentUrl);
            return;
          }
        } catch {}
        // Default for other social/entertainment sites: doom scrolling
        await this.checkDoomScrolling();
        previousUrl = currentUrl;
        this.lastCheckedAtMs = nowMs;
        return;
      }

      // For non-social categories: only run content check when URL changes to avoid heavy repeated calls
      if (currentUrl === previousUrl) {
        const seconds = this.lastCheckedAtMs ? Number(((nowMs - this.lastCheckedAtMs) / 1000).toFixed(2)) : null;
        console.log('⏸️ URL unchanged since ~3s ago; skipping content check this tick', { secondsSinceLastCheck: seconds });
        return;
      }

      previousUrl = currentUrl;
      this.lastCheckedAtMs = nowMs;
      console.log('🧪 Non-social category — running content match check');
      await this.checkActivity(currentUrl);
    } catch (error) {
      console.error('❌ Error in checkCurrentActivity:', error);
      this.stopMonitoring();
    }
  }

  ///
  private async checkActivity(currentUrl: string): Promise<void> {
    try {
      console.log('🔎 checkActivity -> invoking checkIntentionMatch', { currentUrl });
      const result = await checkIntentionMatch(currentUrl);
      console.log('📊 checkActivity <- result from checkIntentionMatch', {
        currentUrl,
        match: result?.match
      });
      
      if (result.match == false){
        // User is doing something different than intended
        console.warn('🚫 Intention mismatch detected — redirecting to overlay');
        const lastSafeUrl = sessionStorage.getItem('intent_last_safe_url') || '';
        this.stopMonitoring();
        try {
          const overlayUrl = chrome.runtime.getURL('src/popup/landing.html') +
            `#/overlay-two?intentionMismatch=true&targetUrl=${encodeURIComponent(currentUrl)}` +
            (lastSafeUrl ? `&lastSafeUrl=${encodeURIComponent(lastSafeUrl)}` : '');
          console.log('🎯 Intention mismatch: redirecting to overlay', { 
            overlayUrl,
            currentMismatchedUrl: currentUrl,
            lastSafeUrl: lastSafeUrl || null
          });
          window.location.href = overlayUrl;
        } catch (e) {
          console.error('❌ Failed to redirect to overlay on mismatch', e);
        }
      } else {
        // User is still on track, keep monitoring and update safe URL
        console.log('✅ Intention matches — continuing monitoring');
        sessionStorage.setItem('intent_last_safe_url', currentUrl);
        console.log('💾 Stored safe URL:', currentUrl);
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
      console.log('📱 DoomScrolling: check start', {
        href: window.location.href,
        ts: new Date().toISOString()
      });
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
      // Poll-based distance (window)
      const pollDistance = Math.abs(scrollY - this.doomScrollingData.startScrollY);
      // Event-based distance (inner containers)
      const eventDistance = this.accumulatedScrollDistancePx;
      const scrollDistance = Math.max(pollDistance, eventDistance);
      
      // Update tracking data
      this.doomScrollingData.scrollDistance = scrollDistance;
      this.doomScrollingData.timeSpent += timeSinceLastCheck;
      this.doomScrollingData.lastCheckTime = currentTime;
      
      // Check for doom scrolling patterns — 2+ screens within 10 seconds
      const timeSpentSeconds = this.doomScrollingData.timeSpent / 1000;
      // Use a conservative screen height to avoid huge thresholds on tall viewports (e.g., reels)
      const screenHeight = Math.min(Math.max(window.innerHeight || 0, 600), 800);
      const scrollDistanceThreshold = screenHeight * 2; // 2 screens dynamically (capped)
      const fallbackDistanceThreshold = 1200; // px
      const wheelCountThreshold = 24; // events within window
      const timeThresholdSeconds = 10; // evaluate within a 10s window
      console.log('🧪 DoomScrolling metrics', {
        timeSpentSeconds: Number(timeSpentSeconds.toFixed(2)),
        pollDistance,
        eventDistance,
        effectiveDistance: scrollDistance,
        screenHeight,
        wheelEventCount: this.wheelEventCount,
        touchMoveEventCount: this.touchMoveEventCount,
        thresholds: { scrollDistanceThreshold, fallbackDistanceThreshold, wheelCountThreshold, timeThresholdSeconds }
      });

      // Trigger if user scrolled 2+ screens within the last 10 seconds
      const distanceTrigger = scrollDistance >= scrollDistanceThreshold;
      // Fallback triggers: absolute distance or high-frequency wheel events within window
      const fallbackTrigger = scrollDistance >= fallbackDistanceThreshold || this.wheelEventCount >= wheelCountThreshold;

      if ((distanceTrigger || fallbackTrigger) && timeSpentSeconds <= timeThresholdSeconds) {
        console.warn('🛑 DoomScrolling: threshold exceeded — triggering overlay', {
          reason: distanceTrigger ? 'distance>=2screens' : (this.wheelEventCount >= wheelCountThreshold ? 'wheelCount' : 'fallbackDistance'),
        });
        try {
          const lastSafeUrl = sessionStorage.getItem('intent_last_safe_url') || '';
          const overlayUrl = chrome.runtime.getURL('src/popup/landing.html') + 
            `#/overlay-two?intentionMismatch=true&targetUrl=${encodeURIComponent(window.location.href)}` +
            (lastSafeUrl ? `&lastSafeUrl=${encodeURIComponent(lastSafeUrl)}` : '');
          console.log('🎯 DoomScrolling: redirecting to mismatch overlay', { overlayUrl, lastSafeUrl: lastSafeUrl || null });
          window.location.href = overlayUrl;
        } catch (e) {
          console.error('❌ DoomScrolling: failed to redirect to overlay', e);
        }
        // Reset tracking data after triggering
        this.doomScrollingData = null;
        this.accumulatedScrollDistancePx = 0;
        this.wheelEventCount = 0;
        this.touchMoveEventCount = 0;
        return;
      }

      // If we've exceeded the 10s window without triggering, reset the window
      if (timeSpentSeconds > timeThresholdSeconds) {
        console.log('🔄 DoomScrolling: window expired (>10s), resetting counters');
        this.doomScrollingData = {
          startTime: currentTime,
          startScrollY: scrollY,
          lastCheckTime: currentTime,
          scrollDistance: 0,
          timeSpent: 0
        };
        this.accumulatedScrollDistancePx = 0;
        this.wheelEventCount = 0;
        this.touchMoveEventCount = 0;
      }
      
    } catch (error) {
      console.error('❌ Error in doom scrolling check:', error);
      // Don't stop monitoring for doom scrolling errors
    }
  }
  
  // private async triggerDoomScrollingIntervention(): Promise<void> { // unused helper kept for future
  //   const overlayUrl = chrome.runtime.getURL('src/popup/landing.html') + 
  //     `#/overlay?doomScrolling=true&targetUrl=${encodeURIComponent(window.location.href)}`;
  //   window.location.href = overlayUrl;
  // }

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