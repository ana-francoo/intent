import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Target, Eye, RefreshCw, TrendingUp, PenLine, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo2.png';
import Flame from '@/components/home/Flame';
import './App.css';

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
    <div className={`min-h-[350px] flex flex-col items-center justify-center text-center space-y-4 transition-all duration-700 ${
      isActive ? 'animate-slide-in-up' : 'opacity-0'
    }`}>
             {/* Icon with candle-like glow */}
       <div className="relative animate-scale-in">
         <div className="absolute inset-0 bg-gradient-glow animate-glow-pulse rounded-full"></div>
         <div className="relative bg-gradient-card p-6 rounded-full border border-focus shadow-card">
           <Icon className="w-12 h-12 text-intention animate-flame-flicker animate-icon-breathing" />
         </div>
       </div>

       {/* Content */}
       <div className="space-y-4 max-w-md animate-slide-in-up">
         <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                   <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
       </div>

       {/* Interactive Demo */}
       <div className="w-full max-w-sm animate-fade-in">
         {interactive}
       </div>
    </div>
  );
};

const IntentOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [showSuccessUI, setShowSuccessUI] = useState(false);
  const fullText = "I want to learn how to use Intent to gain my time back and achieve my goals";
  const navigate = useNavigate();

  const steps = [
    {
      title: "Set Your Intention",
      description: "When you want to use a potentially distracting site, Intent will prompt you to declare your clear intention.",
      icon: Target,
      interactive: (
        <div className="space-y-4">

          {/* <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">You're about to visit YouTube</p>
            <input
              type="text"
              placeholder="I want to watch a programming tutorial..."
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div> */}

          
          {/* Inline Chrome Browser Window */}
                     <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg animate-scale-in">
            {/* Chrome Browser Header */}
            <div className="bg-muted border-b border-border">
              {/* Tab Bar */}
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  {/* Active Tab */}
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-[6px] font-bold">▶</span>
                    </div>
                    <span className="text-xs text-foreground truncate">YouTube</span>
                    <div className="w-3 h-3 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center ml-auto">
                      <div className="w-1 h-1 text-muted-foreground text-xs">×</div>
                    </div>
                  </div>
                  {/* Plus Button */}
                                     <div className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center animate-icon-breathing">
                    <span className="text-muted-foreground text-xs">+</span>
                  </div>
                </div>
                {/* Window Controls */}
                <div className="flex items-center space-x-1 animate-window-controls-pulse">
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

                         {/* Page Content - Animated YouTube Homepage with Overlay */}
             <div className="bg-white h-48 relative overflow-hidden">
               {/* YouTube Homepage Content */}
               <div className="absolute inset-0 bg-white animate-youtube-fade-in">
                 {/* YouTube Header */}
                 <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center space-x-2">
                   <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                     <span className="text-white text-xs font-bold">▶</span>
                   </div>
                   <span className="text-sm font-semibold text-gray-900">YouTube</span>
                 </div>
                 
                 {/* YouTube Content Grid */}
                 <div className="p-3 space-y-2">
                   <div className="grid grid-cols-3 gap-2">
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-1"></div>
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-2"></div>
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-3"></div>
                   </div>
                   <div className="space-y-1">
                     <div className="h-3 bg-gray-200 rounded animate-youtube-text-1"></div>
                     <div className="h-3 bg-gray-200 rounded w-2/3 animate-youtube-text-2"></div>
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-4"></div>
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-5"></div>
                     <div className="bg-gray-200 h-8 rounded animate-youtube-item-6"></div>
                   </div>
                 </div>
               </div>
               
                               {/* Intent Overlay - Appears after YouTube loads */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-overlay-slide-in">
                  <div className="w-full max-w-sm p-4">
                    {!showSuccessUI ? (
                      <>
                        {/* Logo */}
                        <div className="flex justify-center mb-4">
                          <img src={logo} alt="Intent Logo" className="w-12 h-12 opacity-80 animate-logo-float animate-logo-glow" />
                        </div>
                       
                       {/* Intention Prompt Form */}
                       <div className="relative animate-slide-in-up">
                         <div className="relative border-2 border-transparent rounded-xl">
                           <PenLine className="absolute left-3 top-3 size-3 text-muted-foreground z-10 animate-icon-breathing" />
                           <Textarea 
                             className="p-3 text-sm focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-xl shadow-lg pl-8 pr-8 min-h-[80px] animate-textarea-focus" 
                             placeholder="What is your intention for youtube.com?"
                             readOnly
                             value={currentStep === 0 ? typingText : ""}
                           />
                           
                         </div>
                       </div>
                      </>
                                         ) : (
                       /* Success UI - exactly matches the actual Chrome extension */
                       <>
                                                   {/* Logo with Flame Animation - exactly like real overlay */}
                          <div className="flex justify-center relative animate-slide-in-up">
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
                              <Flame className={cn(
                                "scale-25 scale-x-35",
                                "animate-flame-ignition"
                              )}/>
                            </div>
                            <img src={logo} alt="Logo" className={cn(
                              "size-16 opacity-80 transition-all duration-500",
                              "rounded-full",
                              "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-orange-400)_15%,transparent)_60%,transparent_100%)]",
                              "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-orange-400)_8%,transparent)]",
                              "opacity-100"
                            )} />
                          </div>
                          
                          {/* Intention Text - exactly like real overlay */}
                          <div className="animate-slide-in-up text-center mt-4 max-w-prose px-4">
                            <p className="text-sm leading-relaxed break-words overflow-hidden font-medium text-white">
                              {fullText}
                            </p>
                          </div>
                          
                          
                       </>
                     )}
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


          {/* <div className="bg-card border border-focus rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
                               <div className="w-4 h-4 text-intention animate-flame-flicker">🔥</div>
              <p className="text-sm font-medium text-foreground">Your Intention</p>
            </div>
            <p className="text-sm text-muted-foreground">"Watch programming tutorial"</p>
            <div className="mt-3 flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-gradient-flame h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-intention font-medium">On track!</span>
            </div>
          </div> */}
          
                     {/* Inline Chrome Browser Window - Identical to first slide */}
           <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg animate-scale-in">
             {/* Chrome Browser Header */}
             <div className="bg-muted border-b border-border">
               {/* Tab Bar */}
               <div className="flex items-center px-3 py-2">
                 <div className="flex items-center space-x-2 flex-1">
                   {/* Active Tab */}
                   <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                     <div className="w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                       <span className="text-white text-[6px] font-bold">▶</span>
                     </div>
                     <span className="text-xs text-foreground truncate relative">
                       <span className="absolute inset-0 animate-tab-text-fade-out">YouTube</span>
                       <span className="opacity-0 animate-tab-text-fade-in">Intent Demo - YouTube</span>
                     </span>
                     <div className="w-3 h-3 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center ml-auto">
                       <div className="w-1 h-1 text-muted-foreground text-xs">×</div>
                     </div>
                   </div>
                   {/* Plus Button */}
                   <div className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center animate-icon-breathing">
                     <span className="text-muted-foreground text-xs">+</span>
                   </div>
                 </div>
                 {/* Window Controls */}
                 <div className="flex items-center space-x-1 animate-window-controls-pulse">
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

                           {/* Page Content - Starts with success overlay, then fades to video with mouse interaction */}
              <div className="bg-white h-48 relative overflow-hidden">
                {/* YouTube Homepage Content */}
                <div className="absolute inset-0 bg-white">
                  {/* YouTube Header */}
                  <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">▶</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">YouTube</span>
                  </div>
                  
                  {/* YouTube Content Grid */}
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                                             <div className="bg-gray-200 h-8 rounded animate-youtube-item-1 relative animate-video-hover">
                         {/* Grey semi-transparent circle that moves and hovers */}
                         <div className="absolute w-4 h-4 bg-gray-400/60 rounded-full animate-mouse-move opacity-0"></div>
                       </div>
                      <div className="bg-gray-200 h-8 rounded animate-youtube-item-2"></div>
                      <div className="bg-gray-200 h-8 rounded animate-youtube-item-3"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded animate-youtube-text-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-youtube-text-2"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-200 h-8 rounded animate-youtube-item-4"></div>
                      <div className="bg-gray-200 h-8 rounded animate-youtube-item-5"></div>
                      <div className="bg-gray-200 h-8 rounded animate-youtube-item-6"></div>
                    </div>
                  </div>
                </div>
                
                {/* Intent Overlay - Starts visible, then fades out */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-overlay-fade-out">
                  <div className="w-full max-w-sm p-4">
                                         {/* Logo with Flame Animation - exactly like first slide success */}
                     <div className="flex justify-center relative">
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
                        <Flame className={cn(
                          "scale-25 scale-x-35",
                          "animate-flame-ignition"
                        )}/>
                      </div>
                      <img src={logo} alt="Logo" className={cn(
                        "size-16 opacity-80 transition-all duration-500",
                        "rounded-full",
                        "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-orange-400)_15%,transparent)_60%,transparent_100%)]",
                        "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-orange-400)_8%,transparent)]",
                        "opacity-100"
                      )} />
                    </div>
                    
                                         {/* Intention Text - exactly like first slide success */}
                     <div className="text-center mt-4 max-w-prose px-4">
                      <p className="text-sm leading-relaxed break-words overflow-hidden font-medium text-white">
                        I want to learn how to use Intent to gain my time back and achieve my goals
                      </p>
                    </div>
                  </div>
                </div>

                                 {/* Intent Extension Demo - Appears after mouse click */}
                 <div className="absolute inset-0 bg-white animate-extension-demo-slide-in opacity-0">
                   {/* Extension Demo Header */}
                   <div className="bg-white border-b border-gray-200 px-3 py-2">
                     <span className="text-sm font-semibold text-gray-900">Intent Extension Demo</span>
                   </div>
                   
                   {/* YouTube Video Page Layout */}
                   <div className="flex h-full">
                     {/* Main Video Section - Left Side */}
                     <div className="flex-1 p-3">
                       {/* Main Video Player */}
                       <div className="bg-gray-200 rounded-lg h-20 mb-2 flex items-center justify-center">
                         <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                           <span className="text-white text-xs font-bold">▶</span>
                         </div>
                       </div>
                       
                       {/* Video Title */}
                       <div className="space-y-1 mb-2">
                         <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                       </div>
                       
                       {/* Video Actions */}
                       <div className="flex items-center space-x-2 mb-2">
                         <div className="h-6 bg-gray-200 rounded w-12"></div>
                         <div className="h-6 bg-gray-200 rounded w-12"></div>
                         <div className="h-6 bg-gray-200 rounded w-12"></div>
                       </div>
                       
                       {/* Intent Banner */}
                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                         <div className="flex items-center space-x-2">
                           <div className="w-3 h-3 text-orange-500">🔥</div>
                           <p className="text-xs font-medium text-gray-900">Your Intention</p>
                         </div>
                         <p className="text-xs text-gray-700 mt-1">"I want to learn how to use Intent to gain my time back and achieve my goals"</p>
                       </div>
                       
                                                {/* AI Thinking Animation - Appears first */}
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 animate-ai-thinking-slide-in">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-2">
                               <div className="relative">
                                 <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                   <div className="w-2 h-2 bg-white rounded-full animate-ai-pulse"></div>
                                 </div>
                                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                               </div>
                               <p className="text-xs font-medium text-blue-800 animate-ai-text">Analyzing activity...</p>
                             </div>
                             <div className="flex items-center space-x-1">
                               <div className="flex space-x-0.5">
                                 {[...Array(3)].map((_, i) => (
                                   <div key={i} className="w-1 h-1 bg-blue-300 rounded-full animate-ai-dot-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
                                 ))}
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {/* AI Decision - "On Track" */}
                         <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2 animate-ai-decision-slide-in">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-2">
                               <div className="relative">
                                 <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                   <div className="w-2 h-2 bg-white rounded-full"></div>
                                 </div>
                                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                               </div>
                               <p className="text-xs font-medium text-green-800">✓ On Track</p>
                             </div>
                             <div className="flex items-center space-x-1">
                               <div className="w-8 h-2 bg-green-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-green-500 rounded-full animate-focus-progress-fill"></div>
                               </div>
                               <span className="text-xs font-bold text-green-600 animate-focus-percentage">0%</span>
                             </div>
                           </div>
                         </div>
                         
                         {/* Focus Alignment Indicator - Appears after AI decision */}
                         <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2 animate-focus-alignment-slide-in">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                             <div className="relative">
                               <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                               </div>
                               <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                             </div>
                             <p className="text-xs font-medium text-green-800">Staying Focused</p>
                           </div>
                           <div className="flex items-center space-x-1">
                             <div className="w-8 h-2 bg-green-200 rounded-full overflow-hidden">
                               <div className="h-full bg-green-500 rounded-full animate-focus-progress-fill"></div>
                             </div>
                             <span className="text-xs font-bold text-green-600 animate-focus-percentage">0%</span>
                           </div>
                         </div>
                         <div className="mt-1 flex items-center space-x-1">
                           <div className="flex space-x-0.5">
                             {[...Array(5)].map((_, i) => (
                               <div key={i} className="w-1 h-1 bg-green-300 rounded-full animate-focus-dot-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                             ))}
                           </div>
                           <p className="text-xs text-green-600">Activity aligned with intention</p>
                         </div>
                       </div>
                     </div>
                     
                     {/* Recommended Videos Panel - Right Side */}
                     <div className="w-1/3 border-l border-gray-200 p-2">
                       <div className="space-y-2">
                                                   {/* Recommended Video 1 */}
                          <div className="flex space-x-2">
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                          
                          {/* Recommended Video 2 */}
                          <div className="flex space-x-2">
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                          
                          {/* Recommended Video 3 */}
                          <div className="flex space-x-2">
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )
    },
    
         {
       title: "Gentle Reminders",
       description: "If your activity drifts from your intention, Intent gently steps in and reblocks the site to help you refocus.",
       icon: Eye,
      interactive: (
        <div className="space-y-4">
          {/* Inline Chrome Browser Window - Starts exactly where second slide ends */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg animate-scale-in">
            {/* Chrome Browser Header */}
            <div className="bg-muted border-b border-border">
              {/* Tab Bar */}
              <div className="flex items-center px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  {/* Active Tab */}
                  <div className="bg-card border border-b-0 border-border rounded-t-lg px-3 py-1 min-w-[120px] flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-[6px] font-bold">▶</span>
                    </div>
                    <span className="text-xs text-foreground truncate">Intent Demo - YouTube</span>
                    <div className="w-3 h-3 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center ml-auto">
                      <div className="w-1 h-1 text-muted-foreground text-xs">×</div>
                    </div>
                  </div>
                  {/* Plus Button */}
                  <div className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center animate-icon-breathing">
                    <span className="text-muted-foreground text-xs">+</span>
                  </div>
                </div>
                {/* Window Controls */}
                <div className="flex items-center space-x-1 animate-window-controls-pulse">
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

                         {/* Page Content - Starts with Intent Extension Demo, then mouse interaction */}
             <div className="bg-white h-48 relative overflow-hidden">
               {/* Intent Extension Demo - Already visible, then mouse interaction */}
               <div className="absolute inset-0 bg-white">
                {/* Extension Demo Header */}
                <div className="bg-white border-b border-gray-200 px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900">Intent Extension Demo</span>
                </div>
                
                {/* YouTube Video Page Layout */}
                <div className="flex h-full">
                  {/* Main Video Section - Left Side */}
                  <div className="flex-1 p-3">
                    {/* Main Video Player */}
                    <div className="bg-gray-200 rounded-lg h-20 mb-2 flex items-center justify-center">
                      <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">▶</span>
                      </div>
                    </div>
                    
                    {/* Video Title */}
                    <div className="space-y-1 mb-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    {/* Video Actions */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                    
                    {/* Intent Banner */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 text-orange-500">🔥</div>
                        <p className="text-xs font-medium text-gray-900">Your Intention</p>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">"I want to learn how to use Intent to gain my time back and achieve my goals"</p>
                    </div>

                    {/* AI Thinking Animation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 animate-ai-thinking-slide-in-third">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-ai-pulse"></div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-xs font-medium text-blue-800 animate-ai-text">Analyzing activity...</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-0.5">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-1 h-1 bg-blue-300 rounded-full animate-ai-dot-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Decision Animation */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2 animate-ai-decision-slide-in-third">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-xs font-medium text-green-800">✓ On Track</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-8 h-2 bg-green-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full animate-focus-progress-fill"></div>
                          </div>
                          <span className="text-xs font-bold text-green-600 animate-focus-percentage">0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                                    {/* Recommended Videos Panel - Right Side */}
                  <div className="w-1/3 border-l border-gray-200 p-2 relative">
                    {/* Scrollbar */}
                    <div className="absolute right-1 top-2 bottom-2 w-1 bg-gray-300 rounded-full">
                      <div className="w-1 h-8 bg-gray-500 rounded-full animate-scrollbar-thumb-move"></div>
                    </div>
                    
                    {/* Mouse cursor for scrollbar click */}
                    <div className="absolute w-4 h-4 bg-gray-400/60 rounded-full animate-mouse-click-scrollbar opacity-0"></div>
                    
                    <div className="space-y-2 animate-content-scroll">
                      {/* Recommended Video 1 */}
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Recommended Video 2 */}
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Recommended Video 3 */}
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Recommended Video 4 */}
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Recommended Video 5 */}
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Recommended Video 6 - Target for mouse interaction (bottom video after scrolling) */}
                      <div className="flex space-x-2 relative">
                        {/* Grey semi-transparent circle that moves and hovers */}
                        <div className="absolute w-4 h-4 bg-gray-400/60 rounded-full animate-mouse-move-to-side-panel opacity-0"></div>
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center animate-recommended-video-thumbnail-hover">
                          <div className="w-2 h-2 text-gray-400 rounded-sm flex items-center justify-center">▶</div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded w-full animate-recommended-video-text-hover"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3 animate-recommended-video-text-hover"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                                                           {/* Third Slide Overlay - Appears after clicking recommended video */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-third-slide-overlay-fade-in opacity-0">
                  {/* Back Arrow - Top left corner, no background */}
                  <div className="absolute top-4 left-4 animate-third-slide-back-arrow-slide-in opacity-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  
                  {/* Logo with Flame Animation - positioned above the form */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-20 animate-slide-in-up">
                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
                        <Flame className={cn(
                          "scale-25 scale-x-35",
                          "animate-flame-ignition"
                        )}/>
                      </div>
                      <img src={logo} alt="Logo" className={cn(
                        "size-16 opacity-80 transition-all duration-500",
                        "rounded-full",
                        "bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-orange-400)_15%,transparent)_60%,transparent_100%)]",
                        "shadow-[0_0_40px_10px_var(--color-orange-400),0_0_0_4px_color-mix(in_srgb,var(--color-orange-400)_8%,transparent)]",
                        "opacity-100"
                      )} />
                    </div>
                  </div>
                  
                                     {/* Intention Prompt Form - Very bottom of the screen */}
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-slide-in-up">
                     <div className="relative border-2 border-transparent rounded-lg">
                       <PenLine className="absolute left-1 top-0.5 size-1 text-muted-foreground z-10 animate-icon-breathing" />
                       <Textarea 
                         className="py-0.5 px-1 text-[10px] focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-lg shadow-lg pl-3 pr-3 min-h-[20px] animate-textarea-focus" 
                         placeholder="I have a new intention"
                         readOnly
                         value=""
                       />
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

          {/* <div className="bg-gradient-card border border-focus rounded-lg p-4">
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
          </div> */}
          
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
      // Navigate to tour page when onboarding is complete
      navigate('/tour');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

     // Set progress for all slides
   React.useEffect(() => {
     // Use normal progress calculation for all slides
     setAnimatedProgress(((currentStep + 1) / steps.length) * 100);
   }, [currentStep]);

  // Typing animation for first slide
  React.useEffect(() => {
    if (currentStep === 0) {
      // Reset typing state
      setTypingText("");
      setShowSuccessUI(false);
      
      // Start typing animation after overlay appears (3.3s total)
      const typingTimer = setTimeout(() => {
        let currentIndex = 0;
        const typeInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypingText(fullText.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typeInterval);
            // Show success UI after typing completes
            setTimeout(() => {
              setShowSuccessUI(true);
            }, 1000);
          }
        }, 50); // Type each character every 50ms
        
        return () => clearInterval(typeInterval);
      }, 3300); // Start typing 3.3s after slide loads
      
      return () => clearTimeout(typingTimer);
    }
  }, [currentStep, fullText]);

  const progress = animatedProgress;

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-gradient-card border-border shadow-card my-auto">
        <div className="p-8">
                     {/* Progress Header */}
           <div className="mb-8">
             <Progress 
               value={progress} 
               className={`h-2 ${currentStep === 0 ? '' : 'animate-progress-fill'}`} 
             />
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
               className="flex items-center space-x-2 animate-slide-in-left"
             >
               <ChevronLeft className="w-4 h-4 animate-icon-breathing" />
               <span>Back</span>
             </Button>

                         <div className="flex space-x-1">
               {steps.map((_, index) => (
                 <div
                   key={index}
                   className={`w-2 h-2 rounded-full transition-all duration-300 ${
                     index === currentStep
                       ? 'bg-orange-600 shadow-md shadow-orange-600/50 animate-scale-in'
                       : index < currentStep
                       ? 'bg-orange-950'
                       : 'bg-muted'
                   }`}
                 />
               ))}
             </div>

                         {currentStep === steps.length - 1 ? (
               <button
                 className="get-started-btn"
                 type="button"
                 onClick={nextStep}
               >
                 <span className="btn-text">Get Started</span>
                <span className="btn-arrow">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                  >
                    <path
                      d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </span>
              </button>
            ) : (
              <button
                className="get-started-btn"
                type="button"
                onClick={nextStep}
              >
                <span className="btn-text">Next</span>
                <span className="btn-arrow">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

  export default IntentOnboarding;