import React, { useState } from 'react';
import { saveIntention, normalizeUrlToDomain } from '../../utils/storage';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

interface IntentionOverlayProps {
  url: string;
  onClose: () => void;
}

const IntentionOverlay: React.FC<IntentionOverlayProps> = ({ url, onClose }) => {
  const [intention, setIntention] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const domain = normalizeUrlToDomain(url);
  const websiteName = domain.charAt(0).toUpperCase() + domain.slice(1);

  const handleSubmit = async () => {
    if (!intention.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    
    try {
      const { validateIntention } = await import('../../utils/intentionMatcher');
      const [isValid, reason] = await validateIntention(intention.trim());
      
      if (!isValid) {
        setError(reason || 'Please provide a more specific intention.');
        setIsLoading(false);
        return;
      }
      
      await saveIntention(url, intention.trim());
      setIsSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error setting intention:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to set intention. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIntention(e.target.value);
    if (error) setError('');
  };
  console.log('SDOFIJSODIFJIOSDJFOISJDFOISJDFIOSDJ');
  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="flex flex-col items-center max-w-md w-[90%] text-center">
        {!isSuccess ? (
          <>
            <img 
              src={chrome.runtime.getURL('src/assets/logo2.png')} 
              alt="Intent" 
              className="w-20 h-20 mb-8 opacity-80"
            />
            
            <h2 className="text-2xl font-medium mb-6 text-white">
              What's your intention for visiting {websiteName}?
            </h2>
            
            <div className="w-full relative">
              <Textarea
                value={intention}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your intention here..."
                className={cn(
                  "min-h-[80px] resize-none pr-10",
                  "bg-white/5 border-white/20 text-white placeholder:text-white/40",
                  "focus:border-white/40 focus-visible:ring-white/20",
                  error && "border-red-500/50 focus:border-red-500/50"
                )}
                disabled={isLoading}
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <Spinner size="sm" className="text-white/60" />
                </div>
              )}
            </div>
            
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            
            <p className="mt-4 text-sm text-white/60">
              Press Enter to continue
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg text-white/80">Intention set!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntentionOverlay;