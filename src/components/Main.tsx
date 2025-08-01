export default function Main() {
  const handleBlockClick = () => {
    const overlayUrl = chrome.runtime.getURL('src/popup/index.html') + `#/overlay?targetUrl=${encodeURIComponent(window.location.href)}`;
    window.location.href = overlayUrl;
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
