import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WebsiteBlocking from './WebsiteBlocking'
import '@/index.css'

// Mock handlers for standalone page
const handleSave = () => {
  // console.log('Website blocking settings saved');
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebsiteBlocking onSave={handleSave} />
  </StrictMode>,
) 