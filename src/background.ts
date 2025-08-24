import { cleanupExpiredIntentions } from "./utils/storage";
import { checkExistingSession } from "./utils/auth";

console.log("[CRXJS] Background script loaded");

// Clean up expired intentions every hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Initial cleanup on extension startup
cleanupExpiredIntentions().then((cleanedCount) => {
  if (cleanedCount > 0) {
    console.log(
      `[Background] Initial cleanup: removed ${cleanedCount} expired intentions`
    );
  }
});

checkExistingSession().then((session) => {
  if (session) {
    console.log(
      "[Background] Existing session found for user:",
      session.user?.email
    );
  } else {
    console.log("[Background] No existing session found");
  }
});

// Set up periodic cleanup
setInterval(async () => {
  const cleanedCount = await cleanupExpiredIntentions();
  if (cleanedCount > 0) {
    console.log(
      `[Background] Periodic cleanup: removed ${cleanedCount} expired intentions`
    );
  }
}, CLEANUP_INTERVAL_MS);

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Background] Extension installed/updated:", details.reason);
  console.log("[Background] Details:", details);

  if (details.reason === "install" || details.reason === "chrome_update") {
    console.log("[Background] Opening welcome page...");
    chrome.tabs
      .create({
        url: chrome.runtime.getURL("src/popup/landing.html#/welcome"),
      })
      .then((tab) => {
        console.log("[Background] Welcome page tab created:", tab);
      })
      .catch((error) => {
        console.error("[Background] Error creating welcome page tab:", error);
      });
  }

  // Clean up on installation/update
  cleanupExpiredIntentions().then((cleanedCount) => {
    if (cleanedCount > 0) {
      console.log(
        `[Background] Post-install cleanup: removed ${cleanedCount} expired intentions`
      );
    }
  });
});

// Note: chrome.action.onClicked won't fire since we have default_popup defined
// The PopupLauncher component handles creating the floating iframe instead
/* chrome.action.onClicked?.addListener(async (tab) => {
  console.log("🎯 Extension icon clicked");
  console.log("🔍 Current tab URL:", tab.url);
  
  // Check if we're on the tour page
  const isOnTourPage = tab.url && (tab.url.includes('#/tour') || tab.url.includes('tour=1'));
  
  // Only check session if not on tour page
  if (!isOnTourPage) {
    const session = await checkExistingSession();
    const isAuthenticated = !!session;
    
    if (!isAuthenticated) {
      console.log("🚀 User not authenticated, opening welcome page in new tab...");
      chrome.tabs.create({
        url: chrome.runtime.getURL("src/popup/landing.html#/welcome"),
        active: true
      });
      return;
    }
  }

  // Check if we can inject into this tab
  const canInject =
    tab.id &&
    tab.url &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("edge://") &&
    !tab.url.startsWith("brave://") &&
    !tab.url.startsWith("dia://") &&
    !tab.url.startsWith("arc://") &&
    !tab.url.startsWith("about:") &&
    !tab.url.startsWith("file://") &&
    !tab.url.includes("chrome.google.com/webstore");

  if (!canInject) {
    console.log("❌ Cannot inject into this page type");
    return;
  }

  if (tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "PING" });

      // Check if user is on welcome page or tour page
      const isWelcomeOrTour = tab.url && 
        (tab.url.includes('#/welcome') || 
         tab.url.includes('#/tour') || 
         tab.url.includes('tour=1'));

      console.log("🔍 Is welcome or tour page:", isWelcomeOrTour);

      await chrome.tabs.sendMessage(tab.id, {
        type: "CREATE_VISUAL_ELEMENT",
        elementType: "floating-popup",
        position: { x: 100, y: 100 },
        skipAuth: isWelcomeOrTour, // Pass context to skip auth check
      });
      console.log("✅ Floating popup message sent to existing content script");
    } catch (error) {
      console.log("Content script not loaded, injecting it now...");

      try {
        // Get the actual content script file from the manifest
        const contentScriptFile = chrome.runtime.getManifest().content_scripts?.[1]?.js?.[0];
        if (contentScriptFile) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [contentScriptFile],
          });
        } else {
          console.error("Could not find content script file in manifest");
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if user is on welcome page or tour page
        const isWelcomeOrTour = tab.url && 
          (tab.url.includes('#/welcome') || 
           tab.url.includes('#/tour') || 
           tab.url.includes('tour=1'));

        console.log("🔍 Is welcome or tour page (after inject):", isWelcomeOrTour);

        await chrome.tabs.sendMessage(tab.id, {
          type: "CREATE_VISUAL_ELEMENT",
          elementType: "floating-popup",
          position: { x: 100, y: 100 },
          skipAuth: isWelcomeOrTour, // Pass context to skip auth check
        });
        console.log("✅ Content script injected and floating popup created");
      } catch (injectError) {
        console.error("Failed to inject content script:", injectError);
      }
    }
  } else {
    console.log("Cannot inject into this page (restricted URL). Extension cannot run on chrome://, edge://, about:, or file:// pages.");
  }

  // Also send message to popup if it's open (for Tour component)
  try {
    await chrome.runtime.sendMessage({
      type: "CREATE_VISUAL_ELEMENT",
      elementType: "floating-popup",
      position: { x: 100, y: 100 },
    });
    console.log("✅ Extension icon clicked message sent to popup");
  } catch (error) {
    console.log("Could not send message to popup (popup might not be open)");
  }
}); */

// Handle Tour page extension click through message passing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_TOUR_WITH_FLOATING_POPUP") {
    // Open Tour in a tab and trigger floating popup
    console.log("🎯 Opening Tour in tab with floating popup");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      if (currentTab?.url?.includes('#/tour')) {
        // Already on Tour page, just create floating popup
        chrome.tabs.sendMessage(currentTab.id!, {
          type: "CREATE_VISUAL_ELEMENT",
          elementType: "floating-popup",
          position: { x: 100, y: 100 },
          route: "/tour-dashboard",
          skipAuth: true,
        });
      } else {
        // Open Tour in new tab
        const tab = await chrome.tabs.create({
          url: chrome.runtime.getURL("src/popup/landing.html#/tour"),
          active: true
        });
        
        // Wait a bit for the page to load, then send message
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, {
            type: "CREATE_VISUAL_ELEMENT",
            elementType: "floating-popup",
            position: { x: 100, y: 100 },
            route: "/tour-dashboard",
            skipAuth: true,
          });
        }, 1000);
      }
    });
    
    sendResponse({ success: true });
    return true;
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "POPUP_OPENED") {
    console.log("🎯 Popup opened message received:", message);
    // Popup has opened, trigger visual element on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      console.log("📋 Current tabs:", tabs);
      if (tabs[0]?.id) {
        try {
          console.log("📤 Sending message to tab:", tabs[0].id);
          await chrome.tabs.sendMessage(tabs[0].id, {
            type: "CREATE_VISUAL_ELEMENT",
            elementType: message.elementType || "red-blob",
            position: message.position || { x: 100, y: 100 },
          });
          console.log("✅ Message sent successfully to tab");
        } catch (error) {
          console.error("❌ Could not send message to tab:", error);
        }
      } else {
        console.log("❌ No active tab found");
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "CLEANUP_INTENTIONS") {
    cleanupExpiredIntentions().then((cleanedCount) => {
      sendResponse({ cleanedCount });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === "GET_STORAGE_INFO") {
    // Return storage information for debugging
    chrome.storage.local.get(null).then((data) => {
      const intentionCount = Object.keys(data).filter(
        (key) => data[key] && data[key].intention
      ).length;

      sendResponse({
        totalEntries: Object.keys(data).length,
        intentionEntries: intentionCount,
      });
    });
    return true;
  }

  // Handle opening popup with specific route
  if (message.type === "OPEN_POPUP_WITH_ROUTE") {
    const route = message.route || "/";
    try {
      const normalizedRoute = String(route).startsWith("/")
        ? route
        : `/${route}`;
      const url = chrome.runtime.getURL(
        `landing.html#${normalizedRoute}`
      );
      chrome.tabs
        .create({ url })
        .then((tab) => {
          sendResponse({ success: true, fallback: "tab", tabId: tab.id });
        })
        .catch((error) => {
          sendResponse({ success: false, error: String(error) });
        });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }

  // Handle creating floating iframe on specific tab
  if (message.type === "CREATE_FLOATING_IFRAME_ON_SPECIFIC_TAB") {
    console.log("[Background] Request to create floating iframe on specific tab:", message.tabId);
    
    const tabId = message.tabId;
    if (!tabId) {
      sendResponse({ success: false, error: "No tab ID provided" });
      return true;
    }
    
    chrome.tabs.get(tabId, async (tab) => {
      if (!tab?.url) {
        sendResponse({ success: false, error: "Tab not found" });
        return;
      }
      
      // Check if we can inject into this tab
      const canInject = !tab.url.startsWith("chrome://") &&
                       !tab.url.startsWith("edge://") &&
                       !tab.url.startsWith("brave://") &&
                       !tab.url.startsWith("about:") &&
                       !tab.url.startsWith("file://") &&
                       !tab.url.includes("chrome.google.com/webstore");
      
      if (!canInject) {
        console.log("[Background] Cannot inject into restricted page:", tab.url);
        sendResponse({ success: false, error: "Cannot inject into this page" });
        return;
      }
      
      // Try to send message to existing content script
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: "CREATE_VISUAL_ELEMENT",
          elementType: "floating-popup",
          position: { x: 100, y: 100 },
          route: message.route || "/dashboard",
          skipAuth: message.skipAuth
        });
        console.log("[Background] Sent message to existing content script");
        sendResponse({ success: true });
      } catch (error) {
        console.log("[Background] Content script not loaded, injecting it now...");
        
        try {
          // Get the content script file from manifest
          const manifest = chrome.runtime.getManifest();
          const contentScript = manifest.content_scripts?.[1]?.js?.[0];
          
          if (contentScript) {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: [contentScript]
            });
            
            // Wait a bit for script to initialize
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Now send the message
            await chrome.tabs.sendMessage(tabId, {
              type: "CREATE_VISUAL_ELEMENT",
              elementType: "floating-popup",
              position: { x: 100, y: 100 },
              route: message.route || "/dashboard",
              skipAuth: message.skipAuth
            });
            
            console.log("[Background] Injected script and sent message");
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Content script not found in manifest" });
          }
        } catch (injectError) {
          console.error("[Background] Failed to inject content script:", injectError);
          sendResponse({ success: false, error: String(injectError) });
        }
      }
    });
    
    return true; // Keep message channel open for async response
  }

  // Handle creating floating iframe on current tab (from popup)
  if (message.type === "CREATE_FLOATING_IFRAME_ON_TAB") {
    console.log("[Background] Request to create floating iframe on current tab");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab?.url) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }
      
      // Check if we can inject into this tab
      const canInject = !tab.url.startsWith("chrome://") &&
                       !tab.url.startsWith("edge://") &&
                       !tab.url.startsWith("brave://") &&
                       !tab.url.startsWith("about:") &&
                       !tab.url.startsWith("file://") &&
                       !tab.url.includes("chrome.google.com/webstore");
      
      if (!canInject) {
        console.log("[Background] Cannot inject into restricted page:", tab.url);
        sendResponse({ success: false, error: "Cannot inject into this page" });
        return;
      }
      
      // Try to send message to existing content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: "CREATE_VISUAL_ELEMENT",
          elementType: "floating-popup",
          position: { x: 100, y: 100 },
          route: message.route || "/dashboard",
          skipAuth: message.skipAuth
        });
        console.log("[Background] Sent message to existing content script");
        sendResponse({ success: true });
      } catch (error) {
        console.log("[Background] Content script not loaded, injecting it now...");
        
        try {
          // Get the content script file from manifest
          const manifest = chrome.runtime.getManifest();
          const contentScript = manifest.content_scripts?.[1]?.js?.[0];
          
          if (contentScript) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: [contentScript]
            });
            
            // Wait a bit for script to initialize
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Now send the message
            await chrome.tabs.sendMessage(tab.id, {
              type: "CREATE_VISUAL_ELEMENT",
              elementType: "floating-popup",
              position: { x: 100, y: 100 },
              route: message.route || "/dashboard",
              skipAuth: message.skipAuth
            });
            
            console.log("[Background] Content script injected and floating popup created");
            sendResponse({ success: true });
          } else {
            console.error("[Background] Could not find content script in manifest");
            sendResponse({ success: false, error: "Content script not found" });
          }
        } catch (injectError) {
          console.error("[Background] Failed to inject content script:", injectError);
          sendResponse({ success: false, error: String(injectError) });
        }
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  // Handle creating visual elements on current page
  if (message.type === "CREATE_VISUAL_ELEMENT") {
    try {
      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          // Send message to content script to create the visual element
          chrome.tabs
            .sendMessage(tabs[0].id, {
              type: "CREATE_VISUAL_ELEMENT",
              elementType: message.elementType || "red-blob",
              position: message.position || { x: 100, y: 100 },
            })
            .then(() => {
              sendResponse({ success: true });
            })
            .catch((error) => {
              sendResponse({ success: false, error: String(error) });
            });
        } else {
          sendResponse({ success: false, error: "No active tab found" });
        }
      });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    console.log(
      "[Background] External message received:",
      message.type,
      "from:",
      sender.origin
    );

    if (message.type === "AUTH_SUCCESS" && message.session) {
      console.log("[Background] Processing AUTH_SUCCESS with session");

      const sessionData = {
        "supabase.auth.token": JSON.stringify({
          currentSession: {
            access_token: message.session.access_token,
            refresh_token: message.session.refresh_token,
            user: message.session.user,
          },
        }),
      };

      chrome.storage.local.set(sessionData, () => {
        console.log("[Background] Session stored successfully");

        // Don't close the auth tab immediately - let it show success message
        console.log(
          "[Background] Auth successful, session stored"
        );
        sendResponse({ success: true, method: "session_stored" });
      });

      return true;
    }

    if (message.type === "CLOSE_AUTH_TABS" && message.origin) {
      // Close all tabs from the same origin except the current one
      console.log("[Background] Request to close auth tabs from:", message.origin);
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && 
              tab.id !== sender.tab?.id && 
              tab.url && 
              tab.url.startsWith(message.origin) &&
              (tab.url.includes('/tour') || tab.url.includes('/welcome') || tab.url.includes('/#'))) {
            chrome.tabs.remove(tab.id).catch(() => {
              console.log("[Background] Could not close tab:", tab.id);
            });
          }
        });
      });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "CLOSE_EXTENSION_TABS") {
      // Close all extension popup tabs
      console.log("[Background] Request to close extension popup tabs");
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && tab.url && tab.url.startsWith(`chrome-extension://${chrome.runtime.id}/src/popup/`)) {
            chrome.tabs.remove(tab.id).catch(() => {
              console.log("[Background] Could not close extension tab:", tab.id);
            });
          }
        });
      });
      sendResponse({ success: true });
      return true;
    }


    sendResponse({ success: false, error: "Unknown message type" });
  }
);
