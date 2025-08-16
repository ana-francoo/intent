import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import quotes from "../utils/quotes";
import {
  normalizeUrlToDomain
} from "../utils/storage";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";

import {
  ENTERTAINMENT_SITES,
  NEWS_SITES,
  SHOPPING_SITES,
  SOCIAL_SITES,
} from "@/utils/categoryPresets";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gamepad2,
  Globe,
  LogOut,
  Newspaper,
  Plus,
  Settings,
  ShoppingBag,
  Target,
  User,
  Users,
} from "lucide-react";

// ── File-local helpers ─────────────────────────────────────────────
const withHttps = (urlLike: string) =>
  urlLike.startsWith("http") ? urlLike : `https://${urlLike}`;

const normalizeLike = (urlLike: string) =>
  normalizeUrlToDomain(withHttps(urlLike.trim()));

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

// Tour-specific dashboard without auth checks
const TourDashboard = () => {
  const [currentUrl] = useState("mycurrenturl.com"); // Hardcoded for tour
  const [showAccount, setShowAccount] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [settingsEnabled, setSettingsEnabled] = useState(false); // Disabled until tour step 2
  const [accountabilityPartner, setAccountabilityPartner] = useState({
    enabled: false,
    email: "",
  });

  const [emailError, setEmailError] = useState("");
  const [partnerSaving, setPartnerSaving] = useState(false);
  const [partnerSaved, setPartnerSaved] = useState(false);
  const [partnerSaveError, setPartnerSaveError] = useState("");
  const [enableScroll, setEnableScroll] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const inFlightTogglesRef = useRef<Set<string>>(new Set());
  const partnerSavedTimeoutRef = useRef<number | null>(null);

  const getRandomQuote = (): string => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Set initial random quote and listen for tour messages
  useEffect(() => {
    setCurrentQuote(getRandomQuote());

    // Listen for tour progress messages from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "TOUR_STEP_2_REACHED") {
        setSettingsEnabled(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Enable scrolling after animations complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnableScroll(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Re-enable scrolling when switching to Account Settings
  useEffect(() => {
    if (showAccount) {
      const timer = setTimeout(() => {
        setEnableScroll(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showAccount]);

  // Note: For tour mode, we skip auth-related features
  const handleSaveAccountabilityPartner = async () => {
    setPartnerSaveError("");
    if (!validateEmail(accountabilityPartner.email)) return;
    try {
      setPartnerSaving(true);
      // In tour mode, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPartnerSaved(true);
      if (partnerSavedTimeoutRef.current)
        clearTimeout(partnerSavedTimeoutRef.current);
      partnerSavedTimeoutRef.current = window.setTimeout(
        () => setPartnerSaved(false),
        2000
      );
    } catch (e: any) {
      setPartnerSaveError(e?.message || "Failed to save");
    } finally {
      setPartnerSaving(false);
    }
  };

  // Cleanup 'Saved!' timeout on unmount
  useEffect(() => {
    return () => {
      if (partnerSavedTimeoutRef.current) {
        clearTimeout(partnerSavedTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    // In tour mode, logout just shows a message or does nothing
    console.log("Logout clicked in tour mode");
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("");
      return true;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const [categories, setCategories] = useState<SiteCategory[]>([
    {
      id: "social",
      name: "Social",
      icon: Users,
      expanded: false,
      sites: SOCIAL_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: Gamepad2,
      expanded: false,
      sites: ENTERTAINMENT_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: "shopping",
      name: "Shopping",
      icon: ShoppingBag,
      expanded: false,
      sites: SHOPPING_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: "news",
      name: "News",
      icon: Newspaper,
      expanded: false,
      sites: NEWS_SITES.map((url) => ({ url, enabled: true })),
    },
    {
      id: "my-sites",
      name: "My Sites",
      icon: Target,
      expanded: false,
      sites: [
        { url: "example.com", enabled: false },
        { url: "test-site.com", enabled: true },
      ],
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  };

  const toggleSite = async (
    categoryId: string,
    siteUrl: string,
    nextEnabled: boolean
  ) => {
    const domain = normalizeLike(siteUrl);
    const key = `${categoryId}|${domain}`;
    if (inFlightTogglesRef.current.has(key)) return;
    inFlightTogglesRef.current.add(key);

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              sites: cat.sites.map((site) =>
                site.url === siteUrl ? { ...site, enabled: nextEnabled } : site
              ),
            }
          : cat
      )
    );

    // In tour mode, we don't persist to database
    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (e) {
      console.error("Failed to sync blocked site toggle:", e);
      // Rollback on error
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                sites: cat.sites.map((site) =>
                  site.url === siteUrl
                    ? { ...site, enabled: !nextEnabled }
                    : site
                ),
              }
            : cat
        )
      );
    } finally {
      inFlightTogglesRef.current.delete(key);
    }
  };

  const addNewSite = async () => {
    if (newSiteUrl.trim()) {
      const normalized = normalizeLike(newSiteUrl);
      // In tour mode, just add to local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === "my-sites"
            ? {
                ...cat,
                sites: [...cat.sites, { url: normalized, enabled: false }],
              }
            : cat
        )
      );
      setNewSiteUrl("");
      setShowAddSite(false);
    }
  };

  const blockCurrentSite = async () => {
    const normalized = normalizeLike(currentUrl);
    const mySitesCat = categories.find((cat) => cat.id === "my-sites");
    const siteExists = mySitesCat?.sites.some(
      (site) => site.url === normalized
    );

    if (!siteExists) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === "my-sites"
            ? {
                ...cat,
                sites: [...cat.sites, { url: normalized, enabled: false }],
              }
            : cat
        )
      );
    }
  };

  // ── Internal presentational component: SiteRow ──────────────────────────────
  const SiteRow = ({
    site,
    onChange,
  }: {
    site: Site;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="px-4 py-1.5 flex items-center justify-between border-t border-[#7A4A1E]/10 hover:bg-[#7A4A1E]/10 transition-colors group">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-1 h-1 rounded-full bg-[#FF944D]/40 group-hover:bg-[#FF944D] transition-colors"></div>
        <span className="text-xs text-[#F5E6D3] truncate font-medium group-hover:text-[#FF944D] transition-colors">
          {site.url}
        </span>
      </div>
      <Switch
        checked={site.enabled}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#7A4A1E]/70 scale-75"
      />
    </div>
  );

  // Render Account/User Settings as the second page
  if (showAccount) {
    return (
      <div
        className="w-[400px] h-[600px] shadow-lg overflow-hidden font-['Geist'] flex flex-col"
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
              "linear-gradient(135deg, #1E120B 0%, #2D1B11 50%, #3E2718 100%)",
          }}
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
          className={`p-4 space-y-3 flex-1 opacity-0 ${
            enableScroll ? "overflow-y-auto" : "overflow-hidden"
          }`}
          style={{
            animation: 'slideInUp 0.3s ease-out 75ms forwards, fadeIn 0.3s ease-out 75ms forwards',
            background:
              "radial-gradient(circle at bottom right, #3E2718 0%, #2D1B11 30%, #1E120B 60%, #0F0905 100%), linear-gradient(135deg, rgba(62, 39, 24, 0.4) 0%, rgba(45, 27, 17, 0.6) 30%, rgba(30, 18, 11, 0.8) 70%, rgba(15, 9, 5, 0.9) 100%)",
          }}
        >
          <Card
            className="rounded-xl backdrop-blur-sm opacity-0"
            style={{
              animation: 'slideInUp 0.3s ease-out 150ms forwards, fadeIn 0.3s ease-out 150ms forwards',
              background:
                "linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)",
              boxShadow:
                "0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 148, 77, 0.15)",
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
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Plan</span>
                <Badge className="bg-[#FF944D]/20 text-[#FF944D] border-[#FF944D]/30 rounded-full text-xs px-2">
                  Pro
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Status</span>
                <Badge className="bg-[#8FBC8F]/20 text-[#8FBC8F] border-[#8FBC8F]/30 rounded-full text-xs">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4C4A8]">Next billing</span>
                <span className="text-xs font-medium text-[#F5E6D3]">
                  Dec 15, 2024
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="rounded-xl backdrop-blur-sm opacity-0"
            style={{
              animation: 'slideInUp 0.3s ease-out 225ms forwards, fadeIn 0.3s ease-out 225ms forwards',
              background:
                "linear-gradient(135deg, rgba(90, 53, 30, 0.8) 0%, rgba(58, 35, 21, 0.9) 30%, rgba(30, 18, 11, 0.95) 60%, rgba(90, 53, 30, 0.7) 100%)",
              boxShadow:
                "0 4px 20px rgba(255, 148, 77, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 148, 77, 0.15)",
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
                  checked={accountabilityPartner.enabled}
                  onCheckedChange={(checked) =>
                    setAccountabilityPartner((prev) => ({
                      ...prev,
                      enabled: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-[#FF944D] data-[state=unchecked]:bg-[#5A351E]/70 scale-75"
                />
              </CardTitle>
            </CardHeader>
            <CardContent
              className={
                accountabilityPartner.enabled ? "space-y-4" : "space-y-0"
              }
            >
              {accountabilityPartner.enabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#F5E6D3]">
                      Partner Email
                    </label>
                    <Input
                      type="email"
                      placeholder="partner@example.com"
                      value={accountabilityPartner.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;
                        setAccountabilityPartner((prev) => ({
                          ...prev,
                          email: newEmail,
                        }));
                        validateEmail(newEmail);
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
                  <p className="text-xs text-[#D4C4A8]">
                    Your accountability partner will be notified if the
                    extension is removed from Chrome. Please note that once a
                    partner is set up, this action can not be undone.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-[#FF944D]/30 text-[#FF944D] hover:bg-[#FF944D]/10 disabled:opacity-60"
                      onClick={handleSaveAccountabilityPartner}
                      disabled={
                        !!emailError ||
                        partnerSaving ||
                        !accountabilityPartner.email
                      }
                    >
                      {partnerSaving
                        ? "Saving..."
                        : partnerSaved
                        ? "Saved!"
                        : "Save Settings"}
                    </Button>
                    {partnerSaveError && (
                      <span className="text-xs text-red-400">
                        {partnerSaveError}
                      </span>
                    )}
                  </div>
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
      className="w-[400px] h-[600px] shadow-lg overflow-hidden font-['Geist'] flex flex-col"
      style={{
        background:
          "radial-gradient(circle at center, #3D2414 0%, #2A1A0E 40%, #1A1108 100%)",
      }}
    >
      {/* Clean Header */}
      <div
        className="relative p-4 border-b border-[#7A4A1E]/20 animate-in slide-in-from-bottom duration-300 ease-out"
        style={{
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
          onClick={() => {
            if (!settingsEnabled) return;
            // Notify parent (tour overlay) immediately that settings was opened
            try {
              window.parent?.postMessage(
                { type: "OPEN_ACCOUNT_SETTINGS" },
                "*"
              );
            } catch {}
            setShowAccount(true);
            setEnableScroll(false);
          }}
          className="absolute top-2 right-12 text-[#F5E6D3] hover:bg-[#7A4A1E]/20 rounded-xl p-2"
          disabled={!settingsEnabled}
          style={{
            opacity: settingsEnabled ? 1 : 0.3,
            cursor: settingsEnabled ? "pointer" : "not-allowed",
            pointerEvents: settingsEnabled ? "auto" : "none",
          }}
          title={
            !settingsEnabled
              ? "Complete the tour steps to unlock settings"
              : "Account Settings"
          }
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Site - Clean & Modern */}
      <div
        className="p-4 border-b border-[#7A4A1E]/20 animate-in slide-in-from-bottom duration-300 ease-out delay-75"
        style={{
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

      {/* Blocked Sites Management */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        style={{
          background:
            "radial-gradient(circle at bottom right, #5A3518 0%, #3D2414 30%, #2A1A0E 60%, #1A1108 100%), linear-gradient(135deg, rgba(90, 53, 24, 0.4) 0%, rgba(61, 36, 14, 0.6) 30%, rgba(42, 26, 14, 0.8) 70%, rgba(26, 17, 8, 0.9) 100%)",
        }}
      >
        <div className="p-4 border-b border-[#7A4A1E]/20 flex items-center justify-between animate-in slide-in-from-bottom duration-300 ease-out delay-150">
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
          <div className="p-4 border-b border-[#7A4A1E]/20 space-y-3 animate-in slide-in-from-bottom duration-200 ease-out">
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

        <div
          className={`flex-1 min-h-0 p-4 space-y-2 ${
            enableScroll ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          {categories.map((category, index) => {
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
                        onChange={(checked) =>
                          toggleSite(category.id, site.url, checked)
                        }
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

export default TourDashboard;
