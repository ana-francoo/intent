function submitDemo() {
    const input = document.getElementById('intentionInput');
    if (input.value.trim()) {
        document.getElementById('intentionOverlay').classList.add('hidden');
        document.getElementById('demoSite').classList.add('unblurred');
    }
}

function openExtension() {
    console.log('[Landing] Get Started button clicked');
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP_WITH_ROUTE', route: '/' }, (response) => {
        if (response && response.success) {
            console.log('[Landing] Popup opened successfully');
            // Close the landing page
            window.close();
        } else {
            console.error('[Landing] Failed to open popup:', response?.error);
            // Fallback: try to open the popup directly
            chrome.action.openPopup().catch(() => {
                console.error('[Landing] Direct popup open failed');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[Landing] DOM loaded, setting up event listeners');
    
    const heroButton = document.getElementById('heroCtaButton');
    const footerButton = document.getElementById('footerCtaButton');
    
    console.log('[Landing] Hero button found:', !!heroButton);
    console.log('[Landing] Footer button found:', !!footerButton);
    
    if (heroButton) {
        heroButton.addEventListener('click', openExtension);
        console.log('[Landing] Hero button event listener added');
    }
    
    if (footerButton) {
        footerButton.addEventListener('click', openExtension);
        console.log('[Landing] Footer button event listener added');
    }

    document.getElementById('demoButton').addEventListener('click', submitDemo);

    document.getElementById('intentionInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            submitDemo();
        }
    });

    document.getElementById('intentionInput').focus();
});