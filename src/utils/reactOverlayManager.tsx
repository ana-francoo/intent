import { createRoot, Root } from 'react-dom/client';
import IntentionOverlay from '../components/overlay/IntentionOverlay';
import ConflictOverlay from '../components/overlay/ConflictOverlay';

let overlayRoot: Root | null = null;
let overlayContainer: HTMLElement | null = null;

const removeOverlay = (): void => {
  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
};

const createOverlayContainer = (): HTMLElement => {
  removeOverlay();
  
  const container = document.createElement('div');
  container.id = 'intent-react-overlay-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    pointer-events: auto;
  `;
  
  document.body.appendChild(container);
  overlayContainer = container;
  overlayRoot = createRoot(container);
  
  return container;
};

export const showReactIntentionOverlay = (url: string): void => {
  createOverlayContainer();
  
  const handleClose = () => {
    removeOverlay();
  };

  if (overlayRoot) {
    overlayRoot.render(
      <IntentionOverlay 
        url={url} 
        onClose={handleClose}
      />
    );
  }
};

export const showReactConflictOverlay = (
  currentDomain: string, 
  activeIntention: { domain: string; intention: string }
): void => {
  createOverlayContainer();
  
  const handleClose = () => {
    removeOverlay();
  };

  const handleSetNewIntention = () => {
    showReactIntentionOverlay(window.location.href);
  };

  if (overlayRoot) {
    overlayRoot.render(
      <ConflictOverlay 
        currentDomain={currentDomain}
        activeIntention={activeIntention}
        onClose={handleClose}
        onSetNewIntention={handleSetNewIntention}
      />
    );
  }
};

export const removeReactOverlay = (): void => {
  removeOverlay();
};