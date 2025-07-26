import { useState, useEffect } from 'react';
import logo from '@/assets/logo2.png';
import HowItWorks from './HowItWorks';
import WebsiteBlocking from './WebsiteBlocking';
import PopoverDashboard from './PopoverDashboard';
import Main from './Main';
import AuthComponent from './Auth';
import { supabase } from '../supabaseClient';
import { triggerOverlay } from '../utils/overlay';
import Flame from './Flame';
import './Flame.css';
import './Home.css';
import '../popup/App.css';

const PAGES = {
  home: 0,
  'how-it-works': 1,
  auth: 2,
  'website-blocking': 3,
  main: 4,
} as const;

const PAGE_NAMES = Object.keys(PAGES) as Array<keyof typeof PAGES>;

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const [showBlackBackground, setShowBlackBackground] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(PAGES.home);
  const [showOverlay, setShowOverlay] = useState(false);
  const [cameFromHowItWorks, setCameFromHowItWorks] = useState(false);
  const [hasViewedLastSlide, setHasViewedLastSlide] = useState(false);
  const [cameFromLogin, setCameFromLogin] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const currentPage = PAGE_NAMES[currentPageIndex];

  const setCurrentPage = (pageName: keyof typeof PAGES) => {
    setCurrentPageIndex(PAGES[pageName]);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageIndex]);

  // Enhanced auth state management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      
      // If user is authenticated, go to dashboard
      if (session) {
        setCurrentPage('main');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setAuthLoading(false);
      
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, go to dashboard
        setCurrentPage('main');
      } else if (event === 'SIGNED_OUT') {
        // User signed out, go to home
        setCurrentPage('home');
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
      triggerOverlay();
    } else {
      setCurrentPageIndex((prev: number) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (currentPage === 'how-it-works') {
      setCameFromHowItWorks(true);
    }
    setCurrentPageIndex((prev: number) =>
      Math.min(PAGE_NAMES.length - 1, prev + 1)
    );
  };

  const handleGetStarted = () => {
    setCurrentPage('how-it-works');
  };

  const handleToAuth = () => {
    setCameFromHowItWorks(false);
    setCameFromLogin(true);
    setCurrentPage('auth');
  };

  const handleWebsiteBlockingSave = () => {
    setCurrentPage('main');
  };

  const handleLastSlideViewed = () => {
    setHasViewedLastSlide(true);
  };

  const handleHowItWorksNext = () => {
    setCameFromHowItWorks(true);
    setCameFromLogin(false);
    setCurrentPage('auth');
  };

  const handleGoBackToHome = () => {
    setCurrentPage('home');
    setCameFromLogin(false);
  };

  const getNavigationButtons = () => {
    if (currentPageIndex === 0) return null;

    if (currentPage === 'auth') return null;

    // Hide navigation buttons for how-it-works page since it has its own carousel navigation
    if (currentPage === 'how-it-works') return null;

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
            {isLoading && (
              <div
                className={`loading-overlay${
                  fadeOutLoading ? ' fade-out' : ''
                }`}
              ></div>
            )}
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
      case 'how-it-works':
        return <HowItWorks onLastSlideViewed={handleLastSlideViewed} onNext={handleHowItWorksNext} />;
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

  return (
    <div>
      {renderCurrentPage()}
      {getNavigationButtons()}
    </div>
  );
}
