import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import smokeImage from '../assets/smoke5.png'
import smokeCloud from '../assets/smoke5.png'
import './Smoke.css'

const SmokeTest = () => {
  return (
    <div className="cup-wrap">
      <div className="smoke-wrap">
        <img className="smoke" src={smokeImage} alt="smoke" />
      </div>
      <div className="smoke-wrap">
        <img className="smoke" src={smokeCloud} alt="smoke" />
      </div>
      <div className="smoke-wrap">
        <img className="smoke" src={smokeImage} alt="smoke" />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem',
      background: '#171717',
      color: 'white'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Smoke Animation Test</h1>
      <SmokeTest />
    </div>
  </StrictMode>,
)