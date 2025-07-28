function submitDemo() {
    const input = document.getElementById('intentionInput');
    if (input.value.trim()) {
        document.getElementById('intentionOverlay').classList.add('hidden');
        document.getElementById('demoSite').classList.add('unblurred');
    }
}

function openExtension() {
    if (chrome && chrome.action) {
        // Try to open popup directly first
        chrome.action.openPopup().then(() => {
            // If successful, close the current tab
            if (chrome.tabs) {
                chrome.tabs.getCurrent((tab) => {
                    if (tab && tab.id) {
                        chrome.tabs.remove(tab.id);
                    }
                });
            }
        }).catch((error) => {
            console.log('Could not open popup directly:', error);
            // Fallback: try through background script
            if (chrome.runtime) {
                chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }, (response) => {
                    if (response && response.success && chrome.tabs) {
                        chrome.tabs.getCurrent((tab) => {
                            if (tab && tab.id) {
                                chrome.tabs.remove(tab.id);
                            }
                        });
                    }
                });
            }
        });
    } else {
        window.close();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const heroButton = document.getElementById('heroCtaButton');
    const footerButton = document.getElementById('footerCtaButton');
    
    if (heroButton) {
        heroButton.addEventListener('click', openExtension);
    }
    
    if (footerButton) {
        footerButton.addEventListener('click', openExtension);
    }

    document.getElementById('demoButton').addEventListener('click', submitDemo);

    document.getElementById('intentionInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            submitDemo();
        }
    });

    document.getElementById('intentionInput').focus();
});