import { useState, useEffect } from 'react';
import './Onboarding.css';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  interactive?: React.ReactNode;
}

interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingStep = ({ 
  step, 
  isActive 
}: { 
  step: OnboardingStep; 
  isActive: boolean; 
}) => {
  return (
    <div className={`onboarding-step ${isActive ? 'active' : ''}`}>
      <div className="step-content">
        <div className="step-icon">{step.icon}</div>
        <h3 className="step-title">{step.title}</h3>
        <p className="step-description">{step.description}</p>
        {step.interactive && (
          <div className="step-interactive">
            {step.interactive}
          </div>
        )}
      </div>
    </div>
  );
};

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasViewedLastStep, setHasViewedLastStep] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Set Your Intention",
      description: "When you want to use a potentially distracting site, Intent will prompt you to declare your clear intention.",
      icon: "✍️",
      interactive: (
        <div className="interactive-demo">
          <div className="demo-card">
            <p className="demo-text">You're about to visit YouTube</p>
            <input
              type="text"
              placeholder="I want to watch a programming tutorial..."
              className="demo-input"
              readOnly
            />
            <button className="demo-button">Set Intention</button>
          </div>
          
          {/* Chrome Browser Window Mockup */}
          <div className="browser-window">
            <div className="browser-header">
              <div className="browser-tabs">
                <div className="browser-tab active">
                  <div className="tab-icon"></div>
                  <span>Intent - Set Your Intention</span>
                  <div className="tab-close">×</div>
                </div>
                <div className="tab-plus">+</div>
              </div>
              <div className="browser-controls">
                <div className="control red"></div>
                <div className="control yellow"></div>
                <div className="control green"></div>
              </div>
            </div>
            <div className="browser-address">
              <span>🔒</span>
              <span>youtube.com</span>
              <span>⟳</span>
                  </div>
            <div className="browser-content">
              <div className="overlay-demo">
                <div className="overlay-icon">▶</div>
                <h3>Before you continue to YouTube...</h3>
                <p>What do you intend to accomplish?</p>
                  <input 
                    type="text"
                    placeholder="Programming tutorial..."
                  className="overlay-input"
                    readOnly
                  />
                <div className="overlay-buttons">
                  <button className="overlay-btn primary">Set Intention</button>
                  <button className="overlay-btn secondary">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Stay Focused",
      description: "Intent monitors your activity and ensures you stay aligned with your declared intention.",
      icon: "🎯",
      interactive: (
        <div className="interactive-demo">
          <div className="demo-card success">
            <div className="status-indicator">
              <div className="flame-icon">🔥</div>
              <span>On track!</span>
            </div>
          </div>
          
          {/* Chrome Browser Window Mockup */}
          <div className="browser-window">
            <div className="browser-header">
              <div className="browser-tabs">
                <div className="browser-tab active">
                  <div className="tab-icon red"></div>
                  <span>React Tutorial - YouTube</span>
                </div>
              </div>
              <div className="browser-controls">
                <div className="control red"></div>
                <div className="control yellow"></div>
                <div className="control green"></div>
              </div>
            </div>
            <div className="browser-address">
              <span>youtube.com/watch?v=abc123</span>
                  </div>
            <div className="browser-content video">
              <div className="video-player">
                <div className="play-button">▶</div>
                <h3>React Tutorial for Beginners</h3>
                <p>Currently watching: Programming tutorial ✓</p>
              </div>
              <div className="monitoring-overlay">
                <div className="flame-icon">🔥</div>
                <span>On track</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Gentle Reminders",
      description: "If your activity drifts from your intention, Intent gently steps in and reblocks the site to help you refocus.",
      icon: "🔒",
      interactive: (
        <div className="interactive-demo">
          <div className="demo-card warning">
            <div className="status-indicator">
              <div className="refresh-icon">🔄</div>
              <span>Intention mismatch detected</span>
            </div>
          </div>
          
          {/* Chrome Browser Window Mockup */}
          <div className="browser-window">
            <div className="browser-header">
              <div className="browser-tabs">
                <div className="browser-tab active">
                  <div className="tab-icon red"></div>
                  <span>Trending Videos - YouTube</span>
                </div>
              </div>
              <div className="browser-controls">
                <div className="control red"></div>
                <div className="control yellow"></div>
                <div className="control green"></div>
              </div>
            </div>
            <div className="browser-address">
              <span>youtube.com/trending</span>
            </div>
            <div className="browser-content">
              <div className="trending-content">
                <div className="video-grid">
                  <div className="video-thumb">Video</div>
                  <div className="video-thumb">Video</div>
                  <div className="video-thumb">Video</div>
                </div>
                <div className="trending-list">
                  <p>• Trending gaming videos</p>
                  <p>• Celebrity gossip</p>
                  <p>• Funny cat videos</p>
                </div>
              </div>
              <div className="warning-overlay">
                <div className="warning-card">
                  <div className="warning-icon">🔄</div>
                  <h3>Gentle Reminder</h3>
                  <p>You intended to "watch programming tutorial"</p>
                  <div className="warning-buttons">
                    <button className="warning-btn primary">Refocus</button>
                    <button className="warning-btn secondary">Continue</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Build Better Habits",
      description: "Over time, Intent helps you develop healthier browsing habits and maintain focus on what matters most.",
      icon: "🌱",
      interactive: (
        <div className="interactive-demo">
          <div className="demo-card stats">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">87%</div>
                <div className="stat-label">Focus Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">12</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
            <p className="stats-note">Your focus is improving! 🔥</p>
          </div>
          
          {/* Chrome Browser Window Mockup */}
          <div className="browser-window">
            <div className="browser-header">
              <div className="browser-tabs">
                <div className="browser-tab active">
                  <div className="tab-icon orange"></div>
                  <span>Intent Dashboard</span>
                </div>
              </div>
              <div className="browser-controls">
                <div className="control red"></div>
                <div className="control yellow"></div>
                <div className="control green"></div>
              </div>
            </div>
            <div className="browser-address">
              <span>chrome-extension://intent-dashboard</span>
            </div>
            <div className="browser-content dashboard">
              <div className="dashboard-content">
                <div className="dashboard-header">
                  <h2>Your Focus Journey</h2>
                  <p>Building better habits</p>
                </div>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <div className="stat-number">87%</div>
                    <div className="stat-label">Focus</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">12</div>
                    <div className="stat-label">Streak</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">45</div>
                    <div className="stat-label">Goals</div>
                  </div>
                </div>
                <div className="dashboard-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <span>✅ React tutorial</span>
                      <span>2h</span>
                    </div>
                    <div className="activity-item">
                      <span>🔄 Redirected</span>
                      <span>1d</span>
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

  // Check if user has reached the last step
  useEffect(() => {
    if (currentStep === steps.length - 1 && !hasViewedLastStep) {
      setHasViewedLastStep(true);
    }
  }, [currentStep, hasViewedLastStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="onboarding-container">
      <h1 className="onboarding-title">How it works</h1>
      
      <div className="onboarding-carousel">
        <div className="carousel-wrapper">
          {/* Left Arrow */}
          <button 
            className="carousel-arrow carousel-arrow-left"
            onClick={prevStep}
            disabled={currentStep === 0}
            aria-label="Previous step"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Steps Container */}
          <div className="steps-container">
            <div 
              className="steps-wrapper"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              {steps.map((step, index) => (
                <OnboardingStep 
                  key={step.id} 
                  step={step} 
                  isActive={index === currentStep} 
                />
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button 
            className="carousel-arrow carousel-arrow-right"
            onClick={nextStep}
            aria-label="Next step"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="carousel-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => goToStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;