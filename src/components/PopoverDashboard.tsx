import React, { useState, useEffect } from 'react';
import AddWebsiteInput from './AddWebsiteInput';
import { saveBlockedSites, getBlockedSites, isUrlBlocked, getIntention } from '../utils/storage';
import { supabase } from '../supabaseClient';
import './PopoverDashboard.css';

const PopoverDashboard: React.FC = () => {
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentSiteDomain, setCurrentSiteDomain] = useState<string>('');
  const [isCurrentSiteBlocked, setIsCurrentSiteBlocked] = useState<boolean>(false);
  const [currentIntention, setCurrentIntention] = useState<string>('');

  // Get current tab URL and check if it's blocked
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome?.tabs) {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.url && !tabs[0].url.startsWith('chrome://')) {
            const url = tabs[0].url;
            const domain = new URL(url).hostname;
            
            setCurrentTabUrl(url);
            setCurrentSiteDomain(domain);
            
            // Check if current site is blocked
            const blocked = await isUrlBlocked(url);
            setIsCurrentSiteBlocked(blocked);
            
            // If blocked, get the current intention
            if (blocked) {
              const intentionData = await getIntention(url);
              setCurrentIntention(intentionData?.intention || 'No intention set');
            }
          } else {
            // If we can't get tab info or it's a chrome:// page, show fallback
            setCurrentSiteDomain('Extension Page');
            setIsCurrentSiteBlocked(false);
          }
        } else {
          console.warn('Chrome tabs API not available');
          setCurrentSiteDomain('Unknown');
          setIsCurrentSiteBlocked(false);
        }
      } catch (error) {
        console.error('Failed to get current tab:', error);
        setCurrentSiteDomain('Error');
        setIsCurrentSiteBlocked(false);
      }
    };

    // Add a small delay to ensure Chrome APIs are ready
    const timer = setTimeout(getCurrentTab, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch blocked sites when component mounts
  useEffect(() => {
    const fetchBlockedSites = async () => {
      try {
        const sites = await getBlockedSites();
        setBlockedSites(sites);
      } catch (error) {
        console.error('Failed to fetch blocked sites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockedSites();
  }, []);

  const handleReenterIntention = () => {
    console.log('Re-enter Intention clicked');
    // TODO: Open modal or trigger intention overlay
  };

  const handleBlockSite = async () => {
    try {
      if (!currentTabUrl || !currentSiteDomain) {
        console.error('No current tab URL available');
        return;
      }

      console.log('Blocking current site:', currentSiteDomain);
      
      // Add the current site to blocked sites
      await saveBlockedSites([currentTabUrl]);
      
      // Update local state
      setBlockedSites(prev => [currentTabUrl, ...prev]);
      setIsCurrentSiteBlocked(true);
      
      // Send message to content script to trigger intention overlay
      if (typeof chrome !== 'undefined' && chrome?.tabs) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          try {
            await chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_OVERLAY' });
            console.log('Successfully triggered intention overlay');
            
            // Close the popup after a short delay to allow the message to be sent
            setTimeout(() => {
              window.close();
            }, 500);
          } catch (messageError) {
            console.warn('Failed to send message to content script:', messageError);
            // Still close the popup even if message sending fails
            setTimeout(() => {
              window.close();
            }, 500);
          }
        }
      }
      
      console.log('Successfully blocked site:', currentSiteDomain);
    } catch (error) {
      console.error('Failed to block site:', error);
    }
  };

  const handleMyAccount = () => {
    console.log('My Account clicked');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  const handleAddWebsite = () => {
    setShowAddWebsite(!showAddWebsite);
  };

  const handleUrlsChange = async (urls: string[]) => {
    try {
      // Only save the most recently added URL (last item in the array)
      const newUrl = urls[urls.length - 1];
      if (newUrl && !blockedSites.includes(newUrl)) {
        await saveBlockedSites([newUrl]);
        console.log('Successfully saved URL:', newUrl);
        
        // Add the new URL to the top of the current list for immediate feedback
        setBlockedSites(prev => [newUrl, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save blocked sites:', error);
    }
  };



  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error logging out:', error);
        return;
      }
      
      console.log('Successfully logged out');
      
      // The Home component will automatically redirect to the home page
      // when the session state changes due to the useEffect that checks auth
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="popover-dashboard">
      {/* Top Section: Site Status */}
      <div className="site-status-section">
        <div className="domain-name">{currentSiteDomain}</div>
        {isCurrentSiteBlocked && (
          <div className="status-badge blocked">
            <span className="status-icon">✗</span>
            <span className="status-text">Blocked</span>
          </div>
        )}
        {isCurrentSiteBlocked ? (
          <>
            <div className="intention-text">
              Your intention: <span className="intention-value">{currentIntention}</span>
            </div>
            <button className="reenter-intention-btn" onClick={handleReenterIntention}>
              Re-enter Intention
            </button>
          </>
        ) : (
          <button className="block-site-btn" onClick={handleBlockSite}>
            Block Site
          </button>
        )}
      </div>

      {/* Action Grid */}
      <div className="action-grid">
        <div className="action-item" onClick={handleMyAccount}>
          <div className="action-icon">👤</div>
          <div className="action-label">My Account</div>
        </div>
        <div className="action-item" onClick={handleSettings}>
          <div className="action-icon">⚙️</div>
          <div className="action-label">Settings</div>
        </div>
      </div>

      {/* Blocklist Management Section */}
      <div className="blocklist-section">
        <div className="blocklist-header">
          <h3 className="section-title">Manage Default Blocklist</h3>
        </div>
        <div className="add-website-container">
          <button className="add-website-btn" onClick={handleAddWebsite}>
            {showAddWebsite ? '- Hide Input' : '+ Add Website'}
          </button>
        </div>
        
        {showAddWebsite && (
          <div className="add-website-input-wrapper">
            <AddWebsiteInput
              onUrlsChange={handleUrlsChange}
              placeholder="e.g., threads.net"
              showTitle={false}
              className="popover-style"
              showUrlList={false}
            />
          </div>
        )}
        
        <div className="website-list">
          {isLoading ? (
            <div className="loading-message">Loading blocked sites...</div>
          ) : blockedSites.length > 0 ? (
            blockedSites.map((site, index) => (
              <div key={index} className="website-item">
                {site.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </div>
            ))
          ) : (
            <div className="empty-message">No blocked sites yet. Add some above!</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
};

export default PopoverDashboard; 