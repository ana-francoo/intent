import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from '@/components/home/Home'
import '@/index.css'

console.log('Welcome main.tsx loading...');
console.log('Home component:', Home);

console.log('Root element:', document.getElementById('root'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
) 