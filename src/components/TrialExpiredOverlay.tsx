import React from 'react';
import { Button } from '@/components/ui/button';
import { createPolarCheckout } from '@/utils/subscription';
import { CreditCard, Lock } from 'lucide-react';

interface TrialExpiredOverlayProps {
  onSubscribe?: () => void;
}

export const TrialExpiredOverlay: React.FC<TrialExpiredOverlayProps> = ({ onSubscribe }) => {
  const handleSubscribe = async () => {
    try {
      await createPolarCheckout();
      onSubscribe?.();
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF944D]/30 animate-pulse rounded-full blur-xl"></div>
              <div className="relative bg-gradient-to-br from-[#7A4A1E] to-[#5A3518] p-4 rounded-full border-2 border-[#FF944D]/50 shadow-2xl">
                <Lock className="w-8 h-8 text-[#FF944D]" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#F5E6D3]">
              Your Free Trial Has Expired
            </h2>
            <p className="text-sm text-[#D4C4A8] leading-relaxed">
              Subscribe now to continue blocking distracting websites and stay focused on what matters most.
            </p>
          </div>

          <Button 
            onClick={handleSubscribe}
            className="w-full bg-[#FF944D] hover:bg-[#FF944D]/90 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <CreditCard className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Subscribe Now - $2/month
          </Button>

          <div className="space-y-2 pt-2">
            <p className="text-xs text-[#D4C4A8] text-center font-medium">
              Unlimited website blocking • Accountability partner • Priority support
            </p>
        </div>
      </div>
    </div>
  );
};