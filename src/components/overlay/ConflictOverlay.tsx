import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ConflictOverlayProps {
  currentDomain: string;
  activeIntention: { domain: string; intention: string };
  onClose: () => void;
  onSetNewIntention: () => void;
}

const ConflictOverlay: React.FC<ConflictOverlayProps> = ({ 
  currentDomain, 
  activeIntention, 
  onClose,
  onSetNewIntention 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const currentSiteName = currentDomain.charAt(0).toUpperCase() + currentDomain.slice(1);
  const activeSiteName = activeIntention.domain.charAt(0).toUpperCase() + activeIntention.domain.slice(1);



  const handleContinueWithActive = () => {
    window.location.href = `https://${activeIntention.domain}`;
  };

  const handleSetNewIntention = () => {
    setIsClosing(true);
    setTimeout(() => {
      onSetNewIntention();
    }, 300);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[2147483647] flex items-center justify-center",
        "bg-gradient-to-b from-[rgba(43,37,37,0.99)] via-[rgba(43,37,37,0.99)] to-[rgba(0,0,0,0.99)]",
        "backdrop-blur-lg",
        "font-['Geist'] text-white",
        "transition-opacity duration-300 ease-out",
        isClosing && "opacity-0"
      )}
    >
      <div className="max-w-[500px] w-[90%] p-10 text-center">
        <h2 className="text-[28px] font-semibold mb-5">You have an active intention</h2>
        
        <Card className="bg-white/10 border-white/20 p-5 mb-[30px]">
          <div className="text-sm opacity-80 mb-2">
            Your intention for {activeSiteName}:
          </div>
          <div className="text-lg font-medium leading-relaxed">
            {activeIntention.intention}
          </div>
        </Card>

        <p className="text-lg mb-[30px] leading-relaxed">
          You're trying to visit {currentSiteName}. What would you like to do?
        </p>

        <div className="flex gap-[15px] justify-center flex-wrap">
          <Button
            variant="outline"
            className={cn(
              "min-w-[140px] bg-white/10 text-white border-white/30",
              "hover:bg-white/20 hover:border-white/50 hover:-translate-y-[1px]",
              "transition-all duration-200"
            )}
            onClick={handleContinueWithActive}
          >
            Continue with {activeSiteName}
          </Button>
          
          <Button
            className={cn(
              "min-w-[140px] bg-[#ff6000] hover:bg-[#e55a15]",
              "hover:-translate-y-[1px] transition-all duration-200"
            )}
            onClick={handleSetNewIntention}
          >
            Set intention for {currentSiteName}
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "min-w-[140px] bg-transparent text-white/70 border border-white/20",
              "hover:bg-white/10 hover:text-white",
              "hover:-translate-y-[1px] transition-all duration-200"
            )}
            onClick={handleGoBack}
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConflictOverlay;