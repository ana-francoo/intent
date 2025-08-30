import { useSearchParams } from "react-router-dom";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Clock, ChevronLeftIcon, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  normalizeUrlToDomain,
  saveIntention,
  getIntention,
} from "@/utils/storage";
import { getWebsiteCategory } from "@/utils/domainCategories";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo2.png";
import Flame from "../home/Flame";
import { validateIntention } from "../../utils/intentionMatcher";
import "./overlay.css";
import IntentionTextarea from "@/components/intention/IntentionTextarea";
import { markNewIntentionSet } from "../../utils/intentionMonitor";

interface FormState {
  success: boolean;
  error: string | null;
  intention?: string;
}

// Fast client-side validation for immediate feedback
const validateIntentionClientSide = async (
  intentionText: string
): Promise<boolean> => {
  const trimmed = intentionText.trim();

  // Too short
  if (trimmed.length < 10) return false;

  // Lightweight server-side check
  return validateIntention(trimmed);
};

async function submitIntention(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const intention = formData.get("intention")?.toString()?.trim();
  const targetUrl = formData.get("targetUrl")?.toString();

  if (!intention) {
    return { error: "Please provide an intention or time", success: false };
  }

  if (!targetUrl) {
    return { error: "Target URL is missing", success: false };
  }

  // Handle time-based blocking (just a number means minutes)
  if (/^\d+$/.test(intention)) {
    const minutes = parseInt(intention);
    if (minutes > 0) {
      await saveIntention(targetUrl, `block:${minutes}`);
      return { success: true, error: null, intention: `block:${minutes}` };
    }
  }

  try {
    // console.log('🔍 Starting intention validation for:', intention);

    // Fast client-side validation first
    const clientSideValid = await validateIntentionClientSide(intention);
    if (!clientSideValid) {
      return {
        error: "Please write a more targeted intention",
        success: false,
      };
    }

    // console.log('🔍 Calling validateIntention with:', intention);
    const isValid = await validateIntention(intention);
    // console.log('📊 Validation result:', { isValid });

    if (!isValid) {
      // console.log('❌ Intention validation failed');
      return {
        error: "Please write a more targeted intention",
        success: false,
      };
    }

    // console.log('✅ Intention validation passed, saving intention...');
    await saveIntention(targetUrl, intention);
    // console.log('💾 Intention saved successfully');
    return { success: true, error: null, intention };
  } catch (error) {
    console.error("Error setting intention:", error);

    if (error instanceof Error) {
      if (error.message.includes("Chrome storage")) {
        return {
          error: "Unable to save intention. Please check browser permissions.",
          success: false,
        };
      }
      if (error.message.includes("Extension context")) {
        return {
          error: "Extension needs to be reloaded. Please refresh the page.",
          success: false,
        };
      }
    }

    return {
      error: "Failed to set intention. Please try again.",
      success: false,
    };
  }
}

function InputContainer({
  children,
  shakeKey,
  state,
}: {
  children: React.ReactNode;
  shakeKey: number;
  state: { error: string | null };
}) {
  const { pending } = useFormStatus();

  return (
    <div
      key={shakeKey}
      className={cn(
        "relative isolate rounded-xl border-2 border-transparent",
        pending && "conic-pending-border", // animated border when pending
        !state.error && "animate-slide-in-up delay-150"
      )}
      style={{
        animation: state.error ? "shake 0.6s ease-in-out" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// Input container with orange border when pending
// function InputContainer({ children, shakeKey, state }: {
//   children: React.ReactNode;
//   shakeKey: number;
//   state: { error: string | null };
// }) {
//   const { pending } = useFormStatus();

//   return (
//     <div
//       key={shakeKey}
//       className={cn(
//         'relative border-2 rounded-xl',
//         pending ? 'border-orange-500' : 'border-transparent',
//         !state.error && 'animate-slide-in-up delay-150'
//       )}
//       style={{
//         animation: state.error ? 'shake 0.6s ease-in-out' : undefined
//       }}
//     >
//       {children}
//     </div>
//   );
// }

function TimeSelector({
  domain,
  customMinutes,
  setCustomMinutes,
}: {
  domain: string;
  customMinutes: string;
  setCustomMinutes: (value: string) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <h3 className="text-lg font-medium text-center mb-6">
        Block intent on {domain} for:
      </h3>

      <div className="flex gap-2 justify-center">
        <div className="relative flex-1 max-w-40">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="number"
            name="intention"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.closest("form")?.requestSubmit();
              }
            }}
            placeholder="Enter minutes"
            min="1"
            max="999"
            disabled={pending}
            className="pl-10"
          />
        </div>
        <Button
          type="submit"
          disabled={pending || !customMinutes}
          className="shrink-0 h-9"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Block"}
        </Button>
      </div>
    </>
  );
}

export default function IntentionOverlay() {
  const [searchParams] = useSearchParams();
  const targetUrl = searchParams.get("targetUrl");
  const passedLastSafeUrl = searchParams.get("lastSafeUrl");
  const mismatchMode = searchParams.get("intentionMismatch") === "true";
  const domain = normalizeUrlToDomain(targetUrl || "");
  const category = targetUrl ? getWebsiteCategory(targetUrl) : "other";
  const isTimeBasedCategory =
    category === "entertainment" || category === "shopping";

  const [state, formAction] = useActionState(submitIntention, {
    success: false,
    error: null,
  });

  const [customMinutes, setCustomMinutes] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [intentionText, setIntentionText] = useState("");
  const [existingIntention, setExistingIntention] = useState<string | null>(
    null
  );

  //! ADJUST TIMEOUT BEFORE REDIRECT
  useEffect(() => {
    if (state.success && targetUrl) {
      const timer = setTimeout(() => {
        window.location.href = targetUrl;
      }, 1750); // Increased from 1250ms to 3000ms (3 seconds)
      return () => clearTimeout(timer);
    }
  }, [state.success, targetUrl]);

  useEffect(() => {
    if (state.success) {
      markNewIntentionSet();
    }
  }, [state.success]);

  // When launched due to mismatch, fetch the existing intention to display
  useEffect(() => {
    (async () => {
      if (mismatchMode && targetUrl) {
        const prev = await getIntention(targetUrl);
        setExistingIntention(prev?.intention || null);
      }
    })();
  }, [mismatchMode, targetUrl]);

  useEffect(() => {
    if (state.error) {
      setShakeKey((prev) => prev + 1);
    }
  }, [state.error]);

  // Custom form action that increments shake key on every submission
  const handleFormAction = useCallback(
    async (formData: FormData) => {
      setShakeKey((prev) => prev + 1);
      return formAction(formData);
    },
    [formAction]
  );

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className={cn(
          "absolute inset-0 z-0 bg-radial-[ellipse_80%_60%_at_50%_0%] from-orange-900/20 to-transparent to-70% transition-colors duration-1000"
        )}
      />
      {/* Layout: if mismatch, space elements top/bottom; otherwise keep default */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-auto flex flex-col items-center min-h-screen space-y-8 pt-[450px]",
          state.success && "animate-slide-out-up delay-1500"
        )}
      >
        <div className="flex justify-center relative animate-slide-in-up">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10.5">
            <Flame
              className={cn(
                "scale-35 scale-x-45",
                mismatchMode
                  ? "animate-flame-ignition"
                  : state.success
                  ? "animate-flame-ignition"
                  : "opacity-0 scale-0"
              )}
            />
          </div>
          <img
            src={logo}
            alt="Logo"
            className={cn(
              "size-24 opacity-80 transition-all duration-500",
              (state.success || mismatchMode) && [
                "rounded-full",
                "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-orange-400)_15%,transparent)_60%,transparent_100%)]",
                "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-orange-400)_8%,transparent)]",
                "opacity-100",
              ]
            )}
          />
        </div>

        {mismatchMode && (
          <div className="animate-slide-in-up text-center mt-4 max-w-prose px-4 mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-amber-200/70">
              <AlertTriangle className="size-3 opacity-80" />
              <span className="text-xs">
                This page doesn&apos;t match your current intention
              </span>
            </div>
            {existingIntention && (
              <p className="text-base leading-relaxed break-words overflow-hidden font-medium overlay-intention-text opacity-90">
                {existingIntention}
              </p>
            )}
          </div>
        )}

        <Button
          onClick={() => {
            try {
              const decodedTargetUrl = targetUrl
                ? decodeURIComponent(targetUrl)
                : "";
              const triggering =
                decodedTargetUrl ||
                sessionStorage.getItem("intent_last_blocked_url") ||
                "";
              const prev = sessionStorage.getItem("intent_prev_url");
              const prevPrev = sessionStorage.getItem(
                "intent_prev_prev_url"
              );
              const safeFromSession = sessionStorage.getItem(
                "intent_last_safe_url"
              );
              const safeFromParam = passedLastSafeUrl
                ? decodeURIComponent(passedLastSafeUrl)
                : "";
              const safe = safeFromParam || safeFromSession || "";

              console.log("🔙 Back button logic:", {
                targetUrl,
                decodedTargetUrl,
                triggering,
                safe,
                safeFromParam,
                safeFromSession,
                prev,
                prevPrev,
              });

              // If we have a safe URL and it's different from the triggering URL, go to safe
              if (safe && safe !== triggering) {
                console.log("✅ Redirecting to safe URL:", safe);
                window.location.href = safe;
                return;
              }

              if (prev && new URL(prev).href === new URL(triggering).href) {
                if (prevPrev) {
                  console.log("↩️ Redirecting to prevPrev URL:", prevPrev);
                  window.location.href = prevPrev;
                  return;
                }
              }

              // Go to previous URL if available
              if (prev) {
                console.log("↩️ Redirecting to prev URL:", prev);
                window.location.href = prev;
                return;
              }
            } catch (error) {
              console.error("❌ Error in back button logic:", error);
            }
            // Fallbacks
            if (targetUrl) {
              console.log(
                "🔄 Fallback: redirecting to targetUrl:",
                targetUrl
              );
              window.location.href = targetUrl;
            } else {
              try {
                console.log("🔄 Fallback: using browser back");
                window.history.back();
              } catch {}
            }
          }}
          variant="ghost"
          size="sm"
          aria-label="Go back"
          className="text-muted-foreground fixed left-6 top-6 pl-2 group gap-1 inline-flex items-center justify-center overflow-hidden"
        >
          <div className="mr-0 w-0 -translate-x-[100%] opacity-0 transition-all duration-200 group-hover:mr-0 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100">
            <ChevronLeftIcon className="size-4" />
          </div>
          <span>Back</span>
        </Button>
        <form action={handleFormAction} className={cn("w-full")}>
          <input type="hidden" name="targetUrl" value={targetUrl || ""} />
          <div className="relative">
            <div className="pl-8">
              {!(state.success && !mismatchMode) ? (
                <InputContainer shakeKey={shakeKey} state={state}>
                  {!isTimeBasedCategory && (
                    <div className="absolute top-0 flex w-full justify-center">
                      <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-orange-700 to-transparent transition-all duration-1000" />
                    </div>
                  )}
                  {isTimeBasedCategory ? (
                    <TimeSelector
                      domain={domain}
                      customMinutes={customMinutes}
                      setCustomMinutes={setCustomMinutes}
                    />
                  ) : (
                    <>
                      <IntentionTextarea
                        domain={domain}
                        value={intentionText}
                        onChange={setIntentionText}
                        placeholder={
                          mismatchMode
                            ? `Update your intention for ${domain}`
                            : undefined
                        }
                      />
                    </>
                  )}
                </InputContainer>
              ) : (
                <div className="animate-slide-in-up text-center mt-6 max-w-prose px-4 mx-auto">
                  <p className="text-lg leading-relaxed break-words overflow-hidden font-medium text-orange-500/80">
                    {state.intention?.startsWith("block:")
                      ? `Blocked for ${state.intention.replace(
                          "block:",
                          ""
                        )} minutes`
                      : state.intention}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {state.intention?.startsWith("block:")
                      ? `Intent blocked on ${domain}`
                      : `Your intention for ${domain}`}
                  </p>
                </div>
              )}
              {state.error && (
                <div className="text-red-900 text-sm mt-2">{state.error}</div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
