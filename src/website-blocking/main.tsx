import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WebsiteBlocking from '@/components/WebsiteBlocking'
import '@/popup/index.css'
import '@/popup/App.css'
import './website-blocking.css'

// Mock handlers for standalone page
const handleSave = () => {
  console.log('Website blocking settings saved');
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebsiteBlocking onSave={handleSave} />
  </StrictMode>,
) 