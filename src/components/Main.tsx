interface MainProps {
  onBack: () => void
}

export default function Main({ onBack }: MainProps) {
  const handleBlockClick = () => {
    onBack(); // This triggers the overlay
    // Close the popup window after a short delay to allow the message to be sent
    setTimeout(() => {
      window.close();
    }, 100);
  };

  return (
    <>
      <h1>Main</h1>

      <div className="card">
        <p>This is the main page. Content will be added here in future updates.</p>
      </div>

      <div className="card">
        <button type="button" className="back-button" onClick={handleBlockClick}>
          Block
        </button>
      </div>
    </>
  )
} 