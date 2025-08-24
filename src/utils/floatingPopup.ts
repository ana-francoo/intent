export interface FloatingPopupOptions {
  onClose?: () => void;
  route?: string;
  draggable?: boolean;
}

export function createFloatingPopup(options: FloatingPopupOptions = {}) {
  const { onClose, route = '', draggable = false } = options;
  
  const existingPopup = document.getElementById('floating-popup-container');
  if (existingPopup) {
    console.log('[FloatingPopup] Popup already exists, not creating duplicate');
    return {
      element: existingPopup,
      cleanup: () => {} 
    };
  }
  
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
    
    // Remove drag event listeners if present
    if ((element as any)._dragHandlers) {
      const { handleMouseMove, handleMouseUp, dragOverlay } = (element as any)._dragHandlers;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (dragOverlay && dragOverlay.parentNode) {
        dragOverlay.removeEventListener('mousedown', (element as any)._dragHandlers.handleMouseDown);
      }
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
  
  if (draggable) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      const rect = element.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      element.style.cursor = 'grabbing';
      e.preventDefault();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffsetX;
      const newY = e.clientY - dragOffsetY;
      
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
      element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'move';
      }
    };
    
    const headerHeight = 96;
    const dragOverlay = document.createElement('div');
    dragOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 36%;
      height: ${headerHeight}px;
      cursor: move;
      user-select: none;
      -webkit-user-select: none;
      pointer-events: auto;
      z-index: 3;
      background: transparent;
    `;
    
    dragOverlay.addEventListener('mousedown', handleMouseDown);
    element.appendChild(dragOverlay);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    (element as any)._dragHandlers = {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      dragOverlay
    };
    
    element.style.cursor = 'move';
  }
  
  // Create iframe to load the actual popup
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 16px;
    background: transparent;
  `;
  
  const url = chrome.runtime.getURL('src/popup/landing.html');
  iframe.src = `${url}#${route || '/'}`;
  
  element.appendChild(iframe);
  document.body.appendChild(element);
  
  // Return cleanup function so caller can remove popup programmatically
  return {
    element,
    cleanup
  };
}