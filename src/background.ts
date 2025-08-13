// Background script for Chrome extension
import { cleanupExpiredIntentions } from './utils/storage';
import { checkExistingSession } from './utils/auth';

console.log('[CRXJS] Background script loaded');

// Clean up expired intentions every hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Initial cleanup on extension startup
cleanupExpiredIntentions().then(cleanedCount => {
  if (cleanedCount > 0) {
    console.log(`[Background] Initial cleanup: removed ${cleanedCount} expired intentions`);
  }
});

checkExistingSession().then(session => {
  if (session) {
    console.log('[Background] Existing session found for user:', session.user?.email);
  } else {
    console.log('[Background] No existing session found');
  }
});

// Set up periodic cleanup
setInterval(async () => {
  const cleanedCount = await cleanupExpiredIntentions();
  if (cleanedCount > 0) {
    console.log(`[Background] Periodic cleanup: removed ${cleanedCount} expired intentions`);
  }
}, CLEANUP_INTERVAL_MS);

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  console.log('[Background] Details:', details);
  
  if (details.reason === 'install' || details.reason === 'chrome_update') {
    console.log('[Background] Opening welcome page...');
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/popup/index.html#/welcome')
    }).then((tab) => {
      console.log('[Background] Welcome page tab created:', tab);
    }).catch((error) => {
      console.error('[Background] Error creating welcome page tab:', error);
    });
  }
  
  // Clean up on installation/update
  cleanupExpiredIntentions().then(cleanedCount => {
    if (cleanedCount > 0) {
      console.log(`[Background] Post-install cleanup: removed ${cleanedCount} expired intentions`);
    }
  });
});

// Listen for when extension icon is clicked (only fires when no popup is defined in manifest)
chrome.action.onClicked?.addListener(async (tab) => {
  console.log('🎯 Extension icon clicked, creating floating popup...');
  if (tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'CREATE_VISUAL_ELEMENT',
        elementType: 'floating-popup',
        position: { x: 100, y: 100 }
      });
      console.log('✅ Floating popup message sent successfully');
    } catch (error) {
      console.log('Could not send message to tab (might be a chrome:// page)');
    }
  }
  
  // Also send message to popup if it's open (for Tour component)
  try {
    await chrome.runtime.sendMessage({
      type: 'CREATE_VISUAL_ELEMENT',
      elementType: 'floating-popup',
      position: { x: 100, y: 100 }
    });
    console.log('✅ Extension icon clicked message sent to popup');
  } catch (error) {
    console.log('Could not send message to popup (popup might not be open)');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POPUP_OPENED') {
    console.log('🎯 Popup opened message received:', message);
    // Popup has opened, trigger visual element on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      console.log('📋 Current tabs:', tabs);
      if (tabs[0]?.id) {
        try {
          console.log('📤 Sending message to tab:', tabs[0].id);
          await chrome.tabs.sendMessage(tabs[0].id, {
            type: 'CREATE_VISUAL_ELEMENT',
            elementType: message.elementType || 'red-blob',
            position: message.position || { x: 100, y: 100 }
          });
          console.log('✅ Message sent successfully to tab');
        } catch (error) {
          console.error('❌ Could not send message to tab:', error);
        }
      } else {
        console.log('❌ No active tab found');
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CLEANUP_INTENTIONS') {
    cleanupExpiredIntentions().then(cleanedCount => {
      sendResponse({ cleanedCount });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'GET_STORAGE_INFO') {
    // Return storage information for debugging
    chrome.storage.local.get(null).then((data) => {
      const intentionCount = Object.keys(data).filter(key => 
        data[key] && data[key].intention
      ).length;
      
      sendResponse({ 
        totalEntries: Object.keys(data).length,
        intentionEntries: intentionCount
      });
    });
    return true;
  }
  
  // this is used in the landing page to open the extension
  if (message.type === 'OPEN_POPUP') {
    try {
      // Try to open popup first (works in some contexts)
      chrome.action.openPopup().then(() => {
        console.log('[Background] Popup opened successfully');
        sendResponse({ success: true, method: 'popup' });
      }).catch((popupError) => {
        console.log('[Background] Popup failed, opening in new tab:', popupError);
        // Fallback to opening in a new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/popup/index.html#/')
        }).then((tab) => {
          sendResponse({ success: true, method: 'tab', tabId: tab.id });
        }).catch((tabError) => {
          sendResponse({ success: false, error: String(tabError) });
        });
      });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
  
  // Handle opening popup with specific route
  if (message.type === 'OPEN_POPUP_WITH_ROUTE') {
    const route = message.route || '/';
    try {
      const normalizedRoute = String(route).startsWith('/') ? route : `/${route}`;
      const url = chrome.runtime.getURL(`src/popup/index.html#${normalizedRoute}`);
      chrome.tabs
        .create({ url })
        .then((tab) => {
          sendResponse({ success: true, fallback: 'tab', tabId: tab.id });
        })
        .catch((error) => {
          sendResponse({ success: false, error: String(error) });
        });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
  
  // Handle creating visual elements on current page
  if (message.type === 'CREATE_VISUAL_ELEMENT') {
    try {
      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          // Send message to content script to create the visual element
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'CREATE_VISUAL_ELEMENT',
            elementType: message.elementType || 'red-blob',
            position: message.position || { x: 100, y: 100 }
          }).then(() => {
            sendResponse({ success: true });
          }).catch((error) => {
            sendResponse({ success: false, error: String(error) });
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[Background] External message received:', message.type, 'from:', sender.origin);
  
  if (message.type === 'AUTH_SUCCESS' && message.session) {
    console.log('[Background] Processing AUTH_SUCCESS with session');
    
    const sessionData = {
      'supabase.auth.token': JSON.stringify({
        currentSession: {
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
          user: message.session.user,
        },
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiry
      })
    };
    
    chrome.storage.local.set(sessionData, () => {
      console.log('[Background] Session stored successfully');
      
      // Close the auth tab
      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id).catch(() => {
          console.log('[Background] Could not close auth tab');
        });
      }
      
      console.log('[Background] Auth successful, auth page will handle popup creation');
      sendResponse({ success: true, method: 'floating_popup' });
    });
    
    return true;
  }
  
  if (message.type === 'OPEN_POPUP') {
    // Handle OPEN_POPUP from external source
    console.log('[Background] External OPEN_POPUP request');
    chrome.action.openPopup().then(() => {
      sendResponse({ success: true, method: 'popup' });
    }).catch(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html#/')
      }).then(() => {
        sendResponse({ success: true, method: 'tab' });
      }).catch((error) => {
        sendResponse({ success: false, error: String(error) });
      });
    });
    return true;
  }
  
  sendResponse({ success: false, error: 'Unknown message type' });
}); 