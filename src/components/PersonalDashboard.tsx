import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Newspaper
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
      <div className="w-[400px] h-[600px] bg-background border border-border rounded-lg shadow-lg">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowAccount(false)}>
            ←
          </Button>
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Account Settings</h2>
        </div>
        
        <div className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="secondary">Pro</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next billing</span>
                <span className="text-sm">Dec 15, 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Accountability Partner
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
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your accountability partner will be notified if the extension is removed from Chrome.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] bg-background border border-border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">Focus Shield</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAccount(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Current Site */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Site
            </label>
            <p className="text-sm text-foreground mt-1 truncate">{currentUrl}</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={blockCurrentSite}
          >
            <Shield className="w-4 h-4 mr-2" />
            Block This Site
          </Button>
        </div>
      </div>

      {/* Blocked Sites Management */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-foreground">Blocked Sites</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddSite(!showAddSite)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showAddSite && (
          <div className="p-4 border-b border-border space-y-3">
            <Input
              placeholder="Enter website URL"
              value={newSiteUrl}
              onChange={(e) => setNewSiteUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewSite()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addNewSite}>Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSite(false)}>
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
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.sites.filter(site => site.enabled).length}
                    </Badge>
                  </div>
                  {category.expanded ? 
                    <ChevronUp className="w-4 h-4 text-muted-foreground" /> : 
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
                
                {category.expanded && (
                  <div className="bg-muted/20">
                    {category.sites.map((site) => (
                      <div key={site.url} className="px-4 py-3 flex items-center justify-between border-t border-border">
                        <span className="text-sm text-foreground truncate flex-1 mr-2">
                          {site.url}
                        </span>
                        <Switch
                          checked={site.enabled}
                          onCheckedChange={() => toggleSite(category.id, site.url)}
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