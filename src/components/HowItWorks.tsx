import crxLogo from '@/assets/crx.svg'

interface HowItWorksProps {
  onBack: () => void
  onNext: () => void
}

export default function HowItWorks({ onBack, onNext }: HowItWorksProps) {
  return (
    <>
     
      <h1>How it works</h1>

      <div className="card">
        <div className="step">
          <h3>1. Set Your Intention</h3>
          <p>When you want to use a potentially distracting site, Intent will prompt you to declare your clear intention.</p>
        </div>
        
        <div className="step">
          <h3>2. Stay Focused</h3>
          <p>Intent monitors your activity and ensures you stay aligned with your declared intention.</p>
        </div>
        
        <div className="step">
          <h3>3. Gentle Reminders</h3>
          <p>If your activity drifts from your intention, Intent gently steps in and reblocks the site to help you refocus.</p>
        </div>
        
        <div className="step">
          <h3>4. Build Better Habits</h3>
          <p>Over time, Intent helps you develop healthier browsing habits and maintain focus on what matters most.</p>
        </div>
      </div>

      <div className="card">
        <button type="button" className="back-button" onClick={onNext}>
          Let's begin
        </button>
      </div>
    </>
  )
} 