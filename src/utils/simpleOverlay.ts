import { setActiveIntention, normalizeUrlToDomain } from './intentionManager';

export const showIntentionOverlay = (url: string): void => {
  const existingOverlay = document.getElementById('intent-simple-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const domain = normalizeUrlToDomain(url);
  const websiteName = domain.charAt(0).toUpperCase() + domain.slice(1);

  const overlay = document.createElement('div');
  overlay.id = 'intent-simple-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%);
    backdrop-filter: blur(8px);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
    color: white;
  `;

  const candleContainer = document.createElement('div');
  candleContainer.id = 'candle-container';
  candleContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px;
  `;

  const candle = document.createElement('div');
  candle.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 20px;
  `;

  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('src/assets/logo2.png');
  logo.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.8;
  `;

  const wick = document.createElement('div');
  wick.style.cssText = `
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 15px;
    background: #333;
    border-radius: 2px;
  `;

  candle.appendChild(logo);
  candle.appendChild(wick);
  candleContainer.appendChild(candle);

  const inputSection = document.createElement('div');
  inputSection.style.cssText = `
    text-align: center;
    max-width: 500px;
    width: 90%;
  `;

  const question = document.createElement('h2');
  question.textContent = `What's your intention for visiting ${websiteName}?`;
  question.style.cssText = `
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 20px;
    line-height: 1.4;
  `;

  const input = document.createElement('textarea');
  input.placeholder = 'Type your intention here...';
  input.style.cssText = `
    width: 100%;
    padding: 16px;
    font-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-family: inherit;
    resize: none;
    outline: none;
    min-height: 60px;
    max-height: 120px;
    overflow-y: auto;
  `;

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitIntention();
    }
  });

  // Submit function
  const submitIntention = async () => {
    const intention = input.value.trim();
    if (!intention) return;

    try {
      // Hide input section
      inputSection.style.display = 'none';
      
      // Show flame animation
      showFlameAnimation(candleContainer, intention);
      
      // Save intention
      await setActiveIntention(domain, intention);
      
      // Remove overlay after animation
      setTimeout(() => {
        overlay.remove();
      }, 2000);
      
    } catch (error) {
      console.error('Error setting intention:', error);
      // Show error and restore input
      inputSection.style.display = 'block';
      alert('Error setting intention. Please try again.');
    }
  };

  // Assemble components
  inputSection.appendChild(question);
  inputSection.appendChild(input);
  overlay.appendChild(candleContainer);
  overlay.appendChild(inputSection);

  // Add to page
  document.body.appendChild(overlay);

  // Focus input
  setTimeout(() => input.focus(), 100);

  // Prevent clicks from reaching page
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
};

/**
 * Show flame animation when intention is set
 */
const showFlameAnimation = (candleContainer: HTMLElement, intention: string): void => {
  // Clear existing content
  candleContainer.innerHTML = '';

  // Create flame container
  const flameContainer = document.createElement('div');
  flameContainer.style.cssText = `
    position: relative;
    width: 120px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Logo background
  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('src/assets/logo2.png');
  logo.style.cssText = `
    width: 120px;
    height: 120px;
    object-fit: contain;
    opacity: 0.6;
    position: absolute;
    bottom: 0;
  `;

  // Flame element
  const flame = document.createElement('div');
  flame.style.cssText = `
    position: absolute;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 40px;
    background: linear-gradient(to top, #ff6000 0%, #ff8c00 50%, #ffd700 100%);
    border-radius: 50% 50% 20% 20%;
    opacity: 0;
    animation: flameIgnite 0.5s ease-out forwards, flameFlicker 2s ease-in-out infinite 0.5s;
  `;

  // Add flame animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes flameIgnite {
      0% { 
        opacity: 0; 
        height: 0px; 
        transform: translateX(-50%) scale(0.1); 
      }
      50% { 
        opacity: 1; 
        height: 60px; 
        transform: translateX(-50%) scale(1.2); 
      }
      100% { 
        opacity: 1; 
        height: 40px; 
        transform: translateX(-50%) scale(1); 
      }
    }
    @keyframes flameFlicker {
      0%, 100% { 
        transform: translateX(-50%) rotate(-2deg) scale(1); 
      }
      50% { 
        transform: translateX(-50%) rotate(2deg) scale(1.05); 
      }
    }
  `;
  document.head.appendChild(style);

  // Assemble flame
  flameContainer.appendChild(logo);
  flameContainer.appendChild(flame);
  candleContainer.appendChild(flameContainer);

  // Show intention text below
  const intentionText = document.createElement('div');
  intentionText.textContent = intention;
  intentionText.style.cssText = `
    margin-top: 30px;
    font-size: 18px;
    font-weight: 400;
    text-align: center;
    max-width: 400px;
    line-height: 1.4;
    opacity: 0;
    animation: fadeIn 0.5s ease-out 1s forwards;
  `;

  // Add fade in animation
  const fadeStyle = document.createElement('style');
  fadeStyle.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(fadeStyle);

  candleContainer.appendChild(intentionText);
};

/**
 * Show conflict overlay when visiting different site with active intention
 */
export const showConflictOverlay = (currentDomain: string, activeIntention: { domain: string; intention: string }): void => {
  // Remove any existing overlay
  const existingOverlay = document.getElementById('intent-simple-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const currentSiteName = currentDomain.charAt(0).toUpperCase() + currentDomain.slice(1);
  const activeSiteName = activeIntention.domain.charAt(0).toUpperCase() + activeIntention.domain.slice(1);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'intent-simple-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(ellipse at 50% 30%, rgba(43, 37, 37, 0.99) 60%, rgba(0, 0, 0, 0.99) 100%);
    backdrop-filter: blur(8px);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
    color: white;
    text-align: center;
  `;

  // Content container
  const content = document.createElement('div');
  content.style.cssText = `
    max-width: 500px;
    padding: 40px;
  `;

  // Title
  const title = document.createElement('h2');
  title.textContent = 'You have an active intention';
  title.style.cssText = `
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 20px;
  `;

  // Current intention display
  const intentionDisplay = document.createElement('div');
  intentionDisplay.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  `;

  const intentionLabel = document.createElement('div');
  intentionLabel.textContent = `Your intention for ${activeSiteName}:`;
  intentionLabel.style.cssText = `
    font-size: 14px;
    opacity: 0.8;
    margin-bottom: 8px;
  `;

  const intentionText = document.createElement('div');
  intentionText.textContent = activeIntention.intention;
  intentionText.style.cssText = `
    font-size: 18px;
    font-weight: 500;
    line-height: 1.4;
  `;

  intentionDisplay.appendChild(intentionLabel);
  intentionDisplay.appendChild(intentionText);

  // Message
  const message = document.createElement('p');
  message.textContent = `You're trying to visit ${currentSiteName}. What would you like to do?`;
  message.style.cssText = `
    font-size: 18px;
    margin-bottom: 30px;
    line-height: 1.4;
  `;

  // Buttons container
  const buttons = document.createElement('div');
  buttons.style.cssText = `
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  `;

  // Button styles
  const buttonStyle = `
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: all 0.2s ease;
  `;

  // Continue with current intention button
  const continueBtn = document.createElement('button');
  continueBtn.textContent = `Continue with ${activeSiteName}`;
  continueBtn.style.cssText = buttonStyle + `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  `;
  continueBtn.addEventListener('click', () => {
    // Go back to the active intention site
    window.location.href = `https://${activeIntention.domain}`;
  });

  // Set new intention button
  const newIntentionBtn = document.createElement('button');
  newIntentionBtn.textContent = `Set intention for ${currentSiteName}`;
  newIntentionBtn.style.cssText = buttonStyle + `
    background: #ff6000;
    color: white;
  `;
  newIntentionBtn.addEventListener('click', () => {
    overlay.remove();
    showIntentionOverlay(window.location.href);
  });

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Go back';
  cancelBtn.style.cssText = buttonStyle + `
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  cancelBtn.addEventListener('click', () => {
    window.history.back();
  });

  // Hover effects
  [continueBtn, newIntentionBtn, cancelBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
  });

  // Assemble components
  buttons.appendChild(continueBtn);
  buttons.appendChild(newIntentionBtn);
  buttons.appendChild(cancelBtn);

  content.appendChild(title);
  content.appendChild(intentionDisplay);
  content.appendChild(message);
  content.appendChild(buttons);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Prevent clicks from reaching page
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
};