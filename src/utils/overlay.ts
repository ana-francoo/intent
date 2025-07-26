// Centralized overlay management
export const injectOverlay = () => {
  // Mute all audio and video elements and try to suspend Web Audio API
  try {
    // Mute <audio> and <video> elements
    document.querySelectorAll('audio, video').forEach((el) => {
      const media = el as HTMLMediaElement;
      media.muted = true;
      media.volume = 0;
      if (typeof media.pause === 'function') media.pause();
    });
    // Try to suspend all AudioContexts (Web Audio API)
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const contexts: any[] = [];
      // @ts-ignore
      if ((window as any)._audioContexts) {
        // If extension or site tracks them globally
        contexts.push(...(window as any)._audioContexts);
      }
      // Try to find global audio contexts (best effort)
      for (const key in window) {
        // @ts-ignore
        if ((window as any)[key] && (window as any)[key] instanceof AudioCtx) {
          contexts.push((window as any)[key]);
        }
      }
      contexts.forEach((ctx) => {
        if (ctx && typeof ctx.suspend === 'function') ctx.suspend();
      });
    }
  } catch (err) {
    console.warn('Failed to mute audio/video:', err);
  }
  console.log('🎬 Attempting to inject overlay...');
  
  if (document.getElementById('intent-overlay-film')) {
    console.log('❌ Overlay already exists, not creating new one');
    return;
  }
  
  console.log('✅ Creating new overlay...');
  
  // Dynamic configuration for all placements and styling
  const overlayConfig = {
    // Content positioning
    contentVerticalPosition: 'flex-start', // 'center', 'flex-start', 'flex-end'
    contentTopPadding: '20vh', // Distance from top of viewport
    contentGap: 'vh', // Gap between flame and intention statement in viewport height - reduced from 5vh
    
    // Flame container sizing
    flameContainerWidth: '20vw', // 20% of viewport width
    flameContainerHeight: '25vh', // 25% of viewport height
    
    // Logo positioning (logo2.png)
    logoTop: '-43%', // Distance from top of flame container
    logoLeft: '0%', // Distance from left of flame container
    logoWidth: '100%', // Width of logo relative to container
    logoHeight: '100%', // Height of logo relative to container
    
    // Flame positioning within container
    flameHolderWidth: '15vw', // 15% of viewport width
    flameHolderHeight: '40vh', // 40% of viewport height
    flameWrapperLeft: '15%', // Percentage within the holder
    flameWrapperBottom: '30%', // Percentage within the holder - moved higher
    flameWrapperScaleX: '0.7',
    flameWrapperScaleY: '0.6',
    
    // Flame body dimensions
    flameBodyWidth: '15vw', // 15% of viewport width
    flameBodyHeight: '30vh', // 30% of viewport height
    
    // Intention statement positioning and styling
    intentionTop: '-10vh', // Distance to move intention statement up/down from its normal position
    intentionMaxWidth: '60vw', // 60% of viewport width
    intentionLineHeight: '1.4',
    
    // Animation timing
    fadeInDuration: '0.8s',
    fadeOutDuration: '0.3s'
  };
  
  // Capture the current URL
  const currentUrl = window.location.href;
  
  // Extract website name from URL
  const getWebsiteName = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      // Remove www. prefix if present
      const cleanHostname = hostname.replace(/^www\./, '');
      // Capitalize first letter
      return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1);
    } catch (error) {
      // Fallback to a generic name if URL parsing fails
      return 'this website';
    }
  };
  
  const websiteName = getWebsiteName(currentUrl);
  
  const overlay = document.createElement('div');
  overlay.id = 'intent-overlay-film';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%)';
  overlay.style.backdropFilter = 'blur(8px)';
  (overlay.style as any)['-webkit-backdrop-filter'] = 'blur(8px)'; // For Safari support
  overlay.style.zIndex = '2147483647';
  overlay.style.cursor = 'default';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'flex-start';
  overlay.style.padding = '0 10%';
  overlay.style.flexDirection = 'column';

  // Ensure overlay always captures pointer events
  overlay.style.pointerEvents = 'auto';

  // Create the chatbot container
  const chatContainer = document.createElement('div');
  chatContainer.style.width = 'min(60vw, 60vh)';
  chatContainer.style.maxWidth = '';
  chatContainer.style.position = 'absolute';
  chatContainer.style.top = '0';
  chatContainer.style.left = '50%';
  chatContainer.style.transform = 'translateX(-50%)';
  chatContainer.style.height = '100%';
  chatContainer.style.display = 'flex';
  chatContainer.style.flexDirection = 'column';
  chatContainer.style.alignItems = 'center';
  chatContainer.style.justifyContent = 'center';
  chatContainer.style.alignItems = 'stretch';

  // Create the question text
  const questionText = document.createElement('div');
  questionText.textContent = `What's your intention for visiting ${websiteName} right now?`;
  questionText.style.color = 'white';
  questionText.style.fontSize = '24px';
  questionText.style.fontWeight = '500';
  questionText.style.marginBottom = '20px';
  questionText.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
  questionText.style.textAlign = 'center';
  questionText.style.width = '100%';
  questionText.style.maxWidth = '';
  questionText.style.margin = '0 0 20px 0';
  questionText.style.lineHeight = '1.35';

  // Create the input container
  const inputContainer = document.createElement('div');
  inputContainer.style.position = 'relative';
  inputContainer.style.display = 'flex';
  inputContainer.style.alignItems = 'center';
  inputContainer.style.justifyContent = 'center';
  inputContainer.style.gap = '10px';
  // inputContainer.style.width = '480px'; // Moved to after textInput is created
  // textInput.style.maxWidth = '480px'; // Moved to after textInput is created
  inputContainer.style.width = '100%';
  inputContainer.style.display = 'block';
  inputContainer.style.margin = '0';

  // Replace the creation of the text input:
  // const textInput = document.createElement('input');
  // textInput.type = 'text';
  // with a textarea that auto-expands and wraps text.
  const textInput = document.createElement('textarea');
  textInput.rows = 1;
  textInput.placeholder = 'Type your intention here...';
  textInput.style.flex = '1';
  textInput.style.padding = '12px 16px';
  textInput.style.fontSize = '18px';
  textInput.style.border = 'none';
  textInput.style.borderRadius = '8px';
  textInput.style.backgroundColor = 'transparent';
  textInput.style.color = 'white';
  textInput.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
  textInput.style.outline = 'none';
  textInput.style.boxShadow = 'none';
  textInput.style.overflow = 'hidden'; // Hide scroll bar
  textInput.style.overflowY = 'hidden'; // Hide vertical scroll bar
  textInput.style.resize = 'none'; // No resize handle
  textInput.style.minHeight = '48px';
  textInput.style.maxHeight = '160px';
  textInput.style.width = '100%';
  textInput.style.maxWidth = '';
  textInput.style.lineHeight = '1.4';
  textInput.style.whiteSpace = 'pre-wrap';
  textInput.style.wordBreak = 'break-word';
  // Auto-expand textarea as user types
  textInput.addEventListener('input', () => {
    textInput.style.height = 'auto';
    textInput.style.height = textInput.scrollHeight + 'px';
  });

  // Create the success container (initially hidden)
  const successContainer = document.createElement('div');
  successContainer.style.display = 'none';
  successContainer.style.position = 'absolute';
  successContainer.style.top = '0';
  successContainer.style.left = '0';
  successContainer.style.width = '100%';
  successContainer.style.height = '100%';
  successContainer.style.display = 'flex';
  successContainer.style.flexDirection = 'column';
  successContainer.style.alignItems = 'center';
  successContainer.style.justifyContent = 'center';
  successContainer.style.cursor = 'pointer';
  successContainer.style.paddingTop = '0';

  // Create the intention statement
  const intentionStatement = document.createElement('div');
  intentionStatement.style.color = 'white';
  intentionStatement.style.fontSize = '1.25rem';
  intentionStatement.style.fontWeight = '400';
  intentionStatement.style.textAlign = 'center';
  intentionStatement.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
  intentionStatement.style.maxWidth = '60vw';
  intentionStatement.style.lineHeight = '1.4';
  intentionStatement.style.letterSpacing = '-0.02em';
  
  // Make placement dynamic - positioned to work with centered content container
  intentionStatement.style.position = 'relative';
  intentionStatement.style.marginTop = '2vh';
  intentionStatement.style.marginBottom = '0';

  // Add CSS animation for logo and flame
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css?family=Ubuntu:400,400i,700,700i');
    *, *:before, *:after { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 10px; }
    #intent-overlay-film { font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif; color: white; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; z-index: 2147483647; }
    #intent-overlay-film .container { width: 100%; display: flex; justify-content: center; }
    #intent-overlay-film svg { width: 200px; height: 200px; stroke: white; fill: none; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
    #intent-overlay-film path { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw ease-out forwards; }
    #intent-overlay-film path.circle { animation-duration: 5s; }
    #intent-overlay-film path.flame { animation-duration: 7s; animation-delay: 0.3s; }
    #intent-overlay-film .flame-body { position: absolute; bottom: 0; width: 150px; height: 300px; border-radius: 50px / 40px; animation-delay: 5s; animation-fill-mode: forwards; }
    #intent-overlay-film .flame { width: 40px; height: 120px; left: 50%; bottom: 100%; transform: translateX(-50%); position: absolute; background: linear-gradient(white 80%, transparent); border-radius: 50% 50% 20% 20%; transform-origin: 50% 100%; opacity: 0; animation: sparkFlame 0.5s ease-in forwards 2s, moveFlame 3s linear infinite 2.5s, enlargeFlame 5s ease-out infinite 2.5s; }
    #intent-overlay-film .flame:before { content: ""; position: absolute; width: 100%; height: 100%; border-radius: 50% 50% 20% 20%; }
    @keyframes sparkFlame { 0% { height: 0; opacity: 0; transform: translateX(-50%) scale(0.1); filter: brightness(2); } 5% { height: 5px; opacity: 1; transform: translateX(-50%) scale(1.6) rotate(10deg); filter: brightness(4) saturate(2); } 10% { height: 10px; transform: translateX(-50%) scale(0.9) rotate(-5deg); filter: brightness(1.5); } 15% { height: 20px; transform: translateX(-50%) scale(1) rotate(0deg); filter: brightness(1); } 100% { height: 120px; opacity: 1; transform: translateX(-50%) scale(1); filter: brightness(1); } }
    @keyframes moveFlame { 0%, 100% { transform: translateX(-50%) rotate(-2deg); } 50% { transform: translateX(-50%) rotate(2deg); } }
    @keyframes enlargeFlame { 0%, 100% { height: 90px; } 50% { height: 100px; } }
    #intent-overlay-film .glow { position: absolute; width: 40px; height: 60px; border-radius: 50% 50% 35% 35%; left: 50%; top: -48px; transform: translateX(-50%); background: rgba(0, 133, 255, .7); box-shadow: 0 -40px 30px #dc8a0c, 0 40px 50px #dc8a0c, inset 3px 0 2px rgba(0, 133, 255, .6), inset -3px 0 2px rgba(0, 133, 255, .6); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 2.1s; }
    #intent-overlay-film .blinking-glow { position: absolute; width: 100px; height: 180px; left: 50%; top: -80px; transform: translateX(-50%); border-radius: 50%; background: #ff6000; filter: blur(60px); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 2.5s, blinkIt 0.1s infinite 2.7s; }
    @keyframes glowBlinkIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes blinkIt { 50% { opacity: 0.8; } }
    #intent-overlay-film .glow:before { content: ""; position: absolute; width: 70%; height: 60%; left: 50%; bottom: 0; transform: translateX(-50%); border-radius: 50%; background: rgba(0, 0, 0, 0.35); }
    #intent-overlay-film .flame-wrapper { position: absolute; left: 14%; transform: translateX(0%) scale(0.7); bottom: 79%; }
    @keyframes glowFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .fade-out { animation: fadeOut 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    /* Flame animations for overlay */
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
    @keyframes blinkIt { 50% { opacity: 0.8; } }
  `;
  document.head.appendChild(style);

  // Handle Enter key to submit
  textInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textInput.value.trim()) {
        const userIntention = textInput.value.trim();
        const { saveIntention } = await import('../utils/storage');
        const { validateIntention } = await import('../utils/intentionMatcher');
        try {
          const [isValid, reason] = await validateIntention(userIntention);
          if (isValid) {
            chatContainer.style.display = 'none';
            await saveIntention(currentUrl, userIntention);
            // Clear and insert the new HTML structure for logo and flame
            successContainer.innerHTML = '';
            successContainer.style.display = 'flex';
            successContainer.style.flexDirection = 'column';
            successContainer.style.alignItems = 'center';
            successContainer.style.justifyContent = 'center';
            successContainer.style.height = '100%';
            successContainer.style.width = '100%';
            successContainer.style.position = 'absolute';
            successContainer.style.top = '0';
            successContainer.style.left = '0';
            successContainer.style.cursor = 'pointer';
            successContainer.style.paddingTop = '0';
            
            // Create a container for the flame and intention statement
            const contentContainer = document.createElement('div');
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.alignItems = 'center';
            contentContainer.style.justifyContent = overlayConfig.contentVerticalPosition;
            contentContainer.style.gap = overlayConfig.contentGap;
            contentContainer.style.opacity = '0';
            contentContainer.style.animation = `fadeIn ${overlayConfig.fadeInDuration} ease-out forwards`;
            contentContainer.style.paddingTop = overlayConfig.contentTopPadding;
            
            // Create flame container
            const flameContainer = document.createElement('div');
            flameContainer.style.display = 'flex';
            flameContainer.style.justifyContent = 'center';
            flameContainer.style.alignItems = 'center';
            flameContainer.style.width = overlayConfig.flameContainerWidth;
            flameContainer.style.height = overlayConfig.flameContainerHeight;
            flameContainer.style.position = 'relative';
            
            // Create logo background
            const logoBackground = document.createElement('img');
            logoBackground.src = chrome.runtime.getURL('src/assets/logo2.png');
            logoBackground.style.position = 'absolute';
            logoBackground.style.top = overlayConfig.logoTop;
            logoBackground.style.left = overlayConfig.logoLeft;
            logoBackground.style.width = overlayConfig.logoWidth;
            logoBackground.style.height = overlayConfig.logoHeight;
            logoBackground.style.objectFit = 'contain';
            logoBackground.style.opacity = '0.3';
            logoBackground.style.zIndex = '1';
            
            // Create flame wrapper with higher z-index
            const flameWrapper = document.createElement('div');
            flameWrapper.style.position = 'relative';
            flameWrapper.style.zIndex = '2';
            flameWrapper.style.width = '100%';
            flameWrapper.style.height = '100%';
            flameWrapper.style.display = 'flex';
            flameWrapper.style.justifyContent = 'center';
            flameWrapper.style.alignItems = 'center';
            
            // Insert the Flame component HTML structure
            flameWrapper.innerHTML = `
              <div class="holder" style="margin: 0; width: ${overlayConfig.flameHolderWidth}; height: ${overlayConfig.flameHolderHeight}; position: relative;">
                <div class="flame-wrapper" style="position: absolute; left: ${overlayConfig.flameWrapperLeft}; transform: translateX(0%) scaleY(${overlayConfig.flameWrapperScaleY}) scaleX(${overlayConfig.flameWrapperScaleX}); bottom: ${overlayConfig.flameWrapperBottom};">
                  <div class="flame-body" style="position: absolute; bottom: 0; width: ${overlayConfig.flameBodyWidth}; height: ${overlayConfig.flameBodyHeight}; border-radius: 50px / 40px;">
                    <div class="blinking-glow" style="width: 100px; height: 180px; left: 50%; top: -120px; transform: translateX(-50%); border-radius: 50%; background: #ff6000; filter: blur(60px); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 0.7s, blinkIt 0.1s infinite 0.9s; position: absolute;"></div>
                    <div class="glow" style="width: 30px; height: 45px; border-radius: 50% 50% 35% 35%; left: 50%; top: -48px; transform: translateX(-50%); background: rgba(0, 133, 255, 0.7); box-shadow: 0 -40px 30px 0 #dc8a0c, 0 40px 50px 0 #dc8a0c, inset 3px 0 2px 0 rgba(0, 133, 255, 0.6), inset -3px 0 2px 0 rgba(0, 133, 255, 0.6); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 0.6s; position: absolute;"></div>
                    <div class="flame" style="width: 30px; height: 90px; left: 50%; transform-origin: 50% 100%; transform: translateX(-50%); bottom: 100%; border-radius: 50% 50% 20% 20%; background: linear-gradient(white 80%, transparent); opacity: 0; animation: sparkFlame 0.3s ease-in forwards 0s, moveFlame 3s linear infinite 1s, enlargeFlame 5s ease-out infinite 1s; position: absolute;"></div>
                  </div>
                </div>
              </div>
            `;
            
            // Assemble the flame container
            flameContainer.appendChild(logoBackground);
            flameContainer.appendChild(flameWrapper);
            
            // Set the text content for the existing intention statement
            intentionStatement.textContent = userIntention;
            
            // Assemble the content - both logo and intention will be centered together
            contentContainer.appendChild(flameContainer);
            contentContainer.appendChild(intentionStatement);
            successContainer.appendChild(contentContainer);

            // Add click event listener to dismiss overlay
            const dismissHandler = (e: MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              overlay.classList.add('fade-out');
              setTimeout(() => {
                overlay.remove();
                style.remove();
              }, parseFloat(overlayConfig.fadeOutDuration) * 1000);
            };
            successContainer.addEventListener('click', dismissHandler);
          } else {
            // Show error message and a button to retry
            chatContainer.style.display = 'none';
            successContainer.style.display = 'flex';
            successContainer.innerHTML = '';
            const errorContainer = document.createElement('div');
            errorContainer.style.display = 'flex';
            errorContainer.style.flexDirection = 'column';
            errorContainer.style.alignItems = 'center';
            errorContainer.style.justifyContent = 'center';
            errorContainer.style.height = '100%';
            errorContainer.style.width = '100%';
            errorContainer.style.position = 'absolute';
            errorContainer.style.top = '0';
            errorContainer.style.left = '0';
            errorContainer.style.background = 'radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%)';
            errorContainer.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
            errorContainer.style.color = 'white';
            errorContainer.style.fontSize = '22px';
            errorContainer.style.fontWeight = '600';
            errorContainer.style.textAlign = 'center';
            errorContainer.style.padding = '40px 20px';
            // Add flame/logo above the error message
            const flameLogo = document.createElement('img');
            flameLogo.src = chrome.runtime.getURL('src/assets/logo2.png');
            flameLogo.style.width = '100px';
            flameLogo.style.marginBottom = '24px';
            errorContainer.appendChild(flameLogo);
            errorContainer.textContent = reason.replace(/^\s*\.?\s*/, '').replace(/\s*\.?\s*$/, '');
            const retryButton = document.createElement('button');
            retryButton.className = 'get-started-btn';
            retryButton.type = 'button';
            // Button content: text and arrow span
            retryButton.innerHTML = `
              <span class="btn-text">Go Back</span>
              <span class="btn-arrow">
                <span class="arrow">&lt;--</span>
              </span>
            `;
            retryButton.addEventListener('click', () => {
              // Remove the current overlay and re-inject from scratch
              const overlay = document.getElementById('intent-overlay-film');
              if (overlay) overlay.remove();
              import('./overlay').then(({ injectOverlay }) => injectOverlay());
            });
            errorContainer.appendChild(retryButton);
            successContainer.appendChild(errorContainer);
          }
        } catch (err) {
          // Fallback error handling
          chatContainer.style.display = 'none';
          successContainer.style.display = 'flex';
          successContainer.innerHTML = '';
          const errorContainer = document.createElement('div');
          errorContainer.style.display = 'flex';
          errorContainer.style.flexDirection = 'column';
          errorContainer.style.alignItems = 'center';
          errorContainer.style.justifyContent = 'center';
          errorContainer.style.height = '100%';
          errorContainer.style.width = '100%';
          errorContainer.style.position = 'absolute';
          errorContainer.style.top = '0';
          errorContainer.style.left = '0';
          errorContainer.style.background = 'radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%)';
          errorContainer.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
          errorContainer.style.color = 'white';
          errorContainer.style.fontSize = '22px';
          errorContainer.style.fontWeight = '600';
          errorContainer.style.textAlign = 'center';
          errorContainer.style.padding = '40px 20px';
          // Add flame/logo above the error message
          const flameLogo = document.createElement('img');
          flameLogo.src = chrome.runtime.getURL('src/assets/logo2.png');
          flameLogo.style.width = '100px';
          flameLogo.style.marginBottom = '24px';
          errorContainer.appendChild(flameLogo);
          errorContainer.textContent = 'An error occurred. Please try again.';
          const retryButton = document.createElement('button');
          retryButton.className = 'get-started-btn';
          retryButton.type = 'button';
          // Button content: text and arrow span
          retryButton.innerHTML = `
            <span class="btn-text">Go Back</span>
            <span class="btn-arrow">
              <span class="arrow">&lt;--</span>
            </span>
          `;
          retryButton.addEventListener('click', () => {
            // Remove the current overlay and re-inject from scratch
            const overlay = document.getElementById('intent-overlay-film');
            if (overlay) overlay.remove();
            import('./overlay').then(({ injectOverlay }) => injectOverlay());
          });
          errorContainer.appendChild(retryButton);
          successContainer.appendChild(errorContainer);
        }
      }
    }
    // Otherwise, allow Shift+Enter for new lines
  });

  // Prevent clicks on overlay from reaching the page behind
  overlay.addEventListener('mousedown', (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, true);

  // Assemble the components
  inputContainer.appendChild(textInput);
  // textInput.style.maxWidth = 'min(60vw, 60vh)'; // This line is now redundant
  // textInput.style.margin = '0 auto'; // This line is now redundant
  questionText.style.width = '100%';
  questionText.style.maxWidth = '';
  questionText.style.margin = '0 0 20px 0';
  chatContainer.appendChild(questionText);
  chatContainer.appendChild(inputContainer);
  overlay.appendChild(chatContainer);
  overlay.appendChild(successContainer);

  document.body.appendChild(overlay);

  // Focus the input after a short delay
  setTimeout(() => {
    textInput.focus();
  }, 100);
  
  console.log('✅ Overlay successfully added to DOM');
  console.log('🎬 Overlay element:', document.getElementById('intent-overlay-film'));
};

// Overlay #2: Intention Mismatch (new functionality)
export const injectIntentionMismatchOverlay = () => {
  // Mute all audio and video elements and try to suspend Web Audio API
  try {
    document.querySelectorAll('audio, video').forEach((el) => {
      const media = el as HTMLMediaElement;
      media.muted = true;
      media.volume = 0;
      if (typeof media.pause === 'function') media.pause();
    });
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const contexts: any[] = [];
      // @ts-ignore
      if ((window as any)._audioContexts) {
        contexts.push(...(window as any)._audioContexts);
      }
      for (const key in window) {
        // @ts-ignore
        if ((window as any)[key] && (window as any)[key] instanceof AudioCtx) {
          contexts.push((window as any)[key]);
        }
      }
      contexts.forEach((ctx) => {
        if (ctx && typeof ctx.suspend === 'function') ctx.suspend();
      });
    }
  } catch (err) {
    console.warn('Failed to mute audio/video:', err);
  }
  if (document.getElementById('intent-overlay-film')) return;
  
  // Use the same configuration as the main overlay
  const overlayConfig = {
    // Content positioning
    contentVerticalPosition: 'flex-start',
    contentTopPadding: '20vh',
    contentGap: '1vh',
    
    // Flame container sizing
    flameContainerWidth: '20vw',
    flameContainerHeight: '25vh',
    
    // Logo positioning (logo2.png)
    logoTop: '-43%',
    logoLeft: '0%',
    logoWidth: '100%',
    logoHeight: '100%',
    
    // Flame positioning within container
    flameHolderWidth: '15vw',
    flameHolderHeight: '40vh',
    flameWrapperLeft: '15%',
    flameWrapperBottom: '30%',
    flameWrapperScaleX: '0.7',
    flameWrapperScaleY: '0.6',
    
    // Flame body dimensions
    flameBodyWidth: '15vw',
    flameBodyHeight: '30vh',
    
    // Intention statement positioning and styling
    intentionTop: '-10vh',
    intentionMaxWidth: '60vw',
    intentionLineHeight: '1.4',
    
    // Animation timing
    fadeInDuration: '0.8s',
    fadeOutDuration: '0.3s'
  };
  
  const overlay = document.createElement('div');
  overlay.id = 'intent-overlay-film';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%)';
  overlay.style.backdropFilter = 'blur(8px)';
  (overlay.style as any)['-webkit-backdrop-filter'] = 'blur(8px)';
  overlay.style.zIndex = '2147483647';
  overlay.style.cursor = 'default';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.flexDirection = 'column';

  // Add CSS for the mismatch overlay (same as main overlay)
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css?family=Ubuntu:400,400i,700,700i');
    *, *:before, *:after { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 10px; }
    #intent-overlay-film { font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif; color: white; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; z-index: 2147483647; }
    #intent-overlay-film svg { width: 200px; height: 200px; stroke: white; fill: none; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
    #intent-overlay-film path { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw ease-out forwards; }
    #intent-overlay-film path.circle { animation-duration: 5s; }
    #intent-overlay-film path.flame { animation-duration: 7s; animation-delay: 0.3s; }
    #intent-overlay-film .flame-body { position: absolute; bottom: 0; width: 150px; height: 300px; border-radius: 50px / 40px; animation-delay: 5s; animation-fill-mode: forwards; }
    #intent-overlay-film .flame { width: 40px; height: 120px; left: 50%; bottom: 100%; transform: translateX(-50%); position: absolute; background: linear-gradient(white 80%, transparent); border-radius: 50% 50% 20% 20%; transform-origin: 50% 100%; opacity: 0; animation: sparkFlame 0.5s ease-in forwards 2s, moveFlame 3s linear infinite 2.5s, enlargeFlame 5s ease-out infinite 2.5s; }
    #intent-overlay-film .flame:before { content: ""; position: absolute; width: 100%; height: 100%; border-radius: 50% 50% 20% 20%; }
    @keyframes sparkFlame { 0% { height: 0; opacity: 0; transform: translateX(-50%) scale(0.1); filter: brightness(2); } 5% { height: 5px; opacity: 1; transform: translateX(-50%) scale(1.6) rotate(10deg); filter: brightness(4) saturate(2); } 10% { height: 10px; transform: translateX(-50%) scale(0.9) rotate(-5deg); filter: brightness(1.5); } 15% { height: 20px; transform: translateX(-50%) scale(1) rotate(0deg); filter: brightness(1); } 100% { height: 120px; opacity: 1; transform: translateX(-50%) scale(1); filter: brightness(1); } }
    @keyframes moveFlame { 0%, 100% { transform: translateX(-50%) rotate(-2deg); } 50% { transform: translateX(-50%) rotate(2deg); } }
    @keyframes enlargeFlame { 0%, 100% { height: 90px; } 50% { height: 100px; } }
    #intent-overlay-film .glow { position: absolute; width: 40px; height: 60px; border-radius: 50% 50% 35% 35%; left: 50%; top: -48px; transform: translateX(-50%); background: rgba(0, 133, 255, .7); box-shadow: 0 -40px 30px #dc8a0c, 0 40px 50px #dc8a0c, inset 3px 0 2px rgba(0, 133, 255, .6), inset -3px 0 2px rgba(0, 133, 255, .6); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 2.1s; }
    #intent-overlay-film .blinking-glow { position: absolute; width: 100px; height: 180px; left: 50%; top: -80px; transform: translateX(-50%); border-radius: 50%; background: #ff6000; filter: blur(60px); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 2.5s, blinkIt 0.1s infinite 2.7s; }
    @keyframes glowBlinkIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes blinkIt { 50% { opacity: 0.8; } }
    #intent-overlay-film .glow:before { content: ""; position: absolute; width: 70%; height: 60%; left: 50%; bottom: 0; transform: translateX(-50%); border-radius: 50%; background: rgba(0, 0, 0, 0.35); }
    #intent-overlay-film .flame-wrapper { position: absolute; left: 14%; transform: translateX(0%) scale(0.7); bottom: 79%; }
    @keyframes glowFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .fade-out { animation: fadeOut 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    /* Flame animations for overlay */
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
    @keyframes blinkIt { 50% { opacity: 0.8; } }
    
    .mismatch-button { 
      background: rgba(255, 255, 255, 0.1); 
      border: 2px solid rgba(255, 255, 255, 0.3); 
      color: white; 
      padding: 12px 24px; 
      border-radius: 8px; 
      font-size: 16px; 
      font-weight: 500; 
      cursor: pointer; 
      transition: all 0.2s ease; 
      font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
      margin-top: 20px;
    }
    .mismatch-button:hover { 
      background: rgba(255, 255, 255, 0.2); 
      border-color: rgba(255, 255, 255, 0.5); 
    }
  `;
  document.head.appendChild(style);

  // Create a container for the flame and intention statement
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';
  contentContainer.style.alignItems = 'center';
  contentContainer.style.justifyContent = overlayConfig.contentVerticalPosition;
  contentContainer.style.gap = overlayConfig.contentGap;
  contentContainer.style.opacity = '0';
  contentContainer.style.animation = `fadeIn ${overlayConfig.fadeInDuration} ease-out forwards`;
  contentContainer.style.paddingTop = overlayConfig.contentTopPadding;
  
  // Create flame container
  const flameContainer = document.createElement('div');
  flameContainer.style.display = 'flex';
  flameContainer.style.justifyContent = 'center';
  flameContainer.style.alignItems = 'center';
  flameContainer.style.width = overlayConfig.flameContainerWidth;
  flameContainer.style.height = overlayConfig.flameContainerHeight;
  flameContainer.style.position = 'relative';
  
  // Create logo background
  const logoBackground = document.createElement('img');
  logoBackground.src = chrome.runtime.getURL('src/assets/logo2.png');
  logoBackground.style.position = 'absolute';
  logoBackground.style.top = overlayConfig.logoTop;
  logoBackground.style.left = overlayConfig.logoLeft;
  logoBackground.style.width = overlayConfig.logoWidth;
  logoBackground.style.height = overlayConfig.logoHeight;
  logoBackground.style.objectFit = 'contain';
  logoBackground.style.opacity = '0.3';
  logoBackground.style.zIndex = '1';
  
  // Create flame wrapper with higher z-index
  const flameWrapper = document.createElement('div');
  flameWrapper.style.position = 'relative';
  flameWrapper.style.zIndex = '2';
  flameWrapper.style.width = '100%';
  flameWrapper.style.height = '100%';
  flameWrapper.style.display = 'flex';
  flameWrapper.style.justifyContent = 'center';
  flameWrapper.style.alignItems = 'center';
  
  // Insert the Flame component HTML structure
  flameWrapper.innerHTML = `
    <div class="holder" style="margin: 0; width: ${overlayConfig.flameHolderWidth}; height: ${overlayConfig.flameHolderHeight}; position: relative;">
      <div class="flame-wrapper" style="position: absolute; left: ${overlayConfig.flameWrapperLeft}; transform: translateX(0%) scaleY(${overlayConfig.flameWrapperScaleY}) scaleX(${overlayConfig.flameWrapperScaleX}); bottom: ${overlayConfig.flameWrapperBottom};">
        <div class="flame-body" style="position: absolute; bottom: 0; width: ${overlayConfig.flameBodyWidth}; height: ${overlayConfig.flameBodyHeight}; border-radius: 50px / 40px;">
          <div class="blinking-glow" style="width: 100px; height: 180px; left: 50%; top: -120px; transform: translateX(-50%); border-radius: 50%; background: #ff6000; filter: blur(60px); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 0.7s, blinkIt 0.1s infinite 0.9s; position: absolute;"></div>
          <div class="glow" style="width: 30px; height: 45px; border-radius: 50% 50% 35% 35%; left: 50%; top: -48px; transform: translateX(-50%); background: rgba(0, 133, 255, 0.7); box-shadow: 0 -40px 30px 0 #dc8a0c, 0 40px 50px 0 #dc8a0c, inset 3px 0 2px 0 rgba(0, 133, 255, 0.6), inset -3px 0 2px 0 rgba(0, 133, 255, 0.6); opacity: 0; animation: glowFadeIn 0.2s ease-in forwards 0.6s; position: absolute;"></div>
          <div class="flame" style="width: 30px; height: 90px; left: 50%; transform-origin: 50% 100%; transform: translateX(-50%); bottom: 100%; border-radius: 50% 50% 20% 20%; background: linear-gradient(white 80%, transparent); opacity: 0; animation: sparkFlame 0.3s ease-in forwards 0s, moveFlame 3s linear infinite 1s, enlargeFlame 5s ease-out infinite 1s; position: absolute;"></div>
        </div>
      </div>
    </div>
  `;
  
  // Assemble the flame container
  flameContainer.appendChild(logoBackground);
  flameContainer.appendChild(flameWrapper);
  
  // Create the intention statement
  const intentionStatement = document.createElement('div');
  intentionStatement.style.color = 'white';
  intentionStatement.style.fontSize = '28px';
  intentionStatement.style.fontWeight = '600';
  intentionStatement.style.textAlign = 'center';
  intentionStatement.style.fontFamily = "'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif";
  intentionStatement.style.maxWidth = overlayConfig.intentionMaxWidth;
  intentionStatement.style.lineHeight = overlayConfig.intentionLineHeight;
  intentionStatement.style.position = 'relative';
  intentionStatement.style.top = overlayConfig.intentionTop;
  intentionStatement.style.marginTop = '0';
  intentionStatement.style.marginBottom = '0';

  // Fetch and display the actual intention for this URL
  const currentUrl = window.location.href;
  import('../utils/storage').then(({ getIntention }) => {
    getIntention(currentUrl).then((intentionData) => {
      if (intentionData && intentionData.intention) {
        intentionStatement.textContent = intentionData.intention;
      } else {
        intentionStatement.textContent = 'No intention found for this website';
      }
    }).catch((error) => {
      console.error('Error fetching intention:', error);
      intentionStatement.textContent = 'Error loading intention';
    });
  });

  // Create "Set a new intention" button
  const setIntentionButton = document.createElement('button');
  setIntentionButton.className = 'mismatch-button';
  setIntentionButton.textContent = 'Set a new intention';
  setIntentionButton.addEventListener('click', () => {
    // Remove current overlay and show intention setup overlay
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      style.remove();
      injectOverlay(); // Show the original intention setup overlay
    }, 300);
  });

  // Assemble the components
  contentContainer.appendChild(flameContainer);
  contentContainer.appendChild(intentionStatement);
  contentContainer.appendChild(setIntentionButton);
  overlay.appendChild(contentContainer);

  document.body.appendChild(overlay);
};

// Centralized overlay trigger
export const triggerOverlay = () => {
  if (window.chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_OVERLAY' });
      }
    });
  }
};

// Utility function to trigger intention mismatch overlay
export const triggerIntentionMismatchOverlay = () => {
  triggerOverlay();
};

// Utility function to trigger intention setup overlay
export const triggerIntentionSetupOverlay = () => {
  triggerOverlay();
};

/**
 * Check intention match and show appropriate overlay
 * This function can be used when you want to check if current activity matches the user's intention
 */
export const checkIntentionAndShowOverlay = async (currentUrl: string) => {
  try {
    // Import the intention matcher
    const { checkIntentionMatch } = await import('./intentionMatcher');
    
    // Check if intention matches current activity
    const result = await checkIntentionMatch(currentUrl);
    
    if (!result.matches) {
      // Show intention mismatch overlay
      triggerIntentionMismatchOverlay();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking intention match:', error);
    // If there's an error, default to showing the mismatch overlay
    triggerIntentionMismatchOverlay();
    return false;
  }
}; 

// At the end of the file, if not already present, inject the following CSS for .go-back-btn arrow:
if (!document.getElementById('go-back-btn-style')) {
  const goBackBtnStyle = document.createElement('style');
  goBackBtnStyle.id = 'go-back-btn-style';
  goBackBtnStyle.textContent = `
    :root {
      --primary: #ff6000;
      --primary-foreground: #ffffff;
      --foreground: #ffffff;
    }
    
    .get-started-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      height: 2.5rem;
      padding: 0 1.5rem;
      border-radius: 0.75rem;
      background: var(--primary);
      color: var(--primary-foreground);
      font-size: 1rem;
      font-weight: 500;
      border: none;
      transition: background 0.5s, color 0.5s;
      cursor: pointer;
      font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
    }
    
    .get-started-btn .btn-text {
      transform: translateX(0);
      opacity: 1;
      transition: transform 0.3s, opacity 0.3s;
    }
    
    .get-started-btn .btn-arrow {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) translateX(150%);
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      display: flex;
      align-items: center;
      height: 100%;
    }
    
    .get-started-btn:hover {
      background: #e55a15;
      color: var(--foreground);
    }
    
    .get-started-btn:hover .btn-text {
      transform: translateX(-150%);
      opacity: 0;
    }
    
    .get-started-btn:hover .btn-arrow {
      transform: translate(-50%, -50%) translateX(0);
      opacity: 1;
    }
    
    .arrow {
      font-size: 1.3em;
      margin-left: 0.2em;
      display: inline-block;
    }
  `;
  document.head.appendChild(goBackBtnStyle);
} 