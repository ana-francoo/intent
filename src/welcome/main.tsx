import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from '@/components/Home'
import '@/popup/index.css'
import '@/popup/App.css'
import '@/components/Home.css'
import '@/components/Flame.css'
import './welcome.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
) 