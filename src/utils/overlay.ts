// Centralized overlay management
export const injectOverlay = () => {
  if (document.getElementById('intent-overlay-film')) return;
  
  // Capture the current URL
  const currentUrl = window.location.href;
  
  const overlay = document.createElement('div');
  overlay.id = 'intent-overlay-film';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(40, 20, 10, 0.88)';
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
  chatContainer.style.maxWidth = '600px';
  chatContainer.style.position = 'absolute';
  chatContainer.style.top = '0';
  chatContainer.style.left = '50%';
  chatContainer.style.transform = 'translateX(-50%)';
  chatContainer.style.height = '100%';
  chatContainer.style.display = 'flex';
  chatContainer.style.flexDirection = 'column';
  chatContainer.style.alignItems = 'center';
  chatContainer.style.justifyContent = 'center';

  // Create the question text
  const questionText = document.createElement('div');
  questionText.textContent = 'What are you trying to achieve by opening LinkedIn?';
  questionText.style.color = 'white';
  questionText.style.fontSize = '24px';
  questionText.style.fontWeight = '500';
  questionText.style.marginBottom = '20px';
  questionText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  questionText.style.textAlign = 'center';
  questionText.style.width = '100%';
  questionText.style.lineHeight = '1.35'; // or try '1.4' for a bit more

  // Create the input container
  const inputContainer = document.createElement('div');
  inputContainer.style.position = 'relative';
  inputContainer.style.display = 'flex';
  inputContainer.style.alignItems = 'center';
  inputContainer.style.justifyContent = 'center';
  inputContainer.style.gap = '10px';

  // Create the text input
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Type your intention here...';
  textInput.style.flex = '1';
  textInput.style.padding = '12px 16px';
  textInput.style.fontSize = '18px';
  textInput.style.border = 'none';
  textInput.style.borderRadius = '8px';
  textInput.style.backgroundColor = 'transparent';
  textInput.style.color = 'white';
  textInput.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  textInput.style.outline = 'none';
  textInput.style.boxShadow = 'none';

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
  intentionStatement.style.fontSize = '28px';
  intentionStatement.style.fontWeight = '600';
  intentionStatement.style.textAlign = 'center';
  intentionStatement.style.fontFamily = 'Ubuntu, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  intentionStatement.style.maxWidth = '80%';
  intentionStatement.style.lineHeight = '1.4';
  
  // Make placement dynamic
  intentionStatement.style.position = 'relative';
  intentionStatement.style.top = '-22vh'; // adjust this to control how high it sits above center
  intentionStatement.style.marginBottom = '0';

  // Add CSS animation for logo and flame (with font import)
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css?family=Ubuntu:400,400i,700,700i');
    *, *:before, *:after { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 10px; }
    #intent-overlay-film { font-family: 'Ubuntu', sans-serif; color: white; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; z-index: 2147483647; }
    #intent-overlay-film .container { width: 100%; display: flex; justify-content: center; }
    #intent-overlay-film svg { width: 200px; height: 200px; stroke: white; fill: none; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
    #intent-overlay-film path { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw ease-out forwards; }
    #intent-overlay-film path.circle { animation-duration: 5s; }
    #intent-overlay-film path.candle { animation-duration: 7s; animation-delay: 0.3s; }
    #intent-overlay-film path.drip { animation-duration: 3s; animation-delay: 0.8s; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    #intent-overlay-film .holder { margin-top: 4rem; width: 150px; height: 400px; position: relative; }
    #intent-overlay-film .candle-body { position: absolute; bottom: 0; width: 150px; height: 300px; border-radius: 50px / 40px; animation-delay: 5s; animation-fill-mode: forwards; }
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
  `;
  document.head.appendChild(style);

  // Handle Enter key to submit
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && textInput.value.trim()) {
      const userIntention = textInput.value.trim(); //capturing the user's intention
      import('../utils/storage').then(({ saveIntention }) => {
        saveIntention(currentUrl, userIntention);
      });
      
      intentionStatement.textContent = userIntention;
      chatContainer.style.display = 'none';
      successContainer.style.display = 'flex';
      // Clear and insert the new HTML structure for logo and flame
      successContainer.innerHTML = '';
      // Re-apply flexbox centering styles for intention statement
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
      successContainer.appendChild(intentionStatement);
      // Insert SVG logo at the bottom center
      const logoWrapper = document.createElement('div');
      logoWrapper.style.position = 'fixed';
      logoWrapper.style.left = '50%';
      logoWrapper.style.top = '80%'; //increase this to push lower
      logoWrapper.style.transform = 'translate(-50%, -50%)';
      logoWrapper.style.display = 'flex';
      logoWrapper.style.flexDirection = 'column';
      logoWrapper.style.alignItems = 'center';
      // SVG logo
      const containerDiv = document.createElement('div');
      containerDiv.className = 'container';
      containerDiv.innerHTML = `
        <svg viewBox="0 0 100 100" style="stroke-width:2;">
          <path class="circle" d="M50 5 a45 45 0 1 1 0 90 a45 45 0 1 1 0 -90" />
          <path class="candle" d="M40 94 v-40 h20 v40" />
          <path class="drip" d="M50 54 v15" />
        </svg>
      `;
      logoWrapper.appendChild(containerDiv);
      // Flame animation
      const holderDiv = document.createElement('div');
      holderDiv.className = 'holder delayed-flame';
      holderDiv.innerHTML = `
        <div class="flame-wrapper">
          <div class="candle-body">
            <div class="blinking-glow"></div>
            <div class="glow"></div>
            <div class="flame"></div>
          </div>
        </div>
      `;
      logoWrapper.appendChild(holderDiv);
      successContainer.appendChild(logoWrapper);

      // Add click event listener to dismiss overlay ONLY after animation is shown
      const dismissHandler = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.remove();
          style.remove();
        }, 300);
      };
      successContainer.addEventListener('click', dismissHandler);
    }
  });

  // Prevent clicks on overlay from reaching the page behind
  overlay.addEventListener('mousedown', (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, true);

  // Assemble the components
  inputContainer.appendChild(textInput);
  chatContainer.appendChild(questionText);
  chatContainer.appendChild(inputContainer);
  overlay.appendChild(chatContainer);
  overlay.appendChild(successContainer);

  document.body.appendChild(overlay);

  // Focus the input after a short delay
  setTimeout(() => {
    textInput.focus();
  }, 100);
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