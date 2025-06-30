import { useState, useEffect } from 'react'
import crxLogo from '@/assets/crx.svg'
import HowItWorks from './HowItWorks'
import WebsiteBlocking from './WebsiteBlocking'
import Main from './Main'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'how-it-works' | 'website-blocking' | 'main'>('home')

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  const handleGetStarted = () => {
    setCurrentPage('how-it-works')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  const handleToWebsiteBlocking = () => {
    setCurrentPage('website-blocking')
  }

  const handleBackToHowItWorks = () => {
    setCurrentPage('how-it-works')
  }

  const handleToMain = () => {
    setCurrentPage('main')
  }

  const handleBackToWebsiteBlocking = () => {
    setCurrentPage('website-blocking')
  }

  if (currentPage === 'how-it-works') {
    return <HowItWorks onBack={handleBackToHome} onNext={handleToWebsiteBlocking} />
  }

  if (currentPage === 'website-blocking') {
    return <WebsiteBlocking onBack={handleBackToHowItWorks} onNext={handleToMain} />
  }

  if (currentPage === 'main') {
    return <Main onBack={handleBackToWebsiteBlocking} />
  }

  return (
    <>
    <div>
      <a href="https://crxjs.dev/vite-plugin" target="_blank" rel="noreferrer">
        <img src={crxLogo} className="logo crx" alt="crx logo" />
      </a>
    </div>

      <h1>Ensure distraction-free execution of your intention</h1>

      <p className="description">
      Intent empowers you to follow through on your intention without distraction. Originally opened youtube as an educational resources, and ended up in reels? Changed tabs to search something up and ended up in instagram, or reading the news? Intent blocks distracting sites by default, which can be unlocked by prompting you to declare a clear intention of use. If your activity misaligns from your intention, Intent gently steps in and reblocks the site, helping you stay aligned with what you set out to do.
      </p>

      <div className="card">
        <button type="button" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </>
  )
}
