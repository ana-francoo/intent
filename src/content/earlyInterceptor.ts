// Early route interceptor that runs before page content loads
// This script should be injected with "document_start" to catch pages before they load

import { initializeRouteInterceptor } from '../utils/routeInterceptor';

console.log('🛡️ Early interceptor loaded for:', window.location.href);

// Run interceptor immediately when script loads
(async () => {
  try {
    await initializeRouteInterceptor();
  } catch (error) {
    console.error('❌ Error in early interceptor:', error);
  }
})();

// Also listen for DOM ready in case we missed the initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await initializeRouteInterceptor();
    } catch (error) {
      console.error('❌ Error in DOMContentLoaded interceptor:', error);
    }
  });
} else {
  // DOM is already ready
  (async () => {
    try {
      await initializeRouteInterceptor();
    } catch (error) {
      console.error('❌ Error in immediate interceptor:', error);
    }
  })();
}