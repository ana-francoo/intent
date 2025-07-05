import { triggerOverlay } from '../utils/overlay';

export default function Main() {
  const handleBlockClick = () => {
    triggerOverlay();
    // Close the popup window after a short delay to allow the message to be sent
    setTimeout(() => {
      window.close();
    }, 100);
  };

  return (
    <>
      <h1>Main</h1>

      <div className="card">
        <p>
          This is the main page. Content will be added here in future updates.
        </p>
      </div>

      <div className="card">
        <button type="button" onClick={handleBlockClick}>
          Block
        </button>
      </div>
    </>
  );
}
