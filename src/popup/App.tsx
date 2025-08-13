import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Signup from '@/components/auth/Signup'
import PersonalDashboard from '@/components/PersonalDashboard'
import IntentionOverlay from '@/components/overlay'
import CarouselApp from '@/components/carousel/App'
import Tour from '@/components/tour/Tour'
import Home from '@/components/home/Home'
import { createFloatingPopup } from '@/utils/floatingPopup'

export default function App() {
  const navigate = useNavigate();
  
  const handleAuthSuccess = () => {
    const isInsideIframe = window.parent !== window;
    if (isInsideIframe) {
      console.log('[App] Already inside floating popup iframe, just navigating');
      navigate('/dashboard');
      return;
    }
    
    const isExtensionContext = typeof chrome !== 'undefined' && !!chrome.runtime?.id && location.href.includes('src/popup/index.html');
    
    if (isExtensionContext) {
      chrome.windows?.getCurrent((window) => {
        const isTab = window.type === 'normal';
        
        if (isTab) {
          createFloatingPopup({ route: '/dashboard', draggable: true });
        } else {
          navigate('/dashboard');
        }
      });
    } else {
      try {
        chrome.runtime?.sendMessage?.({ type: 'OPEN_POPUP_WITH_ROUTE', route: '/dashboard' });
      } catch {
      }
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/welcome" element={<Home />} />
        <Route path="/onboarding" element={<CarouselApp />} />
        <Route path="/tour" element={<Tour />} />
        <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/signup" element={<Signup onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route path="/overlay" element={<IntentionOverlay />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        {/* I don't think these routes are being used, confirming before can be removed */}
        {/* <Route path="/home" element={<Home />} /> */}
        {/* <Route path="/auth" element={<Login onAuthSuccess={handleAuthSuccess} />} /> */}
        {/* <Route path="/website-blocking" element={<WebsiteBlocking onSave={() => {}} />} /> */}
        {/* <Route path="/main" element={<PopoverDashboard />} /> */}
        {/* <Route path="/smoke-test" element={<Smoke />} /> */}
      </Routes>
    </>
  )
}