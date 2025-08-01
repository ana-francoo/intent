import { createRoot, Root } from 'react-dom/client';
import IntentionOverlay from '../components/overlay/IntentionOverlay';
import { Toaster } from '../components/ui/toaster';

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
      <>
        <IntentionOverlay 
          url={url} 
          onClose={handleClose}
        />
        <Toaster />
      </>
    );
  }
};

export const removeReactOverlay = (): void => {
  removeOverlay();
};