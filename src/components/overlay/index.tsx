import { useSearchParams } from "react-router-dom";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PenLine, Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { normalizeUrlToDomain, saveIntention } from "@/utils/storage";
import { useEffect } from "react";
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
    return { error: 'Please provide an intention', success: false };
  }

  if (!targetUrl) {
    return { error: 'Target URL is missing', success: false };
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

export default function IntentionOverlay() {
  const [searchParams] = useSearchParams();
  const targetUrl = searchParams.get('targetUrl');
  const domain = normalizeUrlToDomain(targetUrl || '');
  
  const [state, formAction] = useActionState(submitIntention, {
    success: false,
    error: null,
  });

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
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10">
              <Flame className={cn(
                "scale-45",
                state.success 
                  ? "animate-in zoom-in fade-in duration-500 fill-mode-forwards ease-out-expo" 
                  : "opacity-0 scale-0"
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
                'relative border-2 border-transparent rounded-xl',
                state.error && "animate-shake"
              )}>
                <div className='absolute top-0 flex w-full justify-center'>
                  <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-amber-700 to-transparent transition-all duration-1000' />
                </div>
                
                <div className="relative animate-slide-in-up delay-150 opacity-0">
                  <PenLine className="absolute left-4 top-4.5 size-4 text-muted-foreground z-10" />
                  <LoadingIcon />
                  <TextareaWithStatus domain={domain} />
                </div>
              </div>
            ) : (
              <div className="animate-slide-in-up text-center mt-6 max-w-prose px-4">
                <p className="text-lg leading-relaxed break-words overflow-hidden font-medium text-amber-500/80">
                  {state.intention}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your intention for {domain}
                </p>
              </div>
            )}
            
            {state.error && <div className="text-red-900 text-sm">{state.error}</div>}
        </form>
      </div>
    </div>
  );
}