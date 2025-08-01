import { useState, useEffect } from 'react';
import logo from '@/assets/logo2.png';
import WebsiteBlocking from '@/components/website-blocking/WebsiteBlocking';
import PopoverDashboard from '@/components/main-dashboard/PopoverDashboard';

import AuthComponent from '@/components/auth/Auth';
import ExpiredAccess from '@/components/expired-access/ExpiredAccess';
import { supabase } from '../../supabaseClient';
import { showReactIntentionOverlay } from '../../utils/reactOverlayManager';
import { getSubscriptionStatus, SubscriptionStatus } from '../../utils/subscription';
import Flame from './Flame';
import './Flame.css';
import './Home.css';
import App from '@/components/carousel/App.tsx'

const PAGES = {
  home: 0,
  auth: 1,
  'website-blocking': 2,
  main: 3,
} as const;

const PAGE_NAMES = Object.keys(PAGES) as Array<keyof typeof PAGES>;

export default function Home() {
  console.log('Home component rendering...');
  
  const [showIntro, setShowIntro] = useState(true);
  const [showBlackBackground, setShowBlackBackground] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(PAGES.home);
  const [cameFromLogin, setCameFromLogin] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showExpiredAccess, setShowExpiredAccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);


  const currentPage = PAGE_NAMES[currentPageIndex];

  const setCurrentPage = (pageName: keyof typeof PAGES) => {
    setCurrentPageIndex(PAGES[pageName]);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageIndex]);

  // Enhanced auth state management
  useEffect(() => {
    // DEVELOPMENT: Auto-login for testing
    const autoLogin = async () => {
      try {
        // Try to sign in with a test account
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'testpassword123'
        });
        
        if (error) {
          console.log('Auto-login failed, continuing as guest:', error.message);
          setAuthLoading(false);
          return;
        }
        
        console.log('Auto-login successful');
        setSession(data.session);
        setAuthLoading(false);
        
        // Go directly to main dashboard
        setCurrentPage('main');
      } catch (error) {
        console.log('Auto-login error:', error);
        setAuthLoading(false);
      }
    };

    // Run auto-login
    autoLogin();

    // Listen for auth changes (simplified for development)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      setAuthLoading(false);
      
      if (event === 'SIGNED_IN' && session) {
        // Go directly to main dashboard
        setCurrentPage('main');
      } else if (event === 'SIGNED_OUT') {
        // Try auto-login again
        autoLogin();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      setShowBlackBackground(false);
    }, 400);

    return () => {
      clearTimeout(introTimer);
    };
  }, []);

  const handleBack = () => {
    if (currentPage === 'main') {
      showReactIntentionOverlay(window.location.href);
    } else {
      setCurrentPageIndex((prev: number) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    setCurrentPageIndex((prev: number) =>
      Math.min(PAGE_NAMES.length - 1, prev + 1)
    );
  };

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  const handleToAuth = () => {
    setCameFromLogin(true);
    setCurrentPage('auth');
  };

  const handleWebsiteBlockingSave = () => {
    setCurrentPage('main');
  };

  const handleCloseExpiredAccess = () => {
    setShowExpiredAccess(false);
    // Allow trial users to continue for now
    if (subscriptionStatus?.isTrialActive) {
      setCurrentPage('main');
    }
  };

  // Check subscription status periodically for logged-in users
  useEffect(() => {
    if (!session) return;

    const checkSubscription = async () => {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      // TEMPORARILY DISABLED: Expired trial functionality
      // Show expired access if trial ended and no active subscription
      // if (!status.hasAccess && !showExpiredAccess) {
      //   setShowExpiredAccess(true);
      // }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session, showExpiredAccess]);

  const handleGoBackToHome = () => {
    setCurrentPage('home');
    setCameFromLogin(false);
  };

  const getNavigationButtons = () => {
    if (currentPageIndex === 0) return null;

    // Hide navigation buttons for auth page since it has its own navigation
    if (currentPage === 'auth') return null;

    // Hide next button on website-blocking page since it has its own "Finish adding" button
    if (currentPage === 'website-blocking') return null;

    // Hide navigation on main page (dashboard)
    if (currentPage === 'main') return null;

    const showBack = true;
    const showNext = currentPageIndex < PAGE_NAMES.length - 1;

    return (
      <div className="card">
        {showBack && (
          <button type="button" className="nav-button" onClick={handleBack}>
            Back
          </button>
        )}
        {showNext && (
          <button type="button" className="nav-button" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    );
  };

  // Show loading while checking auth state
  if (authLoading) {
    console.log('Showing loading state...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--background, #1a1a1a)',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }



  const renderCurrentPage = () => {
    console.log('Rendering current page:', currentPage);
    switch (currentPage) {
      case 'home':
        return (
          <div className="home-root">
            {showBlackBackground && (
              <div className="black-background-overlay"></div>
            )}
            <div
              className={`flame-container${showIntro ? ' intro-phase' : ''}`}
            >
              <Flame />
            </div>

            <div
              className={`home-container${showIntro ? ' hidden' : ' visible'}`}
            >
              <div className="flame-icon-wrapper">
                {!showIntro && (
                  <img src={logo} alt="flame" className="flame-icon" />
                )}
              </div>
              <h1 className="main-title">Ready to reclaim your focus?</h1>
              <p className="subtitle">
                Follow-through with your intention, distraction-free.
              </p>
              <div className="card home-card">
                <button
                  className="get-started-btn"
                  type="button"
                  onClick={handleGetStarted}
                >
                  <span className="btn-text">I'm Ready</span>
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
              </div>
              <div className="login-link">
                <span>Have an account? </span>
                <a href="#" onClick={handleToAuth}>
                  Log in
                </a>
              </div>
            </div>
          </div>
        );
      case 'auth':
        return <AuthComponent onAuthSuccess={() => {}} defaultToLogin={cameFromLogin} onGoBack={handleGoBackToHome} />;
      case 'website-blocking':
        return <WebsiteBlocking onSave={handleWebsiteBlockingSave} />;
      case 'main':
        return <PopoverDashboard />;
      default:
        return null;
    }
  };

  // Show onboarding component when requested
  if (showOnboarding) {
    console.log('Showing onboarding component...');
    return (
      <div className="carousel-fullscreen" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'var(--background, #171717)',
        width: '100vw',
        height: '100vh'
      }}>
        <App />
      </div>
    );
  }

  console.log('Home component final render - currentPage:', currentPage, 'showOnboarding:', showOnboarding);
  
  return (
    <div>
      {renderCurrentPage()}
      {getNavigationButtons()}
      
      {/* Show expired access overlay when needed */}
      {showExpiredAccess && subscriptionStatus && (
        <ExpiredAccess
          daysRemaining={subscriptionStatus.daysRemaining}
          planType={subscriptionStatus.planType}
          onClose={subscriptionStatus.planType !== 'expired' ? handleCloseExpiredAccess : undefined}
        />
      )}
    </div>
  );
}
