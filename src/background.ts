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
        url: chrome.runtime.getURL("src/popup/index.html#/welcome"),
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

let isCreatingTab = false;

// Listen for when extension icon is clicked (only fires when no popup is defined in manifest)
chrome.action.onClicked?.addListener(async (tab) => {
  console.log("🎯 Extension icon clicked, creating floating popup...");
  console.log("🔍 Current tab URL:", tab.url);

  const canInject =
    tab.id &&
    tab.url &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("edge://") &&
    !tab.url.startsWith("brave://") &&
    !tab.url.startsWith("dia://") &&
    !tab.url.startsWith("arc://") &&
    !tab.url.startsWith("about:") &&
    !tab.url.startsWith("file://");

  // Special handling for our own extension pages (welcome/tour)
  const isOwnExtensionPage = tab.url && tab.url.includes(chrome.runtime.id) && 
    (tab.url.includes('#/welcome') || tab.url.includes('#/tour') || tab.url.includes('tour=1'));

  console.log("🔍 Can inject:", canInject);
  console.log("🔍 Is own extension page:", isOwnExtensionPage);

  // Handle clicks on our own extension pages (welcome/tour) - create floating popup without content script injection
  if (isOwnExtensionPage && tab.id) {
    console.log("🎯 Extension clicked from our own extension pages, creating floating popup directly");
    
    // Send message to the current page (which should be able to receive it since it's our extension page)
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "CREATE_VISUAL_ELEMENT",
        elementType: "floating-popup", 
        position: { x: 100, y: 100 },
        skipAuth: true, // Always skip auth for our own pages
      });
      console.log("✅ Floating popup message sent to extension page");
    } catch (error) {
      console.log("❌ Failed to send message to extension page:", error);
    }
    return;
  }

  if (canInject && tab.id) {
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
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/main.tsx-loader.js"],
        });

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
    if (isCreatingTab) {
      console.log("Already creating a tab, skipping duplicate request...");
      return;
    }
    
    isCreatingTab = true;
    console.log("Cannot inject into this page, creating new tab with popup...");
    
    chrome.tabs.create(
      { url: "https://www.google.com", active: true },
      async (newTab) => {
        if (newTab.id) {
          const tabId = newTab.id;

          const waitForTabLoad = () => {
            return new Promise<void>((resolve) => {
              const listener = (
                tabIdUpdated: number,
                changeInfo: chrome.tabs.TabChangeInfo
              ) => {
                if (
                  tabIdUpdated === tabId &&
                  changeInfo.status === "complete"
                ) {
                  chrome.tabs.onUpdated.removeListener(listener);
                  resolve();
                }
              };
              chrome.tabs.onUpdated.addListener(listener);
              setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }, 5000);
            });
          };

          await waitForTabLoad();
          console.log("Tab loaded, injecting content script...");

          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["src/content/main.tsx-loader.js"],
            });

            await new Promise((resolve) => setTimeout(resolve, 300));

            await chrome.tabs.sendMessage(tabId, {
              type: "CREATE_VISUAL_ELEMENT",
              elementType: "floating-popup",
              position: { x: 100, y: 100 },
            });

            console.log("✅ Popup created on new tab");
          } catch (error) {
            console.error("Failed to create popup on new tab:", error);
          } finally {
            // Reset the flag after we're done
            isCreatingTab = false;
          }
        } else {
          isCreatingTab = false;
        }
      }
    );
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
        `src/popup/index.html#${normalizedRoute}`
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
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour expiry
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
