import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from '@/components/home/Home'
import Auth from '@/components/auth/Auth'
import CarouselApp from '@/components/carousel/App'
import WebsiteBlocking from '@/components/website-blocking/WebsiteBlocking'
import Smoke from '@/components/smoke-test/Smoke'
import './App.css'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for pending route from background script
    chrome.storage.local.get('pendingRoute', (result) => {
      if (result.pendingRoute) {
        navigate(result.pendingRoute)
        // Clear the pending route
        chrome.storage.local.remove('pendingRoute')
      }
    })
  }, [navigate])

  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth onAuthSuccess={() => {}} />} />
        <Route path="/welcome" element={<Home />} />
        <Route path="/how-it-works" element={<CarouselApp />} />
        <Route path="/website-blocking" element={<WebsiteBlocking onSave={() => {}} />} />
        <Route path="/smoke-test" element={<Smoke />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}