import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const POLAR_PRODUCT_ID =
  import.meta.env.VITE_POLAR_PRODUCT_ID ||
  "9d05c24b-68af-4545-84c9-db4dc75c871c";
const CHECKOUT_URL =
  import.meta.env.VITE_CHECKOUT_URL || "http://localhost:4000/api/checkout";

interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialing: boolean;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  needsPayment: boolean;
}

export const SubscriptionTest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Not authenticated. Please sign in first.");
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.log("Creating profile with trial...");
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          subscription_status: "trialing",
          trial_end: trialEndDate.toISOString(),
        });

        if (insertError) {
          setError("Failed to create profile: " + insertError.message);
          setLoading(false);
          return;
        }

        const { data: newProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        processSubscriptionStatus(newProfile);
      } else {
        processSubscriptionStatus(profile);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      setError("Failed to check subscription status");
    } finally {
      setLoading(false);
    }
  };

  const processSubscriptionStatus = (profile: any) => {
    const now = new Date();

    const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
    const isTrialing = trialEnd && trialEnd > now;

    const currentPeriodEnd = profile.current_period_end
      ? new Date(profile.current_period_end)
      : null;
    const hasActiveSubscription =
      profile.subscription_status === "active" &&
      currentPeriodEnd &&
      currentPeriodEnd > now;

    let daysRemaining = 0;
    if (isTrialing && trialEnd) {
      daysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else if (hasActiveSubscription && currentPeriodEnd) {
      daysRemaining = Math.ceil(
        (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const hasAccess = isTrialing || hasActiveSubscription;
    const needsPayment = !hasAccess;

    setStatus({
      hasAccess,
      isTrialing: isTrialing || false,
      trialEnd,
      currentPeriodEnd,
      daysRemaining,
      needsPayment,
    });

    if (needsPayment) {
      redirectToCheckout();
    }
  };

  const redirectToCheckout = () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    const checkoutUrl =
      `${CHECKOUT_URL}?` +
      `products=${POLAR_PRODUCT_ID}&` +
      `customerExternalId=${user.id}&` +
      `customerEmail=${encodeURIComponent(user.email || "")}`;

    console.log("Redirecting to checkout:", checkoutUrl);

    window.open(checkoutUrl, "_blank");
  };

  const handleSignIn = () => {
    navigate("/login")
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Subscription Status Test</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Subscription Status Test</h2>
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={handleSignIn}
          className="bg-blue-500 text-black px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Subscription Status Test</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {user && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-black">
          <p className="text-sm">
            <strong>User:</strong> {user.email}
          </p>
          <p className="text-sm">
            <strong>ID:</strong> {user.id}
          </p>
        </div>
      )}

      {status && (
        <div className="space-y-3">
          <div
            className={`p-3 rounded ${
              status.hasAccess
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <p className="font-medium text-black">
              Access Status: {status.hasAccess ? " Active" : "� Expired"}
            </p>
          </div>

          <div className="p-3 text-black bg-blue-50 border border-blue-200 rounded">
            <p>
              <strong>Trial Status:</strong>{" "}
              {status.isTrialing ? "Active" : "Inactive"}
            </p>
            {status.trialEnd && (
              <p className="text-sm text-gray-600">
                Trial ends: {formatDate(status.trialEnd)}
              </p>
            )}
          </div>

          {status.currentPeriodEnd && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p>
                <strong>Subscription End:</strong>{" "}
                {formatDate(status.currentPeriodEnd)}
              </p>
            </div>
          )}

          <div className="p-3 bg-gray-50 text-black rounded">
            <p>
              <strong>Days Remaining:</strong> {status.daysRemaining}
            </p>
          </div>

          {status.needsPayment && (
            <div className="mt-4">
              <button
                onClick={redirectToCheckout}
                className="w-full bg-orange-500 text-black px-4 py-2 rounded hover:bg-orange-600"
              >
                Subscribe Now ($2/month)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
