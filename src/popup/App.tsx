import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/components/home/Home'
import Auth from '@/components/auth/Auth'
import WebsiteBlocking from '@/components/website-blocking/WebsiteBlocking'
import PopoverDashboard from '@/components/main-dashboard/PopoverDashboard'
import Smoke from '@/components/smoke-test/Smoke'
import IntentionOverlay from '@/components/overlay'
import CarouselApp from '@/components/carousel/App'

export default function App() {
  return (
    <Routes>
        <Route path="/" element={<PopoverDashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/onboarding" element={<CarouselApp />} />
        <Route path="/auth" element={<Auth onAuthSuccess={() => {}} />} />
        <Route path="/website-blocking" element={<WebsiteBlocking onSave={() => {}} />} />
        <Route path="/main" element={<PopoverDashboard />} />
        <Route path="/smoke-test" element={<Smoke />} />
        <Route path="/overlay" element={<IntentionOverlay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}