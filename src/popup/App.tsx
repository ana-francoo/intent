import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/components/auth/login'
import Signup from '@/components/auth/signup'
import PersonalDashboard from '@/components/PersonalDashboard'
import IntentionOverlay from '@/components/overlay'
import CarouselApp from '@/components/carousel/App'
import Tour from '@/components/tour/Tour'
import Home from '@/components/home/Home'
import PopupLauncher from '@/components/popup-launcher/PopupLauncher'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PopupLauncher />} />
        <Route path="/welcome" element={<Home />} />
        <Route path="/onboarding" element={<CarouselApp />} />
        <Route path="/tour" element={<Tour />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route path="/overlay" element={<IntentionOverlay />} />
        {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
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