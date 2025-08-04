import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator'; 
import Flame from './home/Flame';

import { 
  Settings, 
  Shield, 
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
  Eye,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

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
  
  const [categories, setCategories] = useState<SiteCategory[]>([
    {
      id: 'entertainment',
      name: 'Entertainment',
      icon: Gamepad2,
      expanded: false,
      sites: [
        { url: 'youtube.com', enabled: true },
        { url: 'netflix.com', enabled: false },
        { url: 'twitch.tv', enabled: true },
        { url: 'hulu.com', enabled: false }
      ]
    },
    {
      id: 'social',
      name: 'Social',
      icon: Users,
      expanded: false,
      sites: [
        { url: 'facebook.com', enabled: true },
        { url: 'instagram.com', enabled: true },
        { url: 'twitter.com', enabled: false },
        { url: 'tiktok.com', enabled: true }
      ]
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: ShoppingBag,
      expanded: false,
      sites: [
        { url: 'amazon.com', enabled: false },
        { url: 'ebay.com', enabled: true },
        { url: 'shopify.com', enabled: false }
      ]
    },
    {
      id: 'news',
      name: 'News',
      icon: Newspaper,
      expanded: false,
      sites: [
        { url: 'cnn.com', enabled: true },
        { url: 'bbc.com', enabled: false },
        { url: 'reddit.com', enabled: true }
      ]
    },
    {
      id: 'others',
      name: 'Others',
      icon: Globe,
      expanded: false,
      sites: [
        { url: 'example.com', enabled: false },
        { url: 'test-site.com', enabled: true }
      ]
    }
  ]);

  useEffect(() => {
    // Simulate getting current URL
    setCurrentUrl('https://example.com');
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  const toggleSite = (categoryId: string, siteUrl: string) => {
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
  };

  const addNewSite = () => {
    if (newSiteUrl.trim()) {
      setCategories(prev => prev.map(cat => 
        cat.id === 'others' 
          ? {
              ...cat,
              sites: [...cat.sites, { url: newSiteUrl.trim(), enabled: true }]
            }
          : cat
      ));
      setNewSiteUrl('');
      setShowAddSite(false);
    }
  };

  const blockCurrentSite = () => {
    const domain = currentUrl.replace(/https?:\/\//, '').split('/')[0];
    const othersCat = categories.find(cat => cat.id === 'others');
    const siteExists = othersCat?.sites.some(site => site.url === domain);
    
    if (!siteExists) {
      setCategories(prev => prev.map(cat => 
        cat.id === 'others' 
          ? {
              ...cat,
              sites: [...cat.sites, { url: domain, enabled: true }]
            }
          : cat
      ));
    }
  };

  if (showAccount) {
    return (
      <div className="w-[400px] h-[600px] bg-background border border-border rounded-xl shadow-lg overflow-hidden font-['Geist']">
        <div className="relative p-6 border-b border-border/50 flex items-center gap-3 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5">
          <Button variant="ghost" size="sm" onClick={() => setShowAccount(false)} className="hover:bg-orange-500/10 rounded-xl">
            ←
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-40"></div>
              <div className="relative bg-gradient-card p-2.5 rounded-xl border border-focus/50 shadow-card">
                <User className="w-5 h-5 text-intention" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg tracking-tight">Account Settings</h2>
              <p className="text-xs text-muted-foreground -mt-0.5">Manage your preferences</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <Card className="border-focus/50 shadow-card hover:shadow-glow transition-shadow rounded-xl">
            <CardHeader className="bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-t-xl">
              <CardTitle className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-30"></div>
                  <div className="relative bg-gradient-card p-1.5 rounded-xl border border-focus/50">
                    <CreditCard className="w-4 h-4 text-intention" />
                  </div>
                </div>
                <div>
                  <span>Subscription</span>
                  <p className="text-xs text-muted-foreground -mt-0.5">Manage your plan</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 rounded-full">Pro</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next billing</span>
                <span className="text-sm font-medium">Dec 15, 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-focus/50 shadow-card hover:shadow-glow transition-shadow rounded-xl">
            <CardHeader className="bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 rounded-t-xl">
              <CardTitle className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-30"></div>
                  <div className="relative bg-gradient-card p-1.5 rounded-xl border border-focus/50">
                    <Users className="w-4 h-4 text-intention" />
                  </div>
                </div>
                <div>
                  <span>Accountability Partner</span>
                  <p className="text-xs text-muted-foreground -mt-0.5">Stay accountable together</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable feature</label>
                <Switch 
                  checked={accountabilityPartner.enabled}
                  onCheckedChange={(checked) => 
                    setAccountabilityPartner(prev => ({ ...prev, enabled: checked }))
                  }
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
              
              {accountabilityPartner.enabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Partner Email</label>
                    <Input
                      type="email"
                      placeholder="partner@example.com"
                      value={accountabilityPartner.email}
                      onChange={(e) => 
                        setAccountabilityPartner(prev => ({ ...prev, email: e.target.value }))
                      }
                      className="border-focus/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your accountability partner will be notified if the extension is removed from Chrome.
                  </p>
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
    <div className="w-[400px] h-[600px] bg-background border border-border rounded-xl shadow-lg overflow-hidden font-['Geist']">
      {/* Clean Header */}
      <div className="relative p-6 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-40"></div>
            <div className="relative bg-gradient-card p-2.5 rounded-xl border border-focus/50 shadow-card">
              <Shield className="w-5 h-5 text-intention" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg tracking-tight">Focus Shield</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Stay focused, stay intentional</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAccount(true)} className="hover:bg-orange-500/10 rounded-xl">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Current Site - Clean & Modern */}
      <div className="p-6 border-b border-border/30">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-30"></div>
              <div className="relative bg-gradient-card p-2.5 rounded-xl border border-focus/50 shadow-card">
                <Globe className="w-5 h-5 text-intention" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Site
              </label>
              <p className="text-sm text-foreground font-medium truncate">{currentUrl}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition-all duration-200 rounded-xl"
            onClick={blockCurrentSite}
          >
            <Shield className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Block This Site
          </Button>
        </div>
      </div>

      {/* Blocked Sites Management */}
      <div className="flex-1 overflow-hidden">
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-30"></div>
              <div className="relative bg-gradient-card p-2 rounded-xl border border-focus/50 shadow-card">
                <Target className="w-4 h-4 text-intention" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Blocked Sites</h3>
              <p className="text-xs text-muted-foreground -mt-0.5">Manage your focus zones</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddSite(!showAddSite)}
            className="hover:bg-orange-500/10 hover:text-orange-600 transition-colors rounded-xl"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showAddSite && (
          <div className="p-6 border-b border-border/30 space-y-4 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-30"></div>
                <div className="relative bg-gradient-card p-2 rounded-xl border border-focus/50 shadow-card">
                  <Plus className="w-4 h-4 text-intention" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">Add New Site</h4>
                <p className="text-xs text-muted-foreground">Enter the website URL to block</p>
              </div>
            </div>
            <Input
              placeholder="example.com"
              value={newSiteUrl}
              onChange={(e) => setNewSiteUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewSite()}
              className="border-focus/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addNewSite} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                Add Site
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSite(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto h-full">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-orange-500/5 transition-all duration-200 group rounded-xl mx-2 my-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-gradient-card p-2 rounded-xl border border-focus/50 shadow-card group-hover:shadow-glow transition-shadow">
                        <Icon className="w-4 h-4 text-intention" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground group-hover:text-orange-600 transition-colors">{category.name}</span>
                      <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20 rounded-full">
                        {category.sites.filter(site => site.enabled).length}
                      </Badge>
                    </div>
                  </div>
                  {category.expanded ? 
                    <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-orange-600 transition-colors" /> : 
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                  }
                </button>
                
                {category.expanded && (
                  <div className="bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5 border-t border-orange-500/10 mx-2 rounded-b-xl">
                    {category.sites.map((site) => (
                      <div key={site.url} className="px-4 py-3 flex items-center justify-between border-t border-orange-500/10 hover:bg-orange-500/10 transition-colors group last:rounded-b-xl">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40 group-hover:bg-orange-500 transition-colors"></div>
                          <span className="text-sm text-foreground truncate font-medium group-hover:text-orange-600 transition-colors">
                            {site.url}
                          </span>
                        </div>
                        <Switch
                          checked={site.enabled}
                          onCheckedChange={() => toggleSite(category.id, site.url)}
                          className="data-[state=checked]:bg-orange-600"
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