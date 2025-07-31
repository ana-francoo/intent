import Logo from '@/assets/crx.svg'
import { useState, useEffect } from 'react'
import { getTimeRemaining } from '@/utils/intentionManager'
import './App.css'

function App() {
  const [show, setShow] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const toggle = () => setShow(!show)

  useEffect(() => {
    const updateTimer = async () => {
      const remaining = await getTimeRemaining()
      setTimeRemaining(remaining)
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          {timeRemaining > 0 ? (
            <div>
              <h3>Timer Active</h3>
              <p>{formatTime(timeRemaining)} remaining</p>
            </div>
          ) : (
            <p>No active timer</p>
          )}
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  )
}

export default App
