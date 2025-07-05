import { useState, useEffect } from 'react';
import candle from '@/assets/logo.png';
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
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'new-page' | 'how-it-works' | 'auth' | 'website-blocking' | 'main'>('home');
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
    // Show loading for 1.8s, then fade out and show intro content
    const loadingTimer = setTimeout(() => {
      setFadeOutLoading(true);
      setTimeout(() => setIsLoading(false), 500); // Wait for fade-out animation
    }, 1800);
    const introTimer = setTimeout(() => setShowIntro(false), 1800); // 1.8s for flame animation
    
    return () => {
      clearTimeout(loadingTimer);
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
    return <NewPage onBack={handleBackFromNewPage} onNext={handleFromNewPageToHowItWorks} />;
  }

  if (currentPage === 'how-it-works') {
    return <HowItWorks onBack={handleToNewPage} onNext={handleToAuth} />;
  }

  if (currentPage === 'auth') {
    return <Auth onAuthSuccess={handleToWebsiteBlocking} />;
  }

  if (currentPage === 'website-blocking') {
    return <WebsiteBlocking onBack={handleBackToHowItWorks} onNext={handleToMain} />;
  }

  if (currentPage === 'main') {
    return <>
      {showOverlay && <div className="overlay-film"></div>}
      <Main onBack={handleBackToWebsiteBlocking} />
    </>;
  }

  return (
    <div className="home-root">
      {/* Loading overlay with Candle component */}
      {isLoading && (
        <div className={`loading-overlay${fadeOutLoading ? ' fade-out' : ''}`}>
          <Candle />
        </div>
      )}
      
      <div className={`home-container${showIntro ? ' hidden' : ' visible'}`}>
        <div className="candle-icon-wrapper">
          {!showIntro && <img src={candle} alt="Candle" className="candle-icon" />}
        </div>
        <h1 className="main-title">Ready to reclaim your focus?</h1>
        <p className="subtitle">Follow-through with your intention, distraction-free.</p>
        <div className="card home-card">
          <button className="get-started-btn" type="button" onClick={handleGetStarted}>
            Get Started <span className="arrow">→</span>
          </button>
        </div>
        <div className="login-link">
          <span>Have an account? </span>
          <a href="#" onClick={handleToAuth}>Log in</a>
        </div>
      </div>
    </div>
  );
}
