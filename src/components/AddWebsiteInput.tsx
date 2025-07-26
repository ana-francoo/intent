import React, { useState } from 'react';
import './AddWebsiteInput.css';

interface AddWebsiteInputProps {
  onUrlsChange?: (urls: string[]) => void;
  placeholder?: string;
  showTitle?: boolean;
  className?: string;
  initialUrls?: string[];
  showUrlList?: boolean; // New prop to control whether to show the URL list
}

const AddWebsiteInput: React.FC<AddWebsiteInputProps> = ({
  onUrlsChange,
  placeholder = "threads.net",
  showTitle = true,
  className = "",
  initialUrls = [],
  showUrlList = true // Default to true for backward compatibility
}) => {
  const [customUrls, setCustomUrls] = useState<string[]>(initialUrls);
  const [newUrl, setNewUrl] = useState('');

  const addCustomUrl = () => {
    if (newUrl.trim() && !customUrls.includes(newUrl.trim())) {
      const updatedUrls = [...customUrls, newUrl.trim()];
      setCustomUrls(updatedUrls);
      setNewUrl('');
      onUrlsChange?.(updatedUrls);
    }
  };

  const removeCustomUrl = (index: number) => {
    const updatedUrls = customUrls.filter((_, i) => i !== index);
    setCustomUrls(updatedUrls);
    onUrlsChange?.(updatedUrls);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomUrl();
    }
  };

  return (
    <div className={`add-website-input ${className}`}>
      {showTitle && <h3 className="custom-urls-title">Custom URLs</h3>}
      
      <div className="custom-url-input-container">
        <input
          type="text"
          placeholder={placeholder}
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="custom-url-input"
        />
      </div>
      
      {showUrlList && customUrls.length > 0 && (
        <div className="custom-urls-list">
          {customUrls.map((url, index) => (
            <div key={index} className="custom-url-item">
              <span className="custom-url-text">{url}</span>
              <button
                type="button"
                onClick={() => removeCustomUrl(index)}
                className="remove-url-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddWebsiteInput; 