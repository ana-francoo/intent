import { Routes, Route } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Signup from '@/components/auth/Signup'
import PersonalDashboard from '@/components/PersonalDashboard'
import TourDashboard from '@/components/TourDashboard'
import OverlayOne from '@/components/overlayone'
import OverlayTwo from '@/components/overlaytwo'
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
        <Route path="/tour-dashboard" element={<TourDashboard />} />
        <Route path="/overlay-one" element={<OverlayOne />} />
        <Route path="/overlay-two" element={<OverlayTwo />} />
        {/* Back-compat: keep /overlay pointing to overlay-two (mismatch style) */}
        <Route path="/overlay" element={<OverlayTwo />} />
      </Routes>
    </>
  )
}