import Logo from '@/assets/crx.svg'
import { useState } from 'react'
import './App.css'

function App() {
  const [show, setShow] = useState(false)
  const toggle = () => setShow(!show)

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div>
            <h3>Intent Extension</h3>
            <p>AI-powered intention monitoring active</p>
          </div>
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  )
}

export default App
