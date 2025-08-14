import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// Removed unused imports to fix build warnings
import quotes from '../utils/quotes';
import { saveBlockedSites, deleteBlockedSites, getBlockedSites, normalizeUrlToDomain } from '../utils/storage';

import { 
  Settings, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  User,
  LogOut,
  CreditCard,
  Globe,
  Gamepad2,
  Users,
  ShoppingBag,
  Newspaper,
  Target,
  
} from 'lucide-react';
import { ENTERTAINMENT_SITES, SOCIAL_SITES, SHOPPING_SITES, NEWS_SITES } from '@/utils/categoryPresets';

interface Site {
  url: string;
  enabled: boolean;
}

interface SiteCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  sites: Site[];
  expanded: boolean;
}

const PersonalDashboard = () => {
  const [currentUrl, setCurrentUrl] = useState('https://example.com');
  const [showAccount, setShowAccount] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [accountabilityPartner, setAccountabilityPartner] = useState({
    enabled: false,
    email: ''
  });
  
  const [emailError, setEmailError] = useState('');
  const [enableScroll, setEnableScroll] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');

  const getRandomQuote = (): string => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  };
  
  // Set initial random quote
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, []);

  // Note: This useEffect is no longer needed since we removed the popup from manifest
  // and now handle the icon click directly in the background script
  // Keeping this code for reference in case we need it later
  /*
  useEffect(() => {
    // Check if this is a floating popup to prevent infinite loop
    const urlParams = new URLSearchParams(window.location.search);
    const isFloating = urlParams.get('floating') === 'true';
    
    if (isFloating) {
      console.log('🔄 Floating popup detected, skipping POPUP_OPENED message');
      return;
    }
    
    console.log('🚀 Popup opened, sending message to background script...');
    // Send message to background script that popup has opened
    if (typeof chrome !== 'undefined' && chrome?.runtime) {
      chrome.runtime.sendMessage({ 
        type: 'POPUP_OPENED',
        elementType: 'floating-popup',
        position: { x: 100, y: 100 }
      }).then(response => {
        console.log('✅ Background script response:', response);
      }).catch(error => {
        console.error('❌ Error sending message to background script:', error);
      });
    } else {
      console.log('❌ Chrome runtime not available');
    }
  }, []);
  */

  // Enable scrolling after animations complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnableScroll(true);
    }, 300); // Increased delay for Account Settings animations (longest delay is 225ms + animation duration + buffer)

    return () => clearTimeout(timer);
  }, []);

  // Re-enable scrolling when switching to Account Settings
  useEffect(() => {
    if (showAccount) {
      const timer = setTimeout(() => {
        setEnableScroll(true);
      }, 400); // Wait for Account Settings animations to complete

      return () => clearTimeout(timer);
    }
  }, [showAccount]);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const [categories, setCategories] = useState<SiteCategory[]>([
    {
      id: 'social',
      name: 'Social',
      icon: Users,
      expanded: false,
      sites: SOCIAL_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      icon: Gamepad2,
      expanded: false,
      sites: ENTERTAINMENT_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: ShoppingBag,
      expanded: false,
      sites: SHOPPING_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: 'news',
      name: 'News',
      icon: Newspaper,
      expanded: false,
      sites: NEWS_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: 'my-sites',
      name: 'My Sites',
      icon: Target,
      expanded: false,
      sites: [
        { url: 'example.com', enabled: false },
        { url: 'test-site.com', enabled: true }
      ]
    }
  ]);

  useEffect(() => {
    // Function to update current URL
    const updateCurrentUrl = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          try {
            const url = new URL(tabs[0].url);
            setCurrentUrl(url.hostname);
          } catch (error) {
            setCurrentUrl('Unknown site');
          }
        } else {
          setCurrentUrl('No active tab');
        }
      });
    };

    // Get initial URL
    updateCurrentUrl();

    // Listen for tab updates
    const handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        updateCurrentUrl();
      }
    };

    const handleTabActivate = (activeInfo: chrome.tabs.TabActiveInfo) => {
      updateCurrentUrl();
    };

    // Add listeners
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivate);

    // Cleanup listeners
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivate);
    };
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  const toggleSite = async (categoryId: string, siteUrl: string) => {
    const domain = normalizeUrlToDomain(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    // Optimistic UI update
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            sites: cat.sites.map(site => 
              site.url === siteUrl ? { ...site, enabled: !site.enabled } : site
            )
          }
        : cat
    ));

    try {
      // Reflect in Supabase (inverted semantics):
      // Default = enabled. If user disables (toggle -> false), INSERT into blocked_sites.
      // If user enables (toggle -> true), DELETE from blocked_sites.
      const prevCat = categories.find(c => c.id === categoryId);
      const prevSite = prevCat?.sites.find(s => s.url === siteUrl);
      const willDisable = prevSite?.enabled === true; // toggling from true -> false
      if (willDisable) {
        await saveBlockedSites([`https://${domain}`]);
      } else {
        await deleteBlockedSites([`https://${domain}`]);
      }
    } catch (e) {
      console.error('Failed to sync blocked site toggle:', e);
    }
  };

  const addNewSite = async () => {
    if (newSiteUrl.trim()) {
      try {
        // Save to Supabase database as disabled entry
        const normalized = normalizeUrlToDomain(newSiteUrl.trim().startsWith('http') ? newSiteUrl.trim() : `https://${newSiteUrl.trim()}`);
        await saveBlockedSites([`https://${normalized}`]);
        
        // Add to the 'My Sites' category
        setCategories(prev => prev.map(cat => 
          cat.id === 'my-sites' 
            ? {
                ...cat,
                sites: [...cat.sites, { url: normalized, enabled: false }]
              }
            : cat
        ));
        setNewSiteUrl('');
        setShowAddSite(false);
      } catch (error) {
        console.error('Failed to save blocked site:', error);
        // Still add to local state even if Supabase save fails
        setCategories(prev => prev.map(cat => 
          cat.id === 'my-sites' 
            ? {
                ...cat,
                sites: [...cat.sites, { url: normalizeUrlToDomain(newSiteUrl.trim()), enabled: false }]
              }
            : cat
        ));
        setNewSiteUrl('');
        setShowAddSite(false);
      }
    }
  };

  const blockCurrentSite = async () => {
    if (currentUrl && currentUrl !== 'Loading...' && currentUrl !== 'No active tab' && currentUrl !== 'Unknown site') {
      try {
        // Save to Supabase database
        const normalized = normalizeUrlToDomain(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`);
        await saveBlockedSites([`https://${normalized}`]);
        
        // Add to the 'My Sites' category
        const domain = normalized;
        const mySitesCat = categories.find(cat => cat.id === 'my-sites');
        const siteExists = mySitesCat?.sites.some(site => site.url === domain);
        
        if (!siteExists) {
          setCategories(prev => prev.map(cat => 
            cat.id === 'my-sites' 
              ? {
                  ...cat,
                  sites: [...cat.sites, { url: domain, enabled: false }]
                }
              : cat
          ));
        }
      } catch (error) {
        console.error('Failed to save blocked site:', error);
        // Still add to local state even if Supabase save fails
        const domain = normalizeUrlToDomain(currentUrl);
        const mySitesCat = categories.find(cat => cat.id === 'my-sites');
        const siteExists = mySitesCat?.sites.some(site => site.url === domain);
        
        if (!siteExists) {
          setCategories(prev => prev.map(cat => 
            cat.id === 'my-sites' 
              ? {
                  ...cat,
                  sites: [...cat.sites, { url: domain, enabled: false }]
                }
              : cat
          ));
        }
      }
    }
  };

// Removed unused createVisualElement helper (not invoked)

  // Sync initial toggle states from Supabase
  useEffect(() => {
    (async () => {
      try {
        const blocked = await getBlockedSites();
        const blockedDomains = new Set(blocked.map(u => normalizeUrlToDomain(u)));
        setCategories(prev => prev.map(cat => ({
          ...cat,
          sites: cat.sites.map(site => ({
            ...site,
            // Default enabled; disable if domain is in the table
            enabled: !blockedDomains.has(normalizeUrlToDomain(site.url))
          }))
        })));
      } catch (e) {
        console.warn('Unable to fetch blocked sites; leaving defaults.', e);
      }
    })();
  }, []);

  // Render Account/User Settings as the second page
  if (showAccount) {
    return (
      <div className="w-[400px] h-[600px] shadow-lg overflow-hidden font-['Geist'] flex flex-col" style={{
        background: 'radial-gradient(circle at center, #2D1B11 0%, #1E120B 40%, #0F0905 100%)'
      }}>
        <div className="p-4 border-b border-[#5A351E]/20 animate-in slide-in-from-top duration-300 ease-out" style={{
          background: 'linear-gradient(135deg, #1E120B 0%, #2D1B11 50%, #3E2718 100%)'
        }}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAccount(false)} className="text-[#F5E6D3] hover:bg-[#5A351E]/20">
              ←
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF944D]/20 animate-pulse rounded-full"></div>
              <div className="relative bg-gradient-to-br from-[#5A351E] to-[#3A2315] p-2 rounded-full border border-[#FF944D]/30 shadow-lg">
                <User className="w-5 h-5 text-[#FF944D]" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-[#F5E6D3] text-lg">Account Settings</h2>
              <p className="text-sm text-[#D4C4A8] -mt-0.5">Manage your preferences</p>
            </div>
          </div>
        </div>

        <div className={`p-4 space-y-3 flex-1 animate-in slide-in-from-top duration-300 ease-out delay-75 ${enableScroll ? 'overflow-y-auto' : 'overflow-hidden'}`} style={{
          background: 'radial-gradient(circle at bottom right, #3E2718 0%, #2D1B11 30%, #1E120B 60%, #0F0905 100%), linear-gradient(135deg, rgba(62, 39, 24, 0.4) 0%, rgba(45, 27, 17, 0.6) 30%, rgba(30, 18, 11, 0.8) 70%, rgba(15, 9, 5, 0.9) 100%)'
        }}>
          <Card className="rounded-xl backdrop-blur-sm animate-in slide-in-from-bottom duration-300 ease-out delay-150" style={{
            background: 'linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)',
            boxShadow: '0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 148, 77, 0.15)'
          }}>
            <CardHeader className="rounded-t-xl" style={{
              background: 'linear-gradient(135deg, rgba(90, 53, 30, 0.6) 0%, rgba(58, 35, 21, 0.7) 30%, rgba(30, 18, 11, 0.8) 60%, rgba(90, 53, 30, 0.5) 100%)'
            }}>
              <CardTitle className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                  <div className="relative bg-gradient-to-br from-[#5A351E]/90 to-[#3A2315]/90 p-1.5 rounded-xl border border-[#FF944D]/40">
                    <CreditCard className="w-4 h-4 text-[#FF944D]" />
                  </div>
                </div>
                <div>
                  <span className="text-[#F5E6D3]">Subscription</span>
                  <p className="text-xs text-[#D4C4A8] -mt-0.5">Manage your plan</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Plan</span>
                <Badge className="bg-[#FF944D]/20 text-[#FF944D] border-[#FF944D]/30 rounded-full text-xs px-2">Pro</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Status</span>
                <Badge className="bg-[#8FBC8F]/20 text-[#8FBC8F] border-[#8FBC8F]/30 rounded-full text-xs">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Next billing</span>
                <span className="text-xs font-medium text-[#F5E6D3]">Dec 15, 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl backdrop-blur-sm animate-in slide-in-from-bottom duration-300 ease-out delay-225" style={{
            background: 'linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)',
            boxShadow: '0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 148, 77, 0.15)'
          }}>
            <CardHeader className="rounded-t-xl" style={{
              background: 'linear-gradient(135deg, rgba(90, 53, 30, 0.6) 0%, rgba(58, 35, 21, 0.7) 30%, rgba(30, 18, 11, 0.8) 60%, rgba(90, 53, 30, 0.5) 100%)'
            }}>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                    <div className="relative bg-gradient-to-br from-[#5A351E]/90 to-[#3A2315]/90 p-1.5 rounded-xl border border-[#FF944D]/40">
                      <Users className="w-4 h-4 text-[#FF944D]" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[#F5E6D3]">Accountability Partner</span>
                    <p className="text-xs text-[#D4C4A8] -mt-0.5">Stay accountable together</p>
                  </div>
                </div>
                <Switch 
                  checked={accountabilityPartner.enabled}
                  onCheckedChange={(checked) => 
                    setAccountabilityPartner(prev => ({ ...prev, enabled: checked }))
                  }
                  className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#5A351E]/70 scale-75"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className={accountabilityPartner.enabled ? 'space-y-4' : 'space-y-0'}>
              {accountabilityPartner.enabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#F5E6D3]">Partner Email</label>
                    <Input
                      type="email"
                      placeholder="partner@example.com"
                      value={accountabilityPartner.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;
                        setAccountabilityPartner(prev => ({ ...prev, email: newEmail }));
                        validateEmail(newEmail);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      className={`bg-[#1E120B]/50 border-[#5A351E]/70 text-[#F5E6D3] placeholder-[#D4C4A8]/50 focus:ring-2 focus:ring-[#FF944D]/30 rounded-xl ${
                        emailError ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    />
                    {emailError && (
                      <p className="text-xs text-red-400 mt-1">{emailError}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#D4C4A8]">
                    Your accountability partner will be notified if the extension is removed from Chrome. Please note that once a partner is set up, this action can not be undone.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full rounded-xl border-[#FF944D]/30 text-[#FF944D] hover:bg-[#FF944D]/10"
                    onClick={() => {
                      if (validateEmail(accountabilityPartner.email)) {
                        console.log('Saving accountability partner:', accountabilityPartner);
                      }
                    }}
                    disabled={!!emailError}
                  >
                    Save Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="w-full hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition-all duration-200 group rounded-xl">
            <LogOut className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] shadow-lg overflow-hidden font-['Geist'] flex flex-col" style={{
      background: 'radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)'
    }}>
      {/* Clean Header */}
      <div className="relative p-4 border-b border-[#7A4A1E]/20 animate-in slide-in-from-bottom duration-300 ease-out" style={{
        background: 'linear-gradient(135deg, #1A1108 0%, #3D2414 50%, #5A3518 100%)'
      }}>
        {/* Drag handle removed intentionally */}
        <div className="flex items-center gap-3">
          <img src="/src/assets/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <h1 className="font-bold text-[#F5E6D3] text-lg tracking-tight">Intent</h1>
        </div>
        <div className="mt-1" style={{ marginLeft: 0 }}>
          <p className="text-base text-[#D4C4A8] italic text-left" style={{ fontStyle: 'italic', transform: 'skew(-10deg)' }}>
            "{currentQuote}"
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => {
          setShowAccount(true);
          setEnableScroll(false); // Reset scroll state when entering Account Settings
        }} className="absolute top-2 right-12 text-[#F5E6D3] hover:bg-[#7A4A1E]/20 rounded-xl p-2">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Site - Clean & Modern */}
      <div className="p-4 border-b border-[#7A4A1E]/20 animate-in slide-in-from-bottom duration-300 ease-out delay-75" style={{
        background: 'radial-gradient(circle at bottom right, #5A3518 0%, #3D2414 30%, #2A1A0E 60%, #1A1108 100%), linear-gradient(135deg, rgba(90, 53, 24, 0.4) 0%, rgba(61, 36, 14, 0.6) 30%, rgba(42, 26, 14, 0.8) 70%, rgba(26, 17, 8, 0.9) 100%)'
      }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
              <div className="relative bg-gradient-to-br from-[#7A4A1E] to-[#5A3518] p-2 rounded-xl border border-[#FF944D]/30 shadow-lg">
                <Globe className="w-4 h-4 text-[#FF944D]" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#F5E6D3] font-medium truncate">{currentUrl}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-3 py-1 text-xs rounded-lg border-[#7A4A1E]/50 text-[#F5E6D3] hover:bg-[#FF944D]/15 hover:border-[#FF944D]/40 hover:text-[#FF944D] whitespace-nowrap"
                  onClick={blockCurrentSite}
                >
                  Block
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Sites Management */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{
        background: 'radial-gradient(circle at bottom right, #5A3518 0%, #3D2414 30%, #2A1A0E 60%, #1A1108 100%), linear-gradient(135deg, rgba(90, 53, 24, 0.4) 0%, rgba(61, 36, 14, 0.6) 30%, rgba(42, 26, 14, 0.8) 70%, rgba(26, 17, 8, 0.9) 100%)'
      }}>
        <div className="p-4 border-b border-[#7A4A1E]/20 flex items-center justify-between animate-in slide-in-from-bottom duration-300 ease-out delay-150">
          <div>
            <h3 className="font-bold text-[#F5E6D3] text-sm">Blocked Sites</h3>
            <p className="text-xs text-[#D4C4A8] -mt-0.5">Manage your focus zones</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddSite(!showAddSite)}
            className="text-[#F5E6D3] hover:bg-[#7A4A1E]/20 hover:text-[#FF944D] transition-colors rounded-xl"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showAddSite && (
          <div className="p-4 border-b border-[#7A4A1E]/20 space-y-3 animate-in slide-in-from-bottom duration-200 ease-out">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                <div className="relative bg-gradient-to-br from-[#7A4A1E] to-[#5A3518] p-2 rounded-xl border border-[#FF944D]/30 shadow-lg">
                  <Plus className="w-4 h-4 text-[#FF944D]" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#F5E6D3] text-sm">Add New Site</h4>
                <p className="text-xs text-[#D4C4A8]">Enter the website URL to block</p>
              </div>
            </div>
            <Input
              placeholder="example.com"
              value={newSiteUrl}
              onChange={(e) => setNewSiteUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewSite()}
              className="bg-[#1A1108]/50 border-[#7A4A1E]/70 text-[#F5E6D3] placeholder-[#D4C4A8]/50 focus:ring-2 focus:ring-[#FF944D]/30 rounded-xl"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addNewSite} className="bg-[#FF944D] hover:bg-[#FF944D]/80 text-white rounded-xl">
                Add Site
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSite(false)} className="border-[#7A4A1E]/50 text-[#F5E6D3] hover:bg-[#7A4A1E]/20 rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 p-4 space-y-2 ${enableScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="border-b border-[#7A4A1E]/20 last:border-b-0 opacity-0" style={{
                animation: `slideInUp 0.3s ease-out ${225 + (index * 120)}ms forwards, fadeIn 0.3s ease-out ${225 + (index * 120)}ms forwards`
              }}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-2 flex items-center justify-between hover:bg-[#7A4A1E]/10 transition-all duration-200 group rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#FF944D]/20 animate-pulse rounded-xl group-hover:bg-[#FF944D]/30 transition-all"></div>
                      <div className="relative bg-gradient-to-br from-[#7A4A1E] to-[#5A3518] p-1 rounded-xl border border-[#FF944D]/30 shadow-lg group-hover:shadow-xl transition-shadow">
                        <Icon className="w-3 h-3 text-[#FF944D]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F5E6D3] group-hover:text-[#FF944D] transition-colors text-xs">{category.name}</span>
                      <span className="text-xs text-[#FF944D]">
                        {category.sites.reduce((count, site) => count + (site.enabled ? 1 : 0), 0)}
                      </span>
                    </div>
                  </div>
                  {category.expanded ? 
                    <ChevronUp className="w-4 h-4 text-[#D4C4A8] group-hover:text-[#FF944D] transition-colors" /> : 
                    <ChevronDown className="w-4 h-4 text-[#D4C4A8] group-hover:text-[#FF944D] transition-colors" />
                  }
                </button>
                
                {category.expanded && (
                  <div className="border-t border-[#7A4A1E]/20">
                    {category.sites.map((site) => (
                      <div key={site.url} className="px-4 py-1.5 flex items-center justify-between border-t border-[#7A4A1E]/10 hover:bg-[#7A4A1E]/10 transition-colors group">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-1 h-1 rounded-full bg-[#FF944D]/40 group-hover:bg-[#FF944D] transition-colors"></div>
                          <span className="text-xs text-[#F5E6D3] truncate font-medium group-hover:text-[#FF944D] transition-colors">
                            {site.url}
                          </span>
                        </div>
                        <Switch
                          checked={site.enabled}
                          onCheckedChange={() => toggleSite(category.id, site.url)}
                          className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#7A4A1E]/70 scale-75"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;