import { getIntention, saveIntention, normalizeUrlToDomain, isUrlBlocked } from './storage';
import { shouldCheckIntentionForUrl } from './urlHandlers';
import { hasExtensionAccess } from './subscription';

/**
 * Route interceptor that replaces page content entirely
 * This prevents users from bypassing the intention system
 */
export class RouteInterceptor {
  private originalUrl: string;

  constructor() {
    this.originalUrl = window.location.href;
  }

  /**
   * Check if current page should be intercepted and replace content if needed
   */
  async intercept(): Promise<void> {
    try {
      console.log('🛡️ Route interceptor checking URL:', this.originalUrl);

      // Don't intercept extension pages
      if (this.originalUrl.startsWith('chrome-extension://') || 
          this.originalUrl.startsWith('moz-extension://') ||
          this.originalUrl.startsWith('chrome://') ||
          this.originalUrl.startsWith('about:')) {
        console.log('✅ Extension or browser page, skipping interception');
        return;
      }

      // Check if chrome storage is available
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        console.log('❌ Chrome storage not available, skipping interception');
        return;
      }

      // Check if user has access to extension features
      const hasAccess = await hasExtensionAccess();
      if (!hasAccess) {
        console.log('❌ User access expired, skipping interception');
        return;
      }

      // Check if URL is blocked
      const isBlocked = await isUrlBlocked(this.originalUrl);
      if (!isBlocked) {
        console.log('✅ URL not blocked, allowing normal loading');
        return;
      }

      // Check custom URL handling rules
      const urlHandlerResult = shouldCheckIntentionForUrl(this.originalUrl);
      if (!urlHandlerResult.shouldCheckIntention) {
        console.log('✅ Custom handler allows access:', urlHandlerResult.reason);
        return;
      }

      // Check if there's an existing intention for this URL
      const intentionData = await getIntention(this.originalUrl);
      console.log('🔍 Intention check result:', intentionData);
      
      if (intentionData && intentionData.intention) {
        console.log('✅ Existing intention found, allowing access and starting monitoring');
        
        // Start AI monitoring for existing intention
        const { startIntentionMonitoring } = await import('./intentionMonitor');
        await startIntentionMonitoring();
        
        return;
      }

      // Check if we just set an intention (to prevent infinite loop)
      const justSetIntention = sessionStorage.getItem('intent_just_set');
      if (justSetIntention) {
        const intentionData = JSON.parse(justSetIntention);
        const domain = normalizeUrlToDomain(this.originalUrl);
        
        // If we just set an intention for this domain and it's less than 10 seconds old
        if (intentionData.domain === domain && (Date.now() - intentionData.timestamp) < 10000) {
          console.log('✅ Just set intention for this domain, allowing access');
          // Don't remove the flag here - let it expire naturally or be cleaned up later
          return;
        } else if ((Date.now() - intentionData.timestamp) >= 10000) {
          // Clean up expired flag
          sessionStorage.removeItem('intent_just_set');
        }
      }

      // Stop the page from loading and replace content
      this.replacePageContent();

    } catch (error) {
      console.error('❌ Error in route interceptor:', error);
    }
  }

  /**
   * Replace the entire page content with intention interface
   */
  private replacePageContent(): void {
    console.log('🛡️ Intercepting page and replacing content');
    
    // Stop any ongoing page loading
    if (window.stop) {
      window.stop();
    }

    // Store reference to chrome object before replacing document
    const chromeRef = window.chrome;

    // Store reference to content script container before replacing document
    const contentScriptContainer = document.getElementById('crxjs-app');

    // Clear the entire document and replace with our interface
    document.documentElement.innerHTML = this.generateIntentionPageHTML();

    // Restore chrome object reference
    if (chromeRef && !window.chrome) {
      (window as any).chrome = chromeRef;
    }

    // Restore content script container if it existed
    if (contentScriptContainer) {
      document.body.appendChild(contentScriptContainer);
    }

    // Add simple error suppression for other extensions
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      // Suppress common extension conflict errors
      const message = args.join(' ');
      if (message.includes('Cannot read properties of null') && 
          message.includes('chrome-extension://')) {
        return; // Suppress this error
      }
      originalConsoleError.apply(console, args);
    };

    // Initialize the intention interface
    this.initializeIntentionInterface();
  }

  /**
   * Generate the full HTML for the intention page
   */
  private generateIntentionPageHTML(): string {
    const domain = normalizeUrlToDomain(this.originalUrl);
    const websiteName = domain.charAt(0).toUpperCase() + domain.slice(1);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Your Intention - ${websiteName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: #000000;
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* Pearl Mist Background with Top Glow */
        .background-glow {
            position: absolute;
            inset: 0;
            z-index: 0;
            background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(226, 232, 240, 0.15), transparent 70%), #000000;
        }

        .intention-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 500px;
            width: 90%;
            text-align: center;
            opacity: 1;
            transform: translateY(0);
            position: relative;
            z-index: 10;
        }

        @keyframes slideInUp {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        .candle-container {
            margin-bottom: 40px;
            position: relative;
            opacity: 0;
            transform: translateY(20px);
            animation: slideInUp 0.6s ease-out forwards;
        }

        .candle-circle {
            width: 120px;
            height: 120px;
            border: 2px solid #d97706;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            position: relative;
            background: rgba(217, 119, 6, 0.1);
            overflow: hidden;
        }

        .candle-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            opacity: 0.9;
            display: block;
        }

        .question {
            font-size: 24px;
            font-weight: 500;
            margin-bottom: 32px;
            line-height: 1.4;
            color: #f8fafc;
            opacity: 0;
            transform: translateY(20px);
            animation: slideInUp 0.6s ease-out 0.2s forwards;
        }

        .intention-input {
            width: 100%;
            padding: 16px 20px;
            font-size: 16px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 12px;
            background: transparent;
            color: #f8fafc;
            font-family: inherit;
            resize: none;
            outline: none;
            min-height: 60px;
            max-height: 120px;
            overflow-y: auto;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
            animation: slideInUp 0.6s ease-out 0.4s forwards;
        }

        .intention-input:focus {
            border-color: rgba(148, 163, 184, 0.4);
            background: rgba(15, 23, 42, 0.3);
            box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.1);
        }

        .intention-input::placeholder {
            color: rgba(148, 163, 184, 0.6);
        }

        .submit-hint {
            margin-top: 16px;
            font-size: 14px;
            color: rgba(148, 163, 184, 0.9);
            opacity: 0;
            transform: translateY(20px);
            animation: slideInUp 0.6s ease-out 0.6s forwards;
        }

        /* Flame animation styles */
        .flame-container {
            display: none;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            transform: translateY(20px);
        }

        .flame-container.show {
            display: flex;
            animation: slideInUp 0.6s ease-out forwards;
        }

        .flame-with-logo {
            position: relative;
            width: 150px;
            height: 200px;
            margin: 0 auto 40px;
        }

        .flame-logo-base {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 120px;
            height: 120px;
            object-fit: contain;
            opacity: 0.8;
            z-index: 1;
        }

        .flame-holder {
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 200px;
            z-index: 2;
        }

        .flame-wrapper {
            position: absolute;
            left: 50%;
            transform: translateX(-50%) scaleY(0.6) scaleX(0.7);
            bottom: 55%;
        }

        .flame-body {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 300px;
            border-radius: 50px / 40px;
        }

        .flame {
            width: 30px;
            height: 90px;
            left: 50%;
            transform-origin: 50% 100%;
            transform: translateX(-50%);
            bottom: 100%;
            border-radius: 50% 50% 20% 20%;
            background: linear-gradient(white 80%, transparent);
            opacity: 0;
            position: absolute;
            animation: sparkFlame 0.3s ease-in forwards 0s,
                       moveFlame 3s linear infinite 1s, 
                       enlargeFlame 5s ease-out infinite 1s;
        }

        .flame:before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50% 50% 20% 20%;
            box-shadow: 0 0 15px 0 rgba(247, 93, 0, 0.4),
                        0 -6px 4px 0 rgba(247, 128, 0, 0.7);
        }

        .glow {
            width: 30px;
            height: 45px;
            border-radius: 50% 50% 35% 35%;
            left: 50%;
            top: -48px;
            transform: translateX(-50%);
            background: rgba(0, 133, 255, 0.7);
            box-shadow: 0 -40px 30px 0 #dc8a0c, 0 40px 50px 0 #dc8a0c,
                        inset 3px 0 2px 0 rgba(0, 133, 255, 0.6),
                        inset -3px 0 2px 0 rgba(0, 133, 255, 0.6);
            opacity: 0;
            position: absolute;
            animation: glowFadeIn 0.2s ease-in forwards 0.6s;
        }

        .glow:before {
            content: '';
            position: absolute;
            width: 70%;
            height: 60%;
            left: 50%;
            transform: translateX(-50%);
            bottom: 0;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.35);
        }

        .blinking-glow {
            width: 100px;
            height: 180px;
            left: 50%;
            top: -120px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: #ff6000;
            filter: blur(60px);
            opacity: 0;
            position: absolute;
            animation: glowFadeIn 0.2s ease-in forwards 0.7s, blinkIt 0.1s infinite 0.9s;
        }

        @keyframes sparkFlame {
            0% { height: 0; opacity: 0; transform: translateX(-50%) scale(0.1); filter: brightness(2); }
            10% { height: 16px; opacity: 1; transform: translateX(-50%) scale(1.6) rotate(10deg); filter: brightness(4) saturate(2); }
            30% { height: 35px; transform: translateX(-50%) scale(0.9) rotate(-5deg); filter: brightness(1.5); }
            70% { height: 70px; transform: translateX(-50%) scale(1) rotate(0deg); filter: brightness(1); }
            100% { height: 90px; opacity: 1; transform: translateX(-50%) scale(1); filter: brightness(1); }
        }

        @keyframes moveFlame {
            0%, 100% { transform: translateX(-50%) rotate(-2deg); }
            50% { transform: translateX(-50%) rotate(2deg); }
        }

        @keyframes enlargeFlame {
            0%, 100% { height: 90px; }
            50% { height: 105px; }
        }

        @keyframes glowFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes blinkIt {
            50% { opacity: 0.8; }
        }

        .intention-text {
            font-size: 18px;
            font-weight: 400;
            line-height: 1.4;
            max-width: 400px;
            color: #f8fafc;
            opacity: 0;
            animation: slideInUp 0.6s ease-out 0.3s forwards;
        }

        .conflict-container {
            display: none;
            flex-direction: column;
            align-items: center;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }

        .conflict-container.show {
            display: flex;
        }

        .conflict-title {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .intention-display {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .intention-label {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 8px;
        }

        .intention-display-text {
            font-size: 18px;
            font-weight: 500;
            line-height: 1.4;
        }

        .conflict-message {
            font-size: 18px;
            margin-bottom: 30px;
            line-height: 1.4;
        }

        .conflict-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .conflict-button {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            font-family: inherit;
            transition: all 0.2s ease;
            min-width: 140px;
        }

        .conflict-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .continue-button {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .new-intention-button {
            background: #ff6000;
            color: white;
        }

        .cancel-button {
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="background-glow"></div>
    <div id="intention-interface">
        ${this.generateIntentionHTML(websiteName)}
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for intention setting interface
   */
  private generateIntentionHTML(websiteName: string): string {
    return `
        <div class="intention-container" id="intention-container">
            <div class="candle-container" id="candle-container">
                <div class="candle-circle">
                    <img src="${chrome.runtime.getURL('public/logo.png')}" alt="Intent Logo" class="candle-logo" onerror="console.error('Logo failed to load:', this.src)">
                </div>
            </div>
            
            <h2 class="question">What's your intention for visiting ${websiteName}?</h2>
            
            <textarea 
                id="intention-input" 
                class="intention-input" 
                placeholder="Type your intention here..."
                autofocus
            ></textarea>
            
            <div class="submit-hint">Press Enter to continue</div>
        </div>

        <div class="flame-container" id="flame-container">
            <div class="flame-with-logo">
                <img src="${chrome.runtime.getURL('public/logo.png')}" alt="Intent Logo" class="flame-logo-base">
                <div class="flame-holder">
                    <div class="flame-wrapper">
                        <div class="flame-body">
                            <div class="blinking-glow"></div>
                            <div class="glow"></div>
                            <div class="flame"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="intention-text" id="intention-text"></div>
        </div>`;
  }


  /**
   * Initialize the intention interface with event listeners
   */
  private initializeIntentionInterface(): void {
    this.initializeIntentionInput();
  }

  /**
   * Initialize intention input interface
   */
  private initializeIntentionInput(): void {
    const input = document.getElementById('intention-input') as HTMLTextAreaElement;
    const intentionContainer = document.getElementById('intention-container');
    const flameContainer = document.getElementById('flame-container');
    const intentionText = document.getElementById('intention-text');

    if (!input || !intentionContainer || !flameContainer || !intentionText) return;

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Handle Enter key
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await this.submitIntention(input.value.trim());
      }
    });
  }


  /**
   * Submit intention and proceed to original URL
   */
  private async submitIntention(intention: string): Promise<void> {
    if (!intention) return;

    try {
      const domain = normalizeUrlToDomain(this.originalUrl);
      
      // First, validate the intention using AI
      const { validateIntention } = await import('./intentionMatcher');
      const [isValid, reason] = await validateIntention(intention);
      
      if (!isValid) {
        // Show error message and allow user to try again
        this.showValidationError(reason);
        return;
      }
      
      // Show flame animation
      const intentionContainer = document.getElementById('intention-container');
      const flameContainer = document.getElementById('flame-container');
      const intentionText = document.getElementById('intention-text');

      if (intentionContainer && flameContainer && intentionText) {
        intentionContainer.style.display = 'none';
        flameContainer.classList.add('show');
        intentionText.textContent = intention;
      }

      // Save intention using old storage system
      await saveIntention(this.originalUrl, intention);

      // Verify the intention was actually saved
      const savedIntention = await getIntention(this.originalUrl);
      console.log('✅ Intention saved successfully:', savedIntention);

      // Store flag to prevent infinite loop immediately after setting intention
      sessionStorage.setItem('intent_just_set', JSON.stringify({
        domain: domain,
        timestamp: Date.now()
      }));

      // Wait for flame animation, then redirect
      setTimeout(() => {
        // Store flag to start monitoring after redirect
        sessionStorage.setItem('intent_start_monitoring', 'true');
        
        // Verify the intention was saved before redirecting
        console.log('🔄 Redirecting to:', this.originalUrl);
        window.location.href = this.originalUrl;
      }, 2000);

    } catch (error) {
      console.error('Error setting intention:', error);
      alert('Error setting intention. Please try again.');
    }
  }

  /**
   * Show validation error message and allow user to try again
   */
  private showValidationError(reason: string): void {
    const intentionContainer = document.getElementById('intention-container');
    if (!intentionContainer) return;

    // Create or update error message
    let errorElement = document.getElementById('validation-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'validation-error';
      errorElement.style.cssText = `
        color: #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin-top: 16px;
        font-size: 14px;
        line-height: 1.4;
        text-align: center;
      `;
      intentionContainer.appendChild(errorElement);
    }

    errorElement.textContent = reason || 'Please provide a more specific intention.';
    
    // Clear the input and refocus
    const input = document.getElementById('intention-input') as HTMLTextAreaElement;
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

/**
 * Initialize route interceptor for current page
 */
export const initializeRouteInterceptor = async (): Promise<void> => {
  const interceptor = new RouteInterceptor();
  await interceptor.intercept();
};