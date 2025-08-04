import { useState } from 'react';
import IntentOnboarding from '@/components/carousel/IntentOnboarding';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';

const Welcome = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <div className="h-full overflow-hidden">
        <IntentOnboarding onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-full"></div>
          <div className="relative bg-gradient-card p-8 rounded-full border border-focus shadow-card">
            <Flame className="w-16 h-16 text-intention animate-flame-flicker" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Ready to reclaim your focus?</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Follow-through with your intention,<br />distraction-free.
          </p>
          <Button size="lg" onClick={() => setShowOnboarding(true)} variant="gradient">
            Review Onboarding
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome; 