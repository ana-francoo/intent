import { useState, useEffect, useRef } from 'react';
import './Tour.css';
import TourText from './TourText';

const Tour = () => {
  const [extensionClicked, setExtensionClicked] = useState(false);
  const [arrowPosition, setArrowPosition] = useState({ top: 10, right: 180, size: 180 });
  const [firstTextPosition, setFirstTextPosition] = useState({ top: 140, right: 110, fontSize: 18 });
  const resizeRafRef = useRef<number | null>(null);

  // Calculate dynamic positions based on viewport
  const calculateDynamicPositions = () => {
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Arrow positioning (viewport-relative)
    const arrowTopPercent = 0.02;      // 2% from top
    const arrowRightPercent = 0.15;    // 15% from right

    // First text positioning (viewport-relative)
    const textTopPercent = 0.15;       // 15% from top
    const textRightPercent = 0.12;     // 12% from right

    // Arrow sizing (viewport-relative with clamping)
    const arrowSizePercent = 0.20;     // 20% of viewport width
    const computedArrowSize = Math.round(viewportWidth * arrowSizePercent);
    const arrowSize = clamp(computedArrowSize, 120, 260);

    // Text sizing (viewport-relative with clamping)
    const textSizePercent = 0.015;     // 1.5% of viewport width
    const computedFontSize = Math.round(viewportWidth * textSizePercent);
    const fontSize = clamp(computedFontSize, 12, 22);

    setArrowPosition({
      top: Math.max(0, Math.round(viewportHeight * arrowTopPercent)),
      right: Math.max(0, Math.round(viewportWidth * arrowRightPercent)),
      size: arrowSize,
    });

    setFirstTextPosition({
      top: Math.max(0, Math.round(viewportHeight * textTopPercent)),
      right: Math.max(0, Math.round(viewportWidth * textRightPercent)),
      fontSize,
    });
  };

  useEffect(() => {
    // Calculate initial positions
    calculateDynamicPositions();
    
    // Add resize listener for dynamic positioning (raf to avoid thrash)
    const handleResize = () => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(() => {
        calculateDynamicPositions();
      });
    };
    window.addEventListener('resize', handleResize);
    
    // Listen for when the extension icon is clicked
    const handleExtensionClick = (message: any) => {
      if (message.type === 'CREATE_VISUAL_ELEMENT' && message.elementType === 'floating-popup') {
        console.log('🎯 Extension icon clicked, hiding arrow and text, creating floating popup');
        setExtensionClicked(true);
        
        // Create the floating popup iframe
        createFloatingPopup(message.position || { x: 100, y: 100 });
      }
    };

    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleExtensionClick);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleExtensionClick);
      }
    };
  }, []);

  const createFloatingPopup = (position: { x: number, y: number }) => {
    // Calculate center position based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 400;
    const popupHeight = 600;
    
    const centerX = Math.max(0, (viewportWidth - popupWidth) / 2);
    const centerY = Math.max(0, (viewportHeight - popupHeight) / 2);
    
    // ===== EASILY MODIFIABLE SVG POSITIONS (Viewport-Relative) =====
    // Adjust these values to change SVG positions (percentages of viewport)
    const secondSvgOffsetTopPercent = 0.15;    // 15% of viewport height below popup center
    const secondSvgOffsetLeftPercent = -0.25;   // 25% of viewport width left of popup
    const secondSvgWidthPercent = 0.6;        // 60% of viewport width
    const secondSvgHeightPercent = 0.6;       // 60% of viewport height
    
    // Calculate actual pixel values based on viewport
    const secondSvgOffsetTop = Math.round(viewportHeight * secondSvgOffsetTopPercent);
    const secondSvgOffsetLeft = Math.round(viewportWidth * secondSvgOffsetLeftPercent);
    const secondSvgWidth = Math.round(viewportWidth * secondSvgWidthPercent);
    const secondSvgHeight = Math.round(viewportHeight * secondSvgHeightPercent);
    // ===========================================
    
    const element = document.createElement('div');
    
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
      
      const newCenterX = Math.max(0, (newViewportWidth - popupWidth) / 2);
      const newCenterY = Math.max(0, (newViewportHeight - popupHeight) / 2);
      
      element.style.left = `${newCenterX}px`;
      element.style.top = `${newCenterY}px`;
      
      // Update SVG and text positions dynamically
      const newSecondSvgOffsetTop = Math.round(newViewportHeight * secondSvgOffsetTopPercent);
      const newSecondSvgOffsetLeft = Math.round(newViewportWidth * secondSvgOffsetLeftPercent);
      const newSecondSvgWidth = Math.round(newViewportWidth * secondSvgWidthPercent);
      const newSecondSvgHeight = Math.round(newViewportHeight * secondSvgHeightPercent);
      // Update the right-side container (keeps arrow location constant)
      const rightContainer = document.getElementById('tour-right-container');
      if (rightContainer) {
        rightContainer.setAttribute(
          'style',
          `position: fixed; top: ${newCenterY + newSecondSvgOffsetTop}px; left: ${newCenterX + popupWidth + newSecondSvgOffsetLeft}px; z-index: 2147483645; pointer-events: none; display: inline-flex; align-items: flex-start; gap: 2vw; animation: additional-svg-appear 0.5s ease-out;`
        );
      }

      // Update arrow size responsively (position comes from container)
      const additionalSvg = document.getElementById('additional-svg');
      if (additionalSvg) {
        additionalSvg.setAttribute(
          'style',
          `width: ${newSecondSvgWidth}px; height: ${newSecondSvgHeight}px; pointer-events: none;`
        );
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Store the resize handler on the element for cleanup
    (element as any)._resizeHandler = handleResize;
    
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
    
    closeButton.onclick = () => {
      // Remove resize event listener
      if ((element as any)._resizeHandler) {
        window.removeEventListener('resize', (element as any)._resizeHandler);
      }
      
      // Remove the right-side container (arrow + text) if it exists
      const rightContainer = document.getElementById('tour-right-container');
      if (rightContainer) {
        rightContainer.remove();
      }
      
      // Add fade-out animation
      element.style.animation = 'floating-popup-disappear 0.3s ease-in forwards';
      
      // Remove element after animation completes
      setTimeout(() => {
        element.remove();
        style.remove();
      }, 300);
    };
    
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
    
    // Add a parameter to prevent infinite loop
    iframe.src = chrome.runtime.getURL('src/popup/index.html') + '?floating=true';
    
    element.appendChild(iframe);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floating-popup-appear {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      @keyframes floating-popup-disappear {
        0% { opacity: 1; transform: scale(1) translateY(0); }
        100% { opacity: 0; transform: scale(0.8) translateY(20px); }
      }
      
      @keyframes additional-svg-appear {
        0% { opacity: 0; transform: scale(0.8) translateX(20px); }
        100% { opacity: 1; transform: scale(1) translateX(0); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(element);
    
    // Create additional SVG and text that appear 0.4 seconds later
    setTimeout(() => {
      // Right-side container to align arrow and text horizontally
      const rightContainer = document.createElement('div');
      rightContainer.id = 'tour-right-container';
      rightContainer.style.cssText = `
        position: fixed;
        top: ${centerY + secondSvgOffsetTop}px;
        left: ${centerX + popupWidth + secondSvgOffsetLeft}px;
        z-index: 2147483645;
        pointer-events: none;
        display: inline-flex;
        align-items: flex-start;
        gap: 2vw; /* responsive spacing between arrow and text */
        animation: additional-svg-appear 0.5s ease-out;
      `;

      // The second (squiggly) arrow
      const additionalSvg = document.createElement('div');
      additionalSvg.id = 'additional-svg';
      additionalSvg.style.cssText = `
        width: ${secondSvgWidth}px;
        height: ${secondSvgHeight}px;
        pointer-events: none;
      `;
      additionalSvg.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none" style="width: 100%; height: 100%;">
          <path d="M168.97138,43.22749c12.64149,0,12.90694,18.62863,12.90694,28.16059c0,14.17547-8.24082,31.42365-2.73783,43.80536.26999.60748.72094,1.37841.39112,1.9556-1.41257,2.47199-4.67465,2.15888-5.08455,6.25791-1.13699,11.36992,5.7975,26.79941,6.64903,38.72081.56991,7.97879.51404,29.72506-11.34246,29.72506" transform="translate(-18.97138 21.120441)" fill="none" stroke="#ff6b35" stroke-width="2"/>
        </svg>
      `;

      // The explanatory text to the right of the arrow
      const secondText = document.createElement('div');
      secondText.id = 'second-tour-text';
      secondText.style.cssText = `
        position: relative; /* positioned by flex container, not absolute */
        max-width: 25vw; /* responsive width cap */
        pointer-events: none;
        animation: tour-text-appear 0.5s ease-out;
        color: black;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        font-size: clamp(0.95rem, 1.5vw, 1.25rem); /* responsive font, no px */
        font-weight: 500;
        line-height: 1.4;
        font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
      `;
      secondText.textContent = "All websites are blocked by default. You can unblock and customize additional blocked site settings here";

      rightContainer.appendChild(additionalSvg);
      rightContainer.appendChild(secondText);
      document.body.appendChild(rightContainer);
    }, 400);
  };

  return (
    <div className="tour-container">
      {/* White background */}
      <div className="tour-background"></div>
      
      {/* Squiggly arrow pointing to top right - hidden when extension is clicked */}
      {!extensionClicked && (
        <div 
          className="tour-arrow"
          style={{
            top: `${arrowPosition.top}px`,
            right: `${arrowPosition.right}px`
          }}
        >
          <svg 
            width={arrowPosition.size} 
            height={arrowPosition.size} 
            viewBox="0 0 300 300" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="arrow-svg"
          >
            <g transform="matrix(2.866928 0 0 2.7726-42.151342-361.726266)">
              <path d="M184.45817,163.48724c16.49325-2.06166,29.20963-21.42272,35.04981-35.04981" transform="matrix(2.093763 0 0 1.610628-344.452366-72.639951)" fill="none" stroke="#ff6b35"/>
              <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(1.728749 0 0 1.14198-264.022798-13.373526)" fill="none" stroke="#ff6b35"/>
              <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(-1.586704-1.373376-.74282 0.858203 558.235564 324.389133)" fill="none" stroke="#ff6b35"/>
            </g>
          </svg>
        </div>
      )}
      
      {/* First text - appears with the arrow */}
      {!extensionClicked && (
        <TourText
          text="Click on the chrome extension icon to open Intent"
          position={{
            top: firstTextPosition.top,
            right: firstTextPosition.right
          }}
          fontSize={firstTextPosition.fontSize}
          delay={0.6}
        />
      )}
     </div>
   );
 };

export default Tour; 