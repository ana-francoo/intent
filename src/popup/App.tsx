import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Signup from '@/components/auth/Signup'
import WebsiteBlocking from '@/components/website-blocking/WebsiteBlocking'
import PopoverDashboard from '@/components/main-dashboard/PopoverDashboard'
import PersonalDashboard from '@/components/PersonalDashboard'
import Smoke from '@/components/smoke-test/Smoke'
import IntentionOverlay from '@/components/overlay'
import CarouselApp from '@/components/carousel/App'
import Tour from '@/components/tour/Tour'
import Home from '@/components/home/Home'

export default function App() {
  const navigate = useNavigate();
  
  const handleAuthSuccess = () => {
    const isExtensionContext = typeof chrome !== 'undefined' && !!chrome.runtime?.id && location.href.includes('src/popup/index.html');
    if (isExtensionContext) {
      navigate('/');
    } else {
      try {
        chrome.runtime?.sendMessage?.({ type: 'OPEN_POPUP_WITH_ROUTE', route: '/' });
      } catch {
      }
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<PersonalDashboard />} />
        <Route path="/welcome" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/onboarding" element={<CarouselApp />} />
        <Route path="/tour" element={<Tour />} />
        <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/signup" element={<Signup onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/auth" element={<Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/website-blocking" element={<WebsiteBlocking onSave={() => {}} />} />
        <Route path="/main" element={<PopoverDashboard />} />
        <Route path="/smoke-test" element={<Smoke />} />
        <Route path="/overlay" element={<IntentionOverlay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}