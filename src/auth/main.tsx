import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthComponent from '@/components/Auth'
import '@/popup/index.css'
import '@/popup/App.css'
import './auth.css'

// Mock handlers for standalone page
const handleAuthSuccess = () => {
  console.log('Auth success');
};

const handleGoBack = () => {
  console.log('Go back clicked');
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthComponent 
      onAuthSuccess={handleAuthSuccess} 
      defaultToLogin={true} 
      onGoBack={handleGoBack} 
    />
  </StrictMode>,
) 