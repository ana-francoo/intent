interface MainProps {
  onBack: () => void
}

export default function Main({ onBack }: MainProps) {
  return (
    <>
      <h1>Main</h1>

      <div className="card">
        <p>This is the main page. Content will be added here in future updates.</p>
      </div>

      <div className="card">
        <button type="button" className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  )
} 