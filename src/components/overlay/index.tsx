import { useSearchParams } from "react-router-dom";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PenLine, Loader2, Clock } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { normalizeUrlToDomain, saveIntention } from "@/utils/storage";
import { getWebsiteCategory } from "@/utils/domainCategories";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo2.png";
import Flame from "../home/Flame";
import { validateIntention } from '../../utils/intentionMatcher';
import './overlay.css';
import { markNewIntentionSet } from '../../utils/intentionMonitor';

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

async function submitIntention(_: FormState, formData: FormData): Promise<FormState> {
  const intention = formData.get('intention')?.toString()?.trim();
  const targetUrl = formData.get('targetUrl')?.toString();
  
  if (!intention) {
    return { error: 'Please provide an intention or time', success: false };
  }

  if (!targetUrl) {
    return { error: 'Target URL is missing', success: false };
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
    console.log('🔍 Starting intention validation for:', intention);
    
    // Fast client-side validation first
    const clientSideValid = await validateIntentionClientSide(intention);
    if (!clientSideValid) {
      return { error: 'Please write a more targeted intention', success: false };
    }
    
    console.log('🔍 Calling validateIntention with:', intention);
    const isValid = await validateIntention(intention);
    console.log('📊 Validation result:', { isValid });
    
    if (!isValid) {
      console.log('❌ Intention validation failed');
      return { error: 'Please write a more targeted intention', success: false };
    }
    
    console.log('✅ Intention validation passed, saving intention...');
    await saveIntention(targetUrl, intention);
    console.log('💾 Intention saved successfully');
    return { success: true, error: null, intention };
    
  } catch (error) {
    console.error('Error setting intention:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Chrome storage')) {
        return { error: 'Unable to save intention. Please check browser permissions.', success: false };
      }
      if (error.message.includes('Extension context')) {
        return { error: 'Extension needs to be reloaded. Please refresh the page.', success: false };
      }
    }
    
    return { error: 'Failed to set intention. Please try again.', success: false };
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
        pending && "conic-pending-border",                     // animated border when pending
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

function TextareaWithStatus({ domain, intentionText, setIntentionText }: { 
  domain: string;
  intentionText: string;
  setIntentionText: (value: string) => void;
}) {
  const { pending } = useFormStatus();
  
  return (
    <Textarea 
      name="intention"
      value={intentionText}
      onChange={(e) => setIntentionText(e.target.value)}
      className="p-4 text-lg focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-xl shadow-lg pl-10 pr-10" 
      placeholder={`What is your intention for ${domain}?`}
      required
      // minLength={10}
      disabled={pending}
      aria-describedby="intention-help"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const form = e.currentTarget.closest('form');
          form?.requestSubmit();
        }
      }}
    />
  );
}

function TimeSelector({ domain, customMinutes, setCustomMinutes }: { 
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.closest('form')?.requestSubmit();
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
  const targetUrl = searchParams.get('targetUrl');
  const domain = normalizeUrlToDomain(targetUrl || '');
  const category = targetUrl ? getWebsiteCategory(targetUrl) : 'other';
  const isTimeBasedCategory = category === 'entertainment' || category === 'shopping';
  
  const [state, formAction] = useActionState(submitIntention, {
    success: false,
    error: null,
  });
  
  const [customMinutes, setCustomMinutes] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [intentionText, setIntentionText] = useState('');

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

  useEffect(() => {
    if (state.error) {
      setShakeKey(prev => prev + 1);
    }
  }, [state.error]);

  // Custom form action that increments shake key on every submission
  const handleFormAction = useCallback(async (formData: FormData) => {
    setShakeKey(prev => prev + 1);
    return formAction(formData);
  }, [formAction]);

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div className={cn("absolute inset-0 z-0 bg-radial-[ellipse_80%_60%_at_50%_0%] from-stone-900 to-transparent to-70% transition-colors duration-1000", state.success && "from-orange-900/20")} />
      {/* ! ADJUST DELAY FOR HOW LONG INTENTION SHOWS BEFORE SLIDING UP */}
        <div className={cn("relative space-y-8 w-full max-w-lg mx-auto flex flex-col items-center min-h-screen pt-[450px]", state.success && "animate-slide-out-up delay-1500")}>
          <div className="flex justify-center relative animate-slide-in-up">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10.5">
              <Flame className={cn(
                "scale-35 scale-x-45",
                state.success ? "animate-flame-ignition" : "opacity-0 scale-0"
              )}/>
            </div>
            <img src={logo} alt="Logo" className={cn(
              "size-24 opacity-80 transition-all duration-500",
              state.success && [
                "rounded-full",
                "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-orange-400)_15%,transparent)_60%,transparent_100%)]",
                "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-orange-400)_8%,transparent)]",
                "opacity-100"
              ]
            )} />
          </div>
          {/* Unified overlay: no mismatch header */}

          <form action={handleFormAction} className="space-y-1 w-full">
            <input type="hidden" name="targetUrl" value={targetUrl || ''} />
            
            {!state.success ? (
              <InputContainer shakeKey={shakeKey} state={state}>
                {!isTimeBasedCategory && (
                  <div className='absolute top-0 flex w-full justify-center'>
                    <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-orange-700 to-transparent transition-all duration-1000' />
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
                    <PenLine className="absolute left-4 top-4.5 size-4 text-muted-foreground z-10" />
                    <TextareaWithStatus 
                      domain={domain} 
                      intentionText={intentionText}
                      setIntentionText={setIntentionText}
                    />
                  </>
                )}
              </InputContainer>
            ) : (
              <div className="animate-slide-in-up text-center mt-6 max-w-prose px-4 mx-auto">
                <p className="text-lg leading-relaxed break-words overflow-hidden font-medium text-orange-500/80">
                  {state.intention?.startsWith('block:') 
                    ? `Blocked for ${state.intention.replace('block:', '')} minutes`
                    : state.intention
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {state.intention?.startsWith('block:') 
                    ? `Intent blocked on ${domain}`
                    : `Your intention for ${domain}`
                  }
                </p>
              </div>
            )}
            
            {state.error && <div className="text-red-900 text-sm">{state.error}</div>}
        </form>
      </div>
    </div>
  );
}