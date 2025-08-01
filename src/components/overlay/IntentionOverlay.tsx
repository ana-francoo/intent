import React, { useState, useEffect, useRef } from 'react';
import { saveIntention, normalizeUrlToDomain } from '../../utils/storage';
// import Flame from '../home/Flame'; // Currently disabled in template
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface IntentionOverlayProps {
  url: string;
  onClose: () => void;
}

const IntentionOverlay: React.FC<IntentionOverlayProps> = ({ url, onClose }) => {
  const [intention, setIntention] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlame, setShowFlame] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const domain = normalizeUrlToDomain(url);
  const websiteName = domain.charAt(0).toUpperCase() + domain.slice(1);

  useEffect(() => {
    // Focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!intention.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // First, validate the intention using AI
      const { validateIntention } = await import('../../utils/intentionMatcher');
      const [isValid, reason] = await validateIntention(intention.trim());
      
      if (!isValid) {
        // Show error and allow user to try again
        setIsSubmitting(false);
        setShowFlame(false);
        alert(reason || 'Please provide a more specific intention.');
        return;
      }
      
      // Show flame animation
      setShowFlame(true);
      
      // Save intention using old storage system
      await saveIntention(url, intention.trim());
      
      // Wait for flame animation, then redirect to the intended site
      setTimeout(() => {
        // Redirect to the domain the user intended to visit
        window.location.href = url;
      }, 2000);
      
    } catch (error) {
      console.error('Error setting intention:', error);
      setIsSubmitting(false);
      setShowFlame(false);
      alert('Error setting intention. Please try again.');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match CSS transition duration
  };

  // Suppress unused variable warning - this function is kept for potential future use
  void handleClose;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIntention(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
      <div className="flex flex-col items-center max-w-[500px] w-[90%] text-center">
        {!showFlame ? (
          // Input phase - show candle
          <>
            <div className="mb-10">
              <div className="relative w-[120px] h-[120px] mx-auto mb-5">
                <img 
                  src={chrome.runtime.getURL('src/assets/logo2.png')} 
                  alt="Intent Logo" 
                  className="w-full h-full object-contain opacity-80"
                />
              </div>
            </div>
            
            <div className="w-full">
              <h2 className="text-2xl font-medium mb-5 leading-relaxed">
                What's your intention for visiting {websiteName}?
              </h2>
              
              <Textarea
                ref={textareaRef}
                value={intention}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your intention here..."
                className={cn(
                  "min-h-[60px] max-h-[120px] resize-none"
                )}
                disabled={isSubmitting}
              />
            </div>
          </>
        ) : (
          // Flame phase - show flame with intention
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* <div className="relative w-[150px] h-[200px] mb-[30px]">
              <img 
                src={chrome.runtime.getURL('src/assets/logo2.png')} 
                alt="Intent Logo" 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120px] h-[120px] object-contain opacity-60 z-[1]"
              />
              <Flame />
            </div> */}
            
            <div className="text-lg font-normal leading-relaxed max-w-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-1000">
              {intention}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntentionOverlay;