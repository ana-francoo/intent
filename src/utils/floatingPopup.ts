export interface FloatingPopupOptions {
  onClose?: () => void;
  route?: string;
}

export function createFloatingPopup(options: FloatingPopupOptions = {}) {
  const { onClose, route = '' } = options;
  
  // Calculate center position and dimensions based on viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Use fixed popup dimensions to match the inner iframe's layout (400x600)
  const getPopupDimensions = () => ({ width: 400, height: 600 });
  const { width: popupWidth, height: popupHeight } = getPopupDimensions();
  const centerX = Math.max(0, Math.round((viewportWidth - popupWidth) / 2));
  const centerY = Math.max(0, Math.round((viewportHeight - popupHeight) / 2));
  
  const element = document.createElement('div');
  element.id = 'floating-popup-container';
  
  element.style.cssText = `
    position: fixed;
    top: ${centerY}px;
    left: ${centerX}px;
    width: ${popupWidth}px;
    height: ${popupHeight}px;
    background: radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%);
    border-radius: 16px;
    z-index: 2147483646;
    pointer-events: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 148, 77, 0.2);
    border: 1px solid rgba(255, 148, 77, 0.2);
    overflow: hidden;
    animation: floating-popup-appear 0.3s ease-out;
    font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
  `;
  
  // Add resize event listener to keep popup centered
  const handleResize = () => {
    const newViewportWidth = window.innerWidth;
    const newViewportHeight = window.innerHeight;
    const { width: newPopupWidth, height: newPopupHeight } = getPopupDimensions();

    // Update popup size and center position
    element.style.width = `${newPopupWidth}px`;
    element.style.height = `${newPopupHeight}px`;
    const newCenterX = Math.max(0, Math.round((newViewportWidth - newPopupWidth) / 2));
    const newCenterY = Math.max(0, Math.round((newViewportHeight - newPopupHeight) / 2));
    element.style.left = `${newCenterX}px`;
    element.style.top = `${newCenterY}px`;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Store the resize handler on the element for cleanup
  (element as any)._resizeHandler = handleResize;
  
  // Add CSS animations if not already present
  if (!document.getElementById('floating-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'floating-popup-styles';
    style.textContent = `
      @keyframes floating-popup-appear {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      @keyframes floating-popup-disappear {
        0% { opacity: 1; transform: scale(1) translateY(0); }
        100% { opacity: 0; transform: scale(0.8) translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Cleanup function
  const cleanup = () => {
    // Remove resize event listener
    if ((element as any)._resizeHandler) {
      window.removeEventListener('resize', (element as any)._resizeHandler);
    }
    
    // Add fade-out animation
    element.style.animation = 'floating-popup-disappear 0.3s ease-in forwards';
    
    // Remove element after animation completes
    setTimeout(() => {
      element.remove();
      // Call onClose callback if provided
      if (onClose) onClose();
    }, 300);
  };
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: rgba(255, 148, 77, 0.2);
    border: 1px solid rgba(255, 148, 77, 0.3);
    border-radius: 50%;
    color: #F5E6D3;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    transition: all 0.2s ease;
  `;
  
  closeButton.onmouseover = () => {
    closeButton.style.background = 'rgba(255, 148, 77, 0.4)';
    closeButton.style.borderColor = 'rgba(255, 148, 77, 0.5)';
  };
  
  closeButton.onmouseout = () => {
    closeButton.style.background = 'rgba(255, 148, 77, 0.2)';
    closeButton.style.borderColor = 'rgba(255, 148, 77, 0.3)';
  };
  
  closeButton.onclick = cleanup;
  
  element.appendChild(closeButton);
  
  // Create iframe to load the actual popup
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 16px;
    background: transparent;
  `;
  
  // Add a parameter to prevent infinite loop and include the route
  const url = chrome.runtime.getURL('src/popup/index.html');
  const params = new URLSearchParams({ floating: 'true' });
  if (route) params.append('route', route);
  iframe.src = `${url}#${route}?${params.toString()}`;
  
  element.appendChild(iframe);
  document.body.appendChild(element);
  
  // Return cleanup function so caller can remove popup programmatically
  return {
    element,
    cleanup
  };
}