import { useSearchParams } from "react-router-dom";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PenLine, Loader2, Clock } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { normalizeUrlToDomain, saveIntention } from "@/utils/storage";
import { getWebsiteCategory } from "@/utils/domainCategories";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo2.png";
import Flame from "../home/Flame";

interface FormState {
  success: boolean;
  error: string | null;
  intention?: string;
}

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
    let validateIntention: (intention: string) => Promise<[boolean, string]>;
    
    try {
      const intentionModule = await import('../../utils/intentionMatcher');
      validateIntention = intentionModule.validateIntention;
    } catch (importError) {
      console.error('Failed to load intention validation module:', importError);
      validateIntention = async () => [true, ''];
    }
    
    const [isValid, reason] = await validateIntention(intention);
    
    if (!isValid) {
      return { error: reason || 'Please provide a more specific intention.', success: false };
    }
    
    await saveIntention(targetUrl, intention);
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

function LoadingIcon() {
  const { pending } = useFormStatus();
  
  if (!pending) return null;
  
  return (
    <Loader2 className="absolute right-4 top-4.5 size-4 text-muted-foreground z-10 animate-spin" />
  );
}

function TextareaWithStatus({ domain }: { domain: string }) {
  const { pending } = useFormStatus();
  
  return (
    <Textarea 
      name="intention"
      className="p-4 text-lg focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-xl shadow-lg pl-10 pr-10" 
      placeholder={`What is your intention for ${domain}?`}
      required
      minLength={10}
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

  useEffect(() => {
    if (state.success && targetUrl) {
      const timer = setTimeout(() => {
        window.location.href = targetUrl;
      }, 1250);
      return () => clearTimeout(timer);
    }
  }, [state.success, targetUrl]);

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div className={cn("absolute inset-0 z-0 bg-radial-[ellipse_80%_60%_at_50%_0%] from-stone-900 to-transparent to-70% transition-colors duration-1000", state.success && "from-amber-900/20")} />
        <div className={cn("relative space-y-8 w-full max-w-lg mx-auto flex flex-col items-center min-h-screen pt-[450px]", state.success && "animate-slide-out-up delay-1000")}>
          <div className="flex justify-center relative animate-slide-in-up">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10.5">
              <Flame className={cn(
                "scale-35 scale-x-45",
                state.success ? "animate-[var(--animate-flame-ignition)]" : "opacity-0 scale-0"
              )}/>
            </div>
            <img src={logo} alt="Logo" className={cn(
              "size-24 opacity-80 transition-all duration-500",
              state.success && [
                "rounded-full",
                "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-amber-400)_15%,transparent)_60%,transparent_100%)]",
                "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-amber-400)_8%,transparent)]",
                "opacity-100"
              ]
            )} />
          </div>
          <form action={formAction} className="space-y-1 w-full">
            <input type="hidden" name="targetUrl" value={targetUrl || ''} />
            
            {!state.success ? (
              <div className={cn(
                'relative animate-slide-in-up delay-150 opacity-0 border-2 border-transparent rounded-xl',
                state.error && "animate-shake"
              )}>
                {!isTimeBasedCategory && (
                  <div className='absolute top-0 flex w-full justify-center'>
                    <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-amber-700 to-transparent transition-all duration-1000' />
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
                    <LoadingIcon />
                    <TextareaWithStatus domain={domain} />
                  </>
                )}
              </div>
            ) : (
              <div className="animate-slide-in-up text-center mt-6 max-w-prose px-4">
                <p className="text-lg leading-relaxed break-words overflow-hidden font-medium text-amber-500/80">
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