import { useState, useEffect } from 'react';
import candle from '@/assets/logo.png';
import logo from '@/assets/logo2.png';
import NewPage from './NewPage';
import HowItWorks from './HowItWorks';
import WebsiteBlocking from './WebsiteBlocking';
import Main from './Main';
import Auth from './Auth';
import { supabase } from '../supabaseClient';
import { triggerOverlay } from '../utils/overlay';
import Candle from './Candle';
import './Candle.css';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Changed to false so Candle appears immediately
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const [showBlackBackground, setShowBlackBackground] = useState(true); // New state for black background
  const [currentPage, setCurrentPage] = useState<
    'home' | 'new-page' | 'how-it-works' | 'auth' | 'website-blocking' | 'main'
  >('home');
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentPage('website-blocking');
    });
  }, []);

  useEffect(() => {
    // Only handle the home content delay, flame appears immediately
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      setShowBlackBackground(false); // Fade out black background when home content appears
    }, 400); // 1.8s for home content

    return () => {
      clearTimeout(introTimer);
    };
  }, []);

  const handleGetStarted = () => {
    setCurrentPage('new-page');
  };

  const handleBackFromNewPage = () => {
    setCurrentPage('home');
  };

  const handleFromNewPageToHowItWorks = () => {
    setCurrentPage('how-it-works');
  };

  const handleToNewPage = () => {
    setCurrentPage('new-page');
  };

  const handleToWebsiteBlocking = () => {
    setCurrentPage('website-blocking');
  };

  const handleBackToHowItWorks = () => {
    setCurrentPage('how-it-works');
  };

  const handleToMain = () => {
    setCurrentPage('main');
  };

  const handleBackToWebsiteBlocking = () => {
    triggerOverlay();
  };

  const handleToAuth = () => setCurrentPage('auth');

  if (currentPage === 'new-page') {
    return (
      <NewPage
        onBack={handleBackFromNewPage}
        onNext={handleFromNewPageToHowItWorks}
      />
    );
  }

  if (currentPage === 'how-it-works') {
    return <HowItWorks onBack={handleToNewPage} onNext={handleToAuth} />;
  }

  if (currentPage === 'auth') {
    return <Auth onAuthSuccess={handleToWebsiteBlocking} />;
  }

  if (currentPage === 'website-blocking') {
    return (
      <WebsiteBlocking onBack={handleBackToHowItWorks} onNext={handleToMain} />
    );
  }

  if (currentPage === 'main') {
    return (
      <>
        {showOverlay && <div className="overlay-film"></div>}
        <Main onBack={handleBackToWebsiteBlocking} />
      </>
    );
  }

  return (
    <div className="home-root">
      {/* Black background overlay */}
      {showBlackBackground && <div className="black-background-overlay"></div>}

      {/* Candle component - always visible */}
      <div className={`candle-container${showIntro ? ' intro-phase' : ''}`}>
        <Candle />
      </div>

      {/* Loading overlay - only for initial black screen */}
      {isLoading && (
        <div
          className={`loading-overlay${fadeOutLoading ? ' fade-out' : ''}`}
        ></div>
      )}

      <div className={`home-container${showIntro ? ' hidden' : ' visible'}`}>
        <div className="candle-icon-wrapper">
          {!showIntro && (
            <img src={logo} alt="Candle" className="candle-icon" />
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
}
