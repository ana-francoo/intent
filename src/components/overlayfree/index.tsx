import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo2.png";
import Flame from "../home/Flame";
import './overlay.css';

export default function IntentionOverlay() {
  const [searchParams] = useSearchParams();
  const targetUrl = searchParams.get('targetUrl');

  const handleAllowClick = useCallback(() => {
    if (!targetUrl) return;
    window.location.href = targetUrl;
  }, [targetUrl]);

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div className={cn("absolute inset-0 z-0 bg-radial-[ellipse_80%_60%_at_50%_0%] from-stone-900 to-transparent to-70% transition-colors duration-1000")} />
        <div className={cn("relative space-y-8 w-full max-w-lg mx-auto flex flex-col items-center min-h-screen pt-[450px]")}>        
          <div className="flex justify-center relative animate-slide-in-up">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10.5">
              <Flame className={cn(
                "scale-35 scale-x-45",
                "animate-flame-ignition"
              )}/>
            </div>
            <img src={logo} alt="Logo" className={cn(
              "size-24 opacity-80 transition-all duration-500",
              
            )} />
          </div>
          <div className="animate-slide-in-up text-center mt-6 max-w-prose px-4 mx-auto">
            <button
              type="button"
              onClick={handleAllowClick}
              className="text-muted-foreground/80 hover:text-foreground underline underline-offset-4"
            >
              I wish to access this site
            </button>
          </div>
      </div>
    </div>
  );
}