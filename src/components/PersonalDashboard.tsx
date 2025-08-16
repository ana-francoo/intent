import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import quotes from "../utils/quotes";
import { normalizeUrlToDomain } from "../utils/storage";
import { useAuth, useSignOut } from "@/hooks/useAuth";
import {
  useAccountabilityPartner,
  useSaveAccountabilityPartner,
} from "@/hooks/useAccountabilityPartner";
import {
  useBlockedSites,
  useAddBlockedSites,
  useRemoveBlockedSites,
} from "@/hooks/useBlockedSites";
import { useSubscriptionStatus } from "@/hooks/useSubscription";
import { TrialExpiredOverlay } from "./TrialExpiredOverlay";
import { formatTimeRemaining } from "@/utils/subscription";

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
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  ENTERTAINMENT_SITES,
  SOCIAL_SITES,
  SHOPPING_SITES,
  NEWS_SITES,
} from "@/utils/categoryPresets";

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return true;
  return emailRegex.test(email);
};

const withHttps = (urlLike: string) =>
  urlLike.startsWith("http") ? urlLike : `https://${urlLike}`;

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
  const [showAccount, setShowAccount] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [emailError, setEmailError] = useState("");
  const [customSitesList, setCustomSitesList] = useState<string[]>(() => {
    const stored = localStorage.getItem('intent_custom_sites');
    return stored ? JSON.parse(stored) : [];
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  const {
    data: session,
    isLoading: authLoading,
    isError: authError,
  } = useAuth();
  const signOutMutation = useSignOut();
  const { data: accountabilityPartner } = useAccountabilityPartner();
  const savePartnerMutation = useSaveAccountabilityPartner();
  const { data: blockedSites = [] } = useBlockedSites();
  const addBlockedSitesMutation = useAddBlockedSites();
  const removeBlockedSitesMutation = useRemoveBlockedSites();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } =
    useSubscriptionStatus();

  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerEnabled, setPartnerEnabled] = useState(false);
  const [confirmingPartner, setConfirmingPartner] = useState(false);

  useEffect(() => {
    if (accountabilityPartner) {
      setPartnerEmail(accountabilityPartner.email ?? "");
      setPartnerEnabled(!!accountabilityPartner.enabled);
    }
  }, [accountabilityPartner]);

  const currentQuote = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    []
  );

  const handleSaveAccountabilityPartner = async () => {
    if (!validateEmail(partnerEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    
    // First click - show confirmation
    if (!confirmingPartner) {
      setConfirmingPartner(true);
      // Reset confirmation state after 3 seconds if not clicked
      setTimeout(() => setConfirmingPartner(false), 3000);
      return;
    }
    
    // Second click - actually save
    try {
      await savePartnerMutation.mutateAsync(partnerEmail);
      setConfirmingPartner(false);
    } catch {
      setConfirmingPartner(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutMutation.mutateAsync();
      window.location.href = "#/welcome";
    } catch {}
  };

  const normalize = (u: string) =>
    `https://${normalizeUrlToDomain(withHttps(u.trim()))}`;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('intent_custom_sites', JSON.stringify(customSitesList));
  }, [customSitesList]);

  const computedCategories = useMemo(() => {
    const blockedSet = new Set(blockedSites.map(normalize));
    
    const presetSites = new Set(
      [...SOCIAL_SITES, ...ENTERTAINMENT_SITES, ...SHOPPING_SITES, ...NEWS_SITES]
        .map(url => normalizeUrlToDomain(withHttps(url.trim())))
    );
    
    const customFromDb = blockedSites
      .map(url => normalizeUrlToDomain(withHttps(url.trim())))
      .filter(url => !presetSites.has(url));
    
    const allCustomSites = Array.from(new Set([...customSitesList, ...customFromDb]));
    
    const rawCategories: SiteCategory[] = [
      {
        id: "social",
        name: "Social",
        icon: Users,
        expanded: expanded["social"] || false,
        sites: SOCIAL_SITES.map((url) => ({
          url,
          enabled: blockedSet.has(normalize(url)),
        })),
      },
      {
        id: "entertainment",
        name: "Entertainment",
        icon: Gamepad2,
        expanded: expanded["entertainment"] || false,
        sites: ENTERTAINMENT_SITES.map((url) => ({
          url,
          enabled: blockedSet.has(normalize(url)),
        })),
      },
      {
        id: "shopping",
        name: "Shopping",
        icon: ShoppingBag,
        expanded: expanded["shopping"] || false,
        sites: SHOPPING_SITES.map((url) => ({
          url,
          enabled: blockedSet.has(normalize(url)),
        })),
      },
      {
        id: "news",
        name: "News",
        icon: Newspaper,
        expanded: expanded["news"] || false,
        sites: NEWS_SITES.map((url) => ({
          url,
          enabled: blockedSet.has(normalize(url)),
        })),
      },
      {
        id: "my-sites",
        name: "My Sites",
        icon: Target,
        expanded: expanded["my-sites"] || false,
        sites: allCustomSites.map((url) => ({
          url,
          enabled: blockedSet.has(normalize(url)),
        })),
      },
    ];
    return rawCategories;
  }, [blockedSites, expanded, customSitesList]);

  const [currentUrl, setCurrentUrl] = useState<string>("Loading...");

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome?.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const raw = tabs[0]?.url;
        try {
          setCurrentUrl(raw ? new URL(raw).hostname : "Unknown site");
        } catch {
          setCurrentUrl("Unknown site");
        }
      });
    } else {
      setCurrentUrl("example.com");
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleToggleSite = async (siteUrl: string, nextEnabled: boolean) => {
    const full = normalize(siteUrl);
    try {
      if (nextEnabled) {
        await addBlockedSitesMutation.mutateAsync([full]);
      } else {
        await removeBlockedSitesMutation.mutateAsync([full]);
      }
    } catch {}
  };

  const addNewSite = async () => {
    if (newSiteUrl.trim()) {
      const normalized = normalizeUrlToDomain(withHttps(newSiteUrl.trim()));
      const full = normalize(newSiteUrl);
      try {
        await addBlockedSitesMutation.mutateAsync([full]);
        if (!customSitesList.includes(normalized)) {
          setCustomSitesList(prev => [...prev, normalized]);
        }
        setExpanded(prev => ({ ...prev, "my-sites": true }));
        setNewSiteUrl("");
        setShowAddSite(false);
      } catch {}
    }
  };

  const blockCurrentSite = async () => {
    if (currentUrl && !["Loading...", "Unknown site"].includes(currentUrl)) {
      const normalized = normalizeUrlToDomain(withHttps(currentUrl));
      const full = normalize(currentUrl);
      try {
        await addBlockedSitesMutation.mutateAsync([full]);
        if (!customSitesList.includes(normalized)) {
          setCustomSitesList(prev => [...prev, normalized]);
        }
        setExpanded(prev => ({ ...prev, "my-sites": true }));
      } catch {}
    }
  };

  const removeCustomSite = (siteUrl: string) => {
    const normalized = normalizeUrlToDomain(withHttps(siteUrl));
    // Remove from custom sites list (localStorage)
    setCustomSitesList(prev => prev.filter(url => url !== normalized));
    const full = normalize(siteUrl);
    removeBlockedSitesMutation.mutateAsync([full]).catch(() => {});
  };

  const SiteRow = ({
    site,
    onChange,
    isCustom = false,
    onDelete,
  }: {
    site: Site;
    onChange: (checked: boolean) => void;
    isCustom?: boolean;
    onDelete?: () => void;
  }) => (
    <div className="px-4 py-1.5 flex items-center justify-between border-t border-[#7A4A1E]/10 hover:bg-[#7A4A1E]/10 transition-colors group">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-1 h-1 rounded-full bg-[#FF944D]/40 group-hover:bg-[#FF944D] transition-colors"></div>
        <span className="text-xs text-[#F5E6D3] truncate font-medium group-hover:text-[#FF944D] transition-colors">
          {site.url}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isCustom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-[#D4C4A8] hover:text-red-400 hover:bg-red-500/10 p-1 h-auto rounded"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        <Switch
          checked={site.enabled}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#7A4A1E]/70 scale-75"
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.hash = "#/welcome";
    }
  }, [authLoading, session]);

  if (authLoading) {
    return (
      <div
        className="w-[400px] h-[600px] shadow-lg flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)",
        }}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#FF944D] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-[#D4C4A8] text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div
        className="w-[400px] h-[600px] shadow-lg flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)",
        }}
      >
        <div className="text-center space-y-4">
          <div className="text-red-400">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[#F5E6D3] text-sm font-medium">
              Authentication Error
            </p>
            <p className="text-[#D4C4A8] text-xs mt-1">
              Unable to verify your session
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#FF944D] hover:bg-[#FF944D]/80 text-white rounded-xl text-sm px-4 py-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (
    !subscriptionLoading &&
    subscriptionStatus &&
    !subscriptionStatus.hasAccess
  ) {
    return (
      <div
        className="w-[400px] h-[600px] shadow-lg flex flex-col"
        style={{
          background:
            "radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)",
        }}
      >
        <TrialExpiredOverlay />
      </div>
    );
  }

  if (showAccount) {
    return (
      <div
        className="w-[400px] h-[600px] shadow-lg flex flex-col"
        style={{
          background:
            "radial-gradient(circle at center, #2D1B11 0%, #1E120B 40%, #0F0905 100%)",
        }}
      >
        <div
          className="p-4 border-b border-[#5A351E]/20 opacity-0"
          style={{
            animation: 'slideInUp 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards',
            background:
              "linear-gradient(135deg, #1E120B 0%, #2D1B11 50%, #3E2718 100%)"}}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAccount(false)}
              className="text-[#F5E6D3] hover:bg-[#5A351E]/20"
            >
              ←
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF944D]/20 animate-pulse rounded-full"></div>
              <div className="relative bg-gradient-to-br from-[#5A351E] to-[#3A2315] p-2 rounded-full border border-[#FF944D]/30 shadow-lg">
                <User className="w-5 h-5 text-[#FF944D]" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-[#F5E6D3] text-lg">
                Account Settings
              </h2>
              <p className="text-sm text-[#D4C4A8] -mt-0.5">
                Manage your preferences
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 space-y-3 flex-1 opacity-0"
          style={{
            background:
              "radial-gradient(circle at bottom right, #3E2718 0%, #2D1B11 30%, #1E120B 60%, #0F0905 100%), linear-gradient(135deg, rgba(62, 39, 24, 0.4) 0%, rgba(45, 27, 17, 0.6) 30%, rgba(30, 18, 11, 0.8) 70%, rgba(15, 9, 5, 0.9) 100%)",
            animation: 'slideInUp 0.3s ease-out 75ms forwards, fadeIn 0.3s ease-out 75ms forwards'
          }}
        >
          <Card
            className="rounded-xl backdrop-blur-sm opacity-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)",
              boxShadow:
                "0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 148, 77, 0.15)",
              animation: 'slideInUp 0.3s ease-out 150ms forwards, fadeIn 0.3s ease-out 150ms forwards'
            }}
          >
            <CardHeader
              className="rounded-t-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(90, 53, 30, 0.6) 0%, rgba(58, 35, 21, 0.7) 30%, rgba(30, 18, 11, 0.8) 60%, rgba(90, 53, 30, 0.5) 100%)",
              }}
            >
              <CardTitle className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                  <div className="relative bg-gradient-to-br from-[#5A351E]/90 to-[#3A2315]/90 p-1.5 rounded-xl border border-[#FF944D]/40">
                    <CreditCard className="w-4 h-4 text-[#FF944D]" />
                  </div>
                </div>
                <div>
                  <span className="text-[#F5E6D3]">Subscription</span>
                  <p className="text-xs text-[#D4C4A8] -mt-0.5">
                    Manage your plan
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {subscriptionLoading ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin h-4 w-4 border-2 border-[#FF944D] border-t-transparent rounded-full"></div>
                </div>
              ) : subscriptionStatus ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#D4C4A8]">Plan</span>
                    <Badge className="bg-[#FF944D]/20 text-[#FF944D] border-[#FF944D]/30 rounded-full text-xs px-2">
                      {subscriptionStatus.planType === "trial"
                        ? "Free Trial"
                        : subscriptionStatus.planType === "monthly"
                        ? "Pro"
                        : "Expired"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#D4C4A8]">Status</span>
                    <Badge
                      className={`rounded-full text-xs ${
                        subscriptionStatus.hasAccess
                          ? "bg-[#8FBC8F]/20 text-[#8FBC8F] border-[#8FBC8F]/30"
                          : "bg-red-500/20 text-red-500 border-red-500/30"
                      }`}
                    >
                      {subscriptionStatus.hasAccess ? "Active" : "Expired"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#D4C4A8]">
                      {subscriptionStatus.planType === "trial"
                        ? "Trial ends"
                        : subscriptionStatus.planType === "monthly"
                        ? "Next billing"
                        : "Expired on"}
                    </span>
                    <span className="text-xs font-medium text-[#F5E6D3]">
                      {subscriptionStatus.planType === "trial" &&
                      subscriptionStatus.trialEndsAt
                        ? formatDate(subscriptionStatus.trialEndsAt)
                        : subscriptionStatus.planType === "monthly" &&
                          subscriptionStatus.currentPeriodEnd
                        ? formatDate(subscriptionStatus.currentPeriodEnd)
                        : subscriptionStatus.trialEndsAt
                        ? formatDate(subscriptionStatus.trialEndsAt)
                        : "N/A"}
                    </span>
                  </div>
                  {subscriptionStatus.planType === "trial" &&
                    subscriptionStatus.daysRemaining >= 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-[#FF944D] text-center font-medium">
                          {formatTimeRemaining(
                            subscriptionStatus.daysRemaining
                          )}
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <div className="text-xs text-[#D4C4A8] text-center py-2">
                  Unable to load subscription status
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="rounded-xl backdrop-blur-sm opacity-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)",
              boxShadow:
                "0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 148, 77, 0.15)",
              animation: 'slideInUp 0.3s ease-out 225ms forwards, fadeIn 0.3s ease-out 225ms forwards'
            }}
          >
            <CardHeader
              className="rounded-t-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(90, 53, 30, 0.6) 0%, rgba(58, 35, 21, 0.7) 30%, rgba(30, 18, 11, 0.8) 60%, rgba(90, 53, 30, 0.5) 100%)",
              }}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                    <div className="relative bg-gradient-to-br from-[#5A351E]/90 to-[#3A2315]/90 p-1.5 rounded-xl border border-[#FF944D]/40">
                      <Users className="w-4 h-4 text-[#FF944D]" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[#F5E6D3]">
                      Accountability Partner
                    </span>
                    <p className="text-xs text-[#D4C4A8] -mt-0.5">
                      Stay accountable together
                    </p>
                  </div>
                </div>
                <Switch
                  checked={partnerEnabled}
                  onCheckedChange={setPartnerEnabled}
                  className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#5A351E]/70 scale-75"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className={partnerEnabled ? "space-y-4" : "space-y-0"}>
              {partnerEnabled && (
                <>
                  {accountabilityPartner?.email ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#D4C4A8]/60" />
                        <label className="text-sm font-medium text-[#D4C4A8]/80">
                          Partner Email (Locked)
                        </label>
                      </div>
                      <div className="relative">
                        <Input
                          type="email"
                          value={accountabilityPartner.email}
                          disabled
                          className="bg-[#1E120B]/30 border-[#5A351E]/40 text-[#D4C4A8]/60 cursor-not-allowed rounded-xl"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Lock className="w-4 h-4 text-[#D4C4A8]/40" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[#5A351E]/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-[#D4C4A8]/60 flex-shrink-0" />
                        <p className="text-xs text-[#D4C4A8]/80">
                          Accountability partner has been set and cannot be changed.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // No partner yet - show input form
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#F5E6D3]">
                          Partner Email
                        </label>
                        <Input
                          type="email"
                          placeholder="partner@example.com"
                          value={partnerEmail}
                          onChange={(e) => {
                            const newEmail = e.target.value;
                            setPartnerEmail(newEmail);
                            if (!validateEmail(newEmail)) {
                              setEmailError("Please enter a valid email address");
                            } else {
                              setEmailError("");
                            }
                            // Reset confirmation if email changes
                            setConfirmingPartner(false);
                          }}
                          onBlur={(e) => validateEmail(e.target.value)}
                          className={`bg-[#1E120B]/50 border-[#5A351E]/70 text-[#F5E6D3] placeholder-[#D4C4A8]/50 focus:ring-2 focus:ring-[#FF944D]/30 rounded-xl ${
                            emailError ? "border-red-500 focus:ring-red-500/20" : ""
                          }`}
                        />
                        {emailError && (
                          <p className="text-xs text-red-400 mt-1">{emailError}</p>
                        )}
                      </div>
                      
                      {confirmingPartner && (
                        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-400 font-medium">
                            This action cannot be undone! Click again to confirm.
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-[#D4C4A8]">
                        Your accountability partner will be notified if the
                        extension is removed from Chrome. Once set, the partner
                        email cannot be changed or removed.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={confirmingPartner ? "destructive" : "outline"}
                          size="sm"
                          className={`w-full rounded-xl transition-all ${
                            confirmingPartner 
                              ? "bg-red-500 hover:bg-red-600 border-red-600 text-white animate-pulse" 
                              : "border-[#FF944D]/30 text-[#FF944D] hover:bg-[#FF944D]/10"
                          } disabled:opacity-60`}
                          onClick={handleSaveAccountabilityPartner}
                          disabled={
                            !!emailError ||
                            savePartnerMutation.isPending ||
                            !partnerEmail
                          }
                        >
                          {savePartnerMutation.isPending
                            ? "Saving..."
                            : confirmingPartner
                            ? "⚠️ Confirm - This Cannot Be Undone"
                            : "Add Accountability Partner"}
                        </Button>
                        {savePartnerMutation.isError && (
                          <span className="text-xs text-red-400">
                            Failed to save
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            size="sm"
            className="w-full hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 transition-all duration-200 group rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[400px] h-[600px] shadow-lg flex flex-col"
      style={{
        background:
          "radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)",
      }}
    >
      {/* Header - Previous: animate-in slide-in-from-bottom duration-300 ease-out */}
      <div
        className="relative p-4 border-b border-[#7A4A1E]/20 opacity-0"
        style={{
          animation: 'slideInUp 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards',
          background:
            "linear-gradient(135deg, #1A1108 0%, #3D2414 50%, #5A3518 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/logo.png"
            alt="Logo"
            className="w-6 h-6 object-contain"
          />
          <h1 className="font-bold text-[#F5E6D3] text-lg tracking-tight">
            Intent
          </h1>
        </div>
        <div className="mt-1" style={{ marginLeft: 0 }}>
          <p
            className="text-base text-[#D4C4A8] italic text-left"
            style={{ fontStyle: "italic", transform: "skew(-10deg)" }}
          >
            "{currentQuote}"
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAccount(true)}
          className="absolute top-2 right-12 text-[#F5E6D3] hover:bg-[#7A4A1E]/20 rounded-xl p-2"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Site - Previous: animate-in slide-in-from-bottom duration-300 ease-out delay-75 */}
      <div
        className="p-4 border-b border-[#7A4A1E]/20 opacity-0"
        style={{
          animation: 'slideInUp 0.3s ease-out 75ms forwards, fadeIn 0.3s ease-out 75ms forwards',
          background:
            "radial-gradient(circle at bottom right, #5A3518 0%, #3D2414 30%, #2A1A0E 60%, #1A1108 100%), linear-gradient(135deg, rgba(90, 53, 24, 0.4) 0%, rgba(61, 36, 14, 0.6) 30%, rgba(42, 26, 14, 0.8) 70%, rgba(26, 17, 8, 0.9) 100%)",
        }}
      >
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
                <p className="text-sm text-[#F5E6D3] font-medium truncate">
                  {currentUrl}
                </p>
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

      <div
        className="flex-1 flex flex-col"
        style={{
          background:
            "radial-gradient(circle at bottom right, #5A3518 0%, #3D2414 30%, #2A1A0E 60%, #1A1108 100%), linear-gradient(135deg, rgba(90, 53, 24, 0.4) 0%, rgba(61, 36, 14, 0.6) 30%, rgba(42, 26, 14, 0.8) 70%, rgba(26, 17, 8, 0.9) 100%)",
        }}
      >
        {/* Blocked Sites Header - Previous: animate-in slide-in-from-bottom duration-300 ease-out delay-150 */}
        <div className="p-4 border-b border-[#7A4A1E]/20 flex items-center justify-between opacity-0" style={{animation: 'slideInUp 0.3s ease-out 150ms forwards, fadeIn 0.3s ease-out 150ms forwards'}}>
          <div>
            <h3 className="font-bold text-[#F5E6D3] text-sm">Blocked Sites</h3>
            <p className="text-xs text-[#D4C4A8] -mt-0.5">
              Manage your focus zones
            </p>
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
          //  Add Site Dropdown - Previous: animate-in slide-in-from-bottom duration-200 ease-out
          <div className="p-4 border-b border-[#7A4A1E]/20 space-y-3 opacity-0" style={{animation: 'slideInUp 0.2s ease-out forwards, fadeIn 0.2s ease-out forwards'}}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-xl"></div>
                <div className="relative bg-gradient-to-br from-[#7A4A1E] to-[#5A3518] p-2 rounded-xl border border-[#FF944D]/30 shadow-lg">
                  <Plus className="w-4 h-4 text-[#FF944D]" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#F5E6D3] text-sm">
                  Add New Site
                </h4>
                <p className="text-xs text-[#D4C4A8]">
                  Enter the website URL to block
                </p>
              </div>
            </div>
            <Input
              placeholder="example.com"
              value={newSiteUrl}
              onChange={(e) => setNewSiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNewSite()}
              className="bg-[#1A1108]/50 border-[#7A4A1E]/70 text-[#F5E6D3] placeholder-[#D4C4A8]/50 focus:ring-2 focus:ring-[#FF944D]/30 rounded-xl"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addNewSite}
                className="bg-[#FF944D] hover:bg-[#FF944D]/80 text-white rounded-xl"
              >
                Add Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSite(false)}
                className="border-[#7A4A1E]/50 text-[#F5E6D3] hover:bg-[#7A4A1E]/20 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 p-4 space-y-2">
          {computedCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="border-b border-[#7A4A1E]/20 last:border-b-0 opacity-0"
                style={{
                  // Previous: stagger was 120ms between items (225 + index * 120)
                  animation: `slideInUp 0.3s ease-out ${
                    225 + index * 75
                  }ms forwards, fadeIn 0.3s ease-out ${
                    225 + index * 75
                  }ms forwards`,
                }}
              >
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
                      <span className="font-semibold text-[#F5E6D3] group-hover:text-[#FF944D] transition-colors text-xs">
                        {category.name}
                      </span>
                      <span className="text-xs text-[#FF944D]/50">
                        {category.sites.reduce(
                          (count, site) => count + (site.enabled ? 1 : 0),
                          0
                        )}
                      </span>
                    </div>
                  </div>
                  {category.expanded ? (
                    <ChevronUp className="w-4 h-4 text-[#D4C4A8] group-hover:text-[#FF944D] transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#D4C4A8] group-hover:text-[#FF944D] transition-colors" />
                  )}
                </button>

                {category.expanded && (
                  <div className="border-t border-[#7A4A1E]/20">
                    {category.sites.map((site) => (
                      <SiteRow
                        key={site.url}
                        site={site}
                        isCustom={category.id === "my-sites"}
                        onChange={(checked) =>
                          handleToggleSite(site.url, checked)
                        }
                        onDelete={category.id === "my-sites" ? () => removeCustomSite(site.url) : undefined}
                      />
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
