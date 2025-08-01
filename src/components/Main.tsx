import { showReactIntentionOverlay } from '../utils/reactOverlayManager';

export default function Main() {
  const handleBlockClick = () => {
    showReactIntentionOverlay(window.location.href);
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
