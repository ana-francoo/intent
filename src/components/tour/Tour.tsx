import { useState, useEffect } from 'react';
import './Tour.css';
import TourText from './TourText';
import { createFloatingPopup } from '@/utils/floatingPopup';

const Tour = () => {
  const [extensionClicked, setExtensionClicked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  // Guide image absolute position (image first; text placed below image)
  const getInitialGuideImage = () => {
    if (typeof window === 'undefined') return { top: 220, right: 110, width: 320 };
    const viewportWidth = window.innerWidth;
    
    const viewportHeight = window.innerHeight;
    const imageTopPercent = 0.22; // keep in sync with calculateDynamicPositions
    return {
      top: Math.max(0, Math.round(viewportHeight * imageTopPercent)),
      right: Math.max(0, Math.round(viewportWidth * 0.12)), // align with text right offset
      width: Math.min(Math.max(Math.round(viewportWidth * 0.4 * 1.3), 220), 650),
    };
  };
  const getInitialArrow = () => {
    if (typeof window === 'undefined') return { top: 10, right: 180, size: 180 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
      top: Math.max(0, Math.round(viewportHeight * 0.02)),
      right: Math.max(0, Math.round(viewportWidth * 0.15)),
      size: Math.min(Math.max(Math.round(viewportWidth * 0.2), 120), 260),
    };
  };
  const getInitialFirstText = () => {
    if (typeof window === 'undefined') return { top: 140, right: 110, fontSize: 18 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
      top: Math.max(0, Math.round(viewportHeight * 0.5)), // moved up a bit above previous placement
      right: Math.max(0, Math.round(viewportWidth * 0.12)),
      fontSize: 24,
    };
  };
  const [arrowPosition, setArrowPosition] = useState(getInitialArrow);
  const [firstTextPosition, setFirstTextPosition] = useState(getInitialFirstText);
  const [guideImagePosition, setGuideImagePosition] = useState(getInitialGuideImage);

  // Calculate dynamic positions based on viewport (sizes remain fixed)
  const calculateDynamicPositions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Arrow positioning (viewport-relative)
    const arrowTopPercent = 0.02;      // 2% from top
    const arrowRightPercent = 0.15;    // 15% from right

    // Image and text positioning (viewport-relative)
    const imageTopPercent = 0.22;      // image anchor from top
    const textTopPercent = 0.5;        // moved text up relative to image
    const textRightPercent = 0.12;     // 12% from right

    // Preserve sizes; only update positions
    setArrowPosition(prev => ({
      ...prev,
      top: Math.max(0, Math.round(viewportHeight * arrowTopPercent)),
      right: Math.max(0, Math.round(viewportWidth * arrowRightPercent)),
    }));

    setFirstTextPosition(prev => ({
      ...prev,
      top: Math.max(0, Math.round(viewportHeight * textTopPercent)),
      right: Math.max(0, Math.round(viewportWidth * textRightPercent)),
      fontSize: prev.fontSize ?? 22,
    }));

    // Guide image: align to the right with the text
    const guideTop = Math.max(0, Math.round(viewportHeight * imageTopPercent));
    const guideRight = Math.max(0, Math.round(viewportWidth * textRightPercent));
    setGuideImagePosition(prev => ({ ...prev, top: guideTop, right: guideRight }));
  };

  useEffect(() => {
    // Set tab title while on the Tour page
    const previousTitle = document.title;
    document.title = 'Intent';

    // Calculate initial positions
    calculateDynamicPositions();
    
    // Start polling for toolbar pin state once per second
    let pollTimer: number | null = null;
    const pollPinState = async () => {
      try {
        // Guard if chrome.action is unavailable in the environment
        if (typeof chrome === 'undefined' || !chrome.action || !chrome.action.getUserSettings) return;
        const settings = await chrome.action.getUserSettings();
        if (settings?.isOnToolbar) {
          setIsPinned(true);
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }
      } catch {
        // ignore
      }
    };
    // immediate check, then every 500ms until true
    pollPinState();
    pollTimer = window.setInterval(pollPinState, 500);

    // Intentionally no resize/orientation listeners: positions are frozen
    
    // Listen for when the extension icon is clicked
    const handleExtensionClick = (message: any) => {
      if (message.type === 'CREATE_VISUAL_ELEMENT' && message.elementType === 'floating-popup') {
        console.log('🎯 Extension icon clicked, hiding arrow and text, creating floating popup');
        setExtensionClicked(true);
        
        // Create the floating popup iframe
        const popupResult = createFloatingPopup({ route: '/' });
        const element = popupResult.element;
        
        // Get viewport and popup dimensions for Tour-specific elements
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popupWidth = 400;
        const popupHeight = 600;
        const centerX = Math.max(0, Math.round((viewportWidth - popupWidth) / 2));
        const centerY = Math.max(0, Math.round((viewportHeight - popupHeight) / 2));
        
        // ===== EASILY MODIFIABLE SVG POSITIONS (Viewport-Relative) =====
        const secondSvgOffsetTopPercent = 0.15;
        const secondSvgOffsetLeftPercent = -0.2;
        const secondSvgWidthPercent = 0.6;
        const secondSvgHeightPercent = 0.6;
        
        const secondSvgOffsetTop = Math.round(viewportHeight * secondSvgOffsetTopPercent);
        const secondSvgOffsetLeft = Math.round(viewportWidth * secondSvgOffsetLeftPercent);
        const secondSvgWidth = Math.round(viewportWidth * secondSvgWidthPercent);
        const secondSvgHeight = Math.round(viewportHeight * secondSvgHeightPercent);
        
        // Helper: position second text relative to the second SVG
        const positionSecondTextRelativeToSvg = () => {
          const svgEl = document.getElementById('additional-svg');
          const textEl = document.getElementById('second-tour-text');
          if (!svgEl || !textEl) return;
          const rect = svgEl.getBoundingClientRect();
          const svgWidth = rect.width;
          const svgHeight = rect.height;
          const textOffsetXPercent = -0.38;
          const textOffsetYPercent = 0.1;
          const leftPx = Math.round(rect.right + svgWidth * textOffsetXPercent);
          const topPx = Math.round(rect.top + svgHeight * textOffsetYPercent);
          textEl.setAttribute(
            'style',
            `position: fixed; top: ${topPx}px; left: ${leftPx}px; z-index: 2147483646; max-width: 25vw; pointer-events: none; animation: tour-text-appear 0.5s ease-out; color: black; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: clamp(0.95rem, 1.5vw, 1.25rem); font-weight: 500; line-height: 1.4; font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;`
          );
        };
        
        // Add resize event listener for Tour-specific elements
        const handleTourResize = () => {
          const newViewportWidth = window.innerWidth;
          const newViewportHeight = window.innerHeight;
          const newPopupWidth = 400;
          const newPopupHeight = 600;
          const newCenterX = Math.max(0, Math.round((newViewportWidth - newPopupWidth) / 2));
          const newCenterY = Math.max(0, Math.round((newViewportHeight - newPopupHeight) / 2));
          
          const newSecondSvgOffsetTop = Math.round(newViewportHeight * secondSvgOffsetTopPercent);
          const newSecondSvgOffsetLeft = Math.round(newViewportWidth * secondSvgOffsetLeftPercent);
          const newSecondSvgWidth = Math.round(newViewportWidth * secondSvgWidthPercent);
          const newSecondSvgHeight = Math.round(newViewportHeight * secondSvgHeightPercent);
          
          const rightContainer = document.getElementById('tour-right-container');
          if (rightContainer) {
            rightContainer.setAttribute(
              'style',
              `position: fixed; top: ${newCenterY + newSecondSvgOffsetTop}px; left: ${newCenterX + newPopupWidth + newSecondSvgOffsetLeft}px; z-index: 2147483645; pointer-events: none; display: inline-flex; align-items: flex-start; gap: 2vw; animation: additional-svg-appear 0.5s ease-out;`
            );
          }
          
          const additionalSvg = document.getElementById('additional-svg');
          if (additionalSvg) {
            additionalSvg.setAttribute(
              'style',
              `width: ${newSecondSvgWidth}px; height: ${newSecondSvgHeight}px; pointer-events: none;`
            );
          }
          
          const continueBtnRepos = document.getElementById('tour-continue-button');
          if (continueBtnRepos) {
            continueBtnRepos.setAttribute(
              'style',
              `position: fixed; top: ${newCenterY + newPopupHeight + Math.round(newPopupHeight * 0.04)}px; left: ${newCenterX + Math.round(newPopupWidth / 2)}px; transform: translateX(-50%); z-index: 2147483646; pointer-events: auto; padding: 10px 16px; border-radius: 10px; background: rgba(0,0,0,0.12); color: #1a1a1a; border: 1px solid rgba(0,0,0,0.15); backdrop-filter: blur(2px); font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; box-shadow: 0 6px 18px rgba(0,0,0,0.15); transition: background 0.2s ease, border-color 0.2s ease; animation: additional-svg-appear 0.5s ease-out;`
            );
          }
          positionSecondTextRelativeToSvg();
        };
        
        window.addEventListener('resize', handleTourResize);
        (element as any)._tourResizeHandler = handleTourResize;
        
        // Override the close button behavior to clean up Tour-specific elements
        const closeButton = element.querySelector('button');
        if (closeButton) {
          const originalOnclick = closeButton.onclick;
          closeButton.onclick = () => {
            if ((element as any)._tourResizeHandler) {
              window.removeEventListener('resize', (element as any)._tourResizeHandler);
            }
            
            const rightContainer = document.getElementById('tour-right-container');
            if (rightContainer) rightContainer.remove();
            
            const continueBtnCleanup = document.getElementById('tour-continue-button');
            if (continueBtnCleanup) continueBtnCleanup.remove();
            
            if (originalOnclick && typeof originalOnclick === 'function') {
              (originalOnclick as any)();
            }
          };
        }
        
        // Add Tour-specific CSS animations if not already present
        if (!document.getElementById('tour-animations')) {
          const style = document.createElement('style');
          style.id = 'tour-animations';
          style.textContent = `
            @keyframes additional-svg-appear {
              0% { opacity: 0; transform: scale(0.8) translateX(20px); }
              100% { opacity: 1; transform: scale(1) translateX(0); }
            }
            @keyframes tour-text-appear {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `;
          document.head.appendChild(style);
        }
        
        // Create additional SVG and text that appear 0.4 seconds later
        setTimeout(() => {
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
            gap: 1vw;
            animation: additional-svg-appear 0.5s ease-out;
          `;
          
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
          
          const secondText = document.createElement('div');
          secondText.id = 'second-tour-text';
          secondText.style.cssText = `position: fixed; top: 0; left: 0; opacity: 0;`;
          secondText.textContent = "All websites are blocked by default. You can unblock and customize additional blocked site settings here";
          
          rightContainer.appendChild(additionalSvg);
          document.body.appendChild(rightContainer);
          document.body.appendChild(secondText);
          
          const continueBtn = document.createElement('button');
          continueBtn.id = 'tour-continue-button';
          continueBtn.textContent = 'Continue';
          continueBtn.style.cssText = `
            position: fixed;
            top: ${centerY + popupHeight + Math.round(popupHeight * 0.04)}px;
            left: ${centerX + Math.round(popupWidth / 2)}px;
            transform: translateX(-50%);
            z-index: 2147483646;
            pointer-events: auto;
            padding: 10px 16px;
            border-radius: 10px;
            background: rgba(0,0,0,0.12);
            color: #1a1a1a;
            border: 1px solid rgba(0,0,0,0.15);
            backdrop-filter: blur(2px);
            font-family: 'Geist', system-ui, Avenir, Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.15);
            transition: background 0.2s ease, border-color 0.2s ease;
            animation: additional-svg-appear 0.5s ease-out;
          `;
          continueBtn.onmouseenter = () => {
            continueBtn.style.background = 'rgba(0,0,0,0.18)';
            continueBtn.style.borderColor = 'rgba(0,0,0,0.22)';
          };
          continueBtn.onmouseleave = () => {
            continueBtn.style.background = 'rgba(0,0,0,0.12)';
            continueBtn.style.borderColor = 'rgba(0,0,0,0.15)';
          };
          document.body.appendChild(continueBtn);
          
          requestAnimationFrame(() => {
            positionSecondTextRelativeToSvg();
            const textEl = document.getElementById('second-tour-text');
            if (textEl) textEl.style.opacity = '1';
          });
        }, 400);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleExtensionClick);
    }
    
    return () => {
      document.title = previousTitle;
      if (pollTimer) clearInterval(pollTimer);
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleExtensionClick);
      }
    };
  }, []);

  return (
    <div className="tour-container">
      {/* Instruction text changes based on pin state */}
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
      
      {/* First text - appears with the arrow until pinned */}
      {!extensionClicked && !isPinned && (
        <TourText
          text="1. Let's start by pinning the Intent extension"
          position={{
            top: firstTextPosition.top,
            right: firstTextPosition.right
          }}
          fontSize={firstTextPosition.fontSize}
          delay={0.6}
        />
      )}

      {/* After pinning, replace with step 2 instruction */}
      {!extensionClicked && isPinned && (
        <TourText
          text="2. Now open the extension by clicking on it"
          position={{
            top: firstTextPosition.top,
            right: firstTextPosition.right
          }}
          fontSize={firstTextPosition.fontSize}
          delay={0.1}
        />
      )}

      {/* Guide image positioned below the text, aligned to the right */}
      {!extensionClicked && (
        <div
          style={{
            position: 'fixed',
            top: `${guideImagePosition.top}px`,
            right: `${guideImagePosition.right}px`,
            width: `${guideImagePosition.width}px`,
            zIndex: 10000,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            background: '#fff',
          }}
        >
          {/* Animated "press" hint over the pin icon area (hidden once pinned). */}
          {!isPinned && (
            <div
              className="pin-press"
              style={{
                top: '58%',   // % of image height
                right: '22.5%', // % of image width from right
              }}
            />
          )}

          {/* After pinned, show a click animation targetting the extension icon area */}
          {isPinned && (
            <>
              {/* Hover rectangle relative to the image container */}
              <div
                className="hover-rect"
                style={{
                  top: '50.5%',
                  left: '34.5%',
                }}
              />
              {/* Mouse click group (pointer + ring) */}
              <div
                className="mouse-click"
                style={{ top: '55%', right: '52%' }}
              >
                {/* Cursor pointer */}
                <svg
                  className="mouse-pointer-svg"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#1f2937"
                  style={{
                    // Fine-tune where the pointer tip sits relative to the ring center
                    ['--pointer-offset-x' as any]: '55%',
                    ['--pointer-offset-y' as any]: '45%',
                  }}
                >
                  <path d="M4 2l14 8-6 2 2 6-3 1-2-6-5 3z" />
                </svg>
                {/* Click ring */}
                <div className="mouse-click-ring" />
              </div>
            </>
          )}
          <img
            src={
              typeof chrome !== 'undefined' && chrome.runtime
                ? chrome.runtime.getURL('src/assets/pin-open.png')
                : 'src/assets/pin-open.png'
            }
            alt="Step 1: Pin the Intent extension, Step 2: Click it to open"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>
      )}
     </div>
   );
 };

export default Tour; 