import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import HowItWorks from '@/components/HowItWorks'
import '@/popup/index.css'
import '@/popup/App.css'
import './how-it-works.css'

// Mock handlers for standalone page
const handleLastSlideViewed = () => {
  console.log('Last slide viewed');
};

const handleNext = () => {
  console.log('Next clicked');
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HowItWorks onLastSlideViewed={handleLastSlideViewed} onNext={handleNext} />
  </StrictMode>,
) 