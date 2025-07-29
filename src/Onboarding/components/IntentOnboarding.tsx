import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Target, Eye, RefreshCw, TrendingUp, Flame } from 'lucide-react';

const OnboardingStep = ({ 
  step, 
  title, 
  description, 
  icon: Icon, 
  interactive,
  isActive 
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  interactive: React.ReactNode;
  isActive: boolean;
}) => {
  return (
    <div className={`min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 transition-all duration-700 ${
      isActive ? 'animate-slide-in-up' : 'opacity-0'
    }`}>
      {/* Icon with candle-like glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-full"></div>
        <div className="relative bg-gradient-card p-6 rounded-full border border-focus shadow-card">
          <Icon className="w-12 h-12 text-intention animate-flame-flicker" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
      </div>

      {/* Interactive Demo */}
      <div className="w-full max-w-sm">
        {interactive}
      </div>
    </div>
  );
};

const IntentOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [intentionText, setIntentionText] = useState('');
  const [demoActivity, setDemoActivity] = useState('focused');

  const steps = [
    {
      title: "Set Your Intention",
      description: "When you want to use a potentially distracting site, Intent will prompt you to declare your clear intention.",
      icon: Target,
      interactive: (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">You're about to visit YouTube</p>
            <input
              type="text"
              placeholder="I want to watch a programming tutorial..."
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          <Button 
            variant="intention" 
            size="sm" 
            className="w-full"
            disabled={!intentionText.trim()}
          >
            Set Intention
          </Button>
          
          {/* Inline Chrome Browser Window */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            {/* Chrome Browser Header */}
            <div className="bg-muted border-b border-border">
              {/* Tab Bar */}
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  {/* Active Tab */}
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-xs text-foreground truncate">Intent - Set Your Intention</span>
                    <div className="w-3 h-3 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center ml-auto">
                      <div className="w-1 h-1 text-muted-foreground text-xs">×</div>
                    </div>
                  </div>
                  {/* Plus Button */}
                  <div className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">+</span>
                  </div>
                </div>
                {/* Window Controls */}
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              
              {/* Address Bar */}
              <div className="px-3 pb-2">
                <div className="bg-input border border-border rounded-full px-3 py-1 flex items-center space-x-2">
                  <div className="w-3 h-3 text-muted-foreground text-xs">🔒</div>
                  <span className="text-xs text-muted-foreground flex-1">youtube.com</span>
                  <div className="w-3 h-3 text-muted-foreground text-xs">⟳</div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="bg-gray-100 p-4 h-32 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs w-full">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-white font-bold text-sm">▶</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Before you continue to YouTube...</h3>
                  <p className="text-xs text-gray-600">What do you intend to accomplish?</p>
                  <input 
                    type="text"
                    placeholder="Programming tutorial..."
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                    readOnly
                  />
                  <div className="flex space-x-1">
                    <button className="flex-1 bg-orange-500 text-white py-1 px-2 rounded-md text-xs">Set Intention</button>
                    <button className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-md text-xs">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Stay Focused",
      description: "Intent monitors your activity and ensures you stay aligned with your declared intention.",
      icon: Eye,
      interactive: (
        <div className="space-y-4">
          <div className="bg-card border border-focus rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="w-4 h-4 text-intention animate-flame-flicker" />
              <p className="text-sm font-medium text-foreground">Your Intention</p>
            </div>
            <p className="text-sm text-muted-foreground">"Watch programming tutorial"</p>
            <div className="mt-3 flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-gradient-flame h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-intention font-medium">On track!</span>
            </div>
          </div>
          
          {/* Inline Chrome Browser Window */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            {/* Chrome Browser Header */}
            <div className="bg-muted border-b border-border">
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-xs text-foreground truncate">React Tutorial - YouTube</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="px-3 pb-2">
                <div className="bg-input border border-border rounded-full px-3 py-1 flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground flex-1">youtube.com/watch?v=abc123</span>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="bg-black h-32 relative">
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center space-y-2">
                  <div className="w-12 h-12 bg-red-600 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-white text-lg">▶</span>
                  </div>
                  <h3 className="text-sm font-semibold">React Tutorial for Beginners</h3>
                  <p className="text-xs text-gray-300">Currently watching: Programming tutorial ✓</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs flex items-center space-x-1">
                <Flame className="w-3 h-3 animate-flame-flicker" />
                <span>On track</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Gentle Reminders",
      description: "If your activity drifts from your intention, Intent gently steps in and reblocks the site to help you refocus.",
      icon: RefreshCw,
      interactive: (
        <div className="space-y-4">
          <div className="bg-card border border-destructive/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="w-4 h-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">Gentle Redirect</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">You seem to have drifted from your intention</p>
            <div className="flex space-x-2">
              <Button variant="gentle" size="sm" className="flex-1">
                Refocus
              </Button>
              <Button variant="focus" size="sm" className="flex-1">
                Continue
              </Button>
            </div>
          </div>
          
          {/* Inline Chrome Browser Window */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-muted border-b border-border">
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-xs text-foreground truncate">Trending Videos - YouTube</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="px-3 pb-2">
                <div className="bg-input border border-border rounded-full px-3 py-1 flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground flex-1">youtube.com/trending</span>
                </div>
              </div>
            </div>

            <div className="h-32 bg-white relative">
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-200 h-12 rounded flex items-center justify-center text-gray-500 text-xs">Video</div>
                  <div className="bg-gray-200 h-12 rounded flex items-center justify-center text-gray-500 text-xs">Video</div>
                  <div className="bg-gray-200 h-12 rounded flex items-center justify-center text-gray-500 text-xs">Video</div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Trending gaming videos</p>
                  <p>• Celebrity gossip</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-lg p-3 max-w-xs text-center space-y-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">Gentle Reminder</h3>
                  <p className="text-xs text-gray-600">You intended to "watch programming tutorial"</p>
                  <div className="flex space-x-1">
                    <button className="flex-1 bg-green-500 text-white py-1 px-2 rounded text-xs">Refocus</button>
                    <button className="flex-1 bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs">Continue</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Build Better Habits",
      description: "Over time, Intent helps you develop healthier browsing habits and maintain focus on what matters most.",
      icon: TrendingUp,
      interactive: (
        <div className="space-y-4">
          <div className="bg-gradient-card border border-focus rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-intention">87%</p>
                <p className="text-xs text-muted-foreground">Focus Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-intention">12</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-center text-muted-foreground">Your focus is improving! 🔥</p>
            </div>
          </div>
          
          {/* Inline Chrome Browser Window */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-muted border-b border-border">
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-xs text-foreground truncate">Intent Dashboard</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="px-3 pb-2">
                <div className="bg-input border border-border rounded-full px-3 py-1 flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground flex-1">chrome-extension://intent-dashboard</span>
                </div>
              </div>
            </div>

            <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-sm font-bold text-gray-900">Your Focus Journey</h2>
                  <p className="text-xs text-gray-600">Building better habits</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded p-2 text-center shadow-sm">
                    <div className="text-lg font-bold text-green-500">87%</div>
                    <div className="text-xs text-gray-600">Focus</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center shadow-sm">
                    <div className="text-lg font-bold text-orange-500">12</div>
                    <div className="text-xs text-gray-600">Streak</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center shadow-sm">
                    <div className="text-lg font-bold text-blue-500">45</div>
                    <div className="text-xs text-gray-600">Goals</div>
                  </div>
                </div>

                <div className="bg-white rounded p-2 shadow-sm">
                  <h3 className="text-xs font-semibold mb-1">Recent Activity</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>✅ React tutorial</span>
                      <span className="text-gray-500">2h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔄 Redirected</span>
                      <span className="text-gray-500">1d</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gradient-card border-border shadow-card">
        <div className="p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <OnboardingStep 
            {...steps[currentStep]} 
            step={currentStep + 1}
            isActive={true}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-intention shadow-glow'
                      : index < currentStep
                      ? 'bg-focus'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              variant={currentStep === steps.length - 1 ? "intention" : "focus"}
              onClick={nextStep}
              className="flex items-center space-x-2"
            >
              <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IntentOnboarding;