import { useState } from 'react';
import { saveBlockedSites } from '../../utils/storage';
import AddWebsiteInput from '../AddWebsiteInput';
import './WebsiteBlocking.css';

interface WebsiteOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  selected: boolean;
}

interface WebsiteBlockingProps {
  onSave: () => void;
}

export default function WebsiteBlocking({ onSave }: WebsiteBlockingProps) {
  const [selectedWebsites, setSelectedWebsites] = useState<WebsiteOption[]>([
    { 
      id: 'youtube', 
      name: 'YouTube', 
      icon: '▶️', 
      color: '#ffffff',
      backgroundColor: '#FF0000',
      selected: false 
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: '📷', 
      color: '#ffffff',
      backgroundColor: '#E4405F',
      selected: false 
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: '✖️', 
      color: '#ffffff',
      backgroundColor: '#000000',
      selected: false 
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: '💼', 
      color: '#ffffff',
      backgroundColor: '#0077B5',
      selected: false 
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: 'f', 
      color: '#ffffff',
      backgroundColor: '#1877F2',
      selected: false 
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: '🎵', 
      color: '#ffffff',
      backgroundColor: '#000000',
      selected: false 
    },
    { 
      id: 'reddit', 
      name: 'Reddit', 
      icon: '🤖', 
      color: '#ffffff',
      backgroundColor: '#FF4500',
      selected: false 
    },
  ]);

  const [customUrls, setCustomUrls] = useState<string[]>([]);

  const toggleWebsite = (id: string) => {
    setSelectedWebsites((prev) =>
      prev.map((site) =>
        site.id === id ? { ...site, selected: !site.selected } : site
      )
    );
  };

  const handleCustomUrlsChange = (urls: string[]) => {
    setCustomUrls(urls);
  };

  const handleSave = async () => {
    try {
      const blockedUrls: string[] = [];

      selectedWebsites.forEach((website) => {
        if (website.selected) {
          const urlMap: { [key: string]: string } = {
            instagram: 'https://instagram.com',
            youtube: 'https://youtube.com',
            linkedin: 'https://linkedin.com',
            tiktok: 'https://tiktok.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com',
            reddit: 'https://reddit.com',
          };

          if (urlMap[website.id]) {
            blockedUrls.push(urlMap[website.id]);
          }
        }
      });

      blockedUrls.push(...customUrls);

      if (blockedUrls.length > 0) {
        await saveBlockedSites(blockedUrls);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save blocked sites:', error);
      onSave();
    }
  };

  return (
    <div className="website-blocking-container">
      <div className="website-blocking-content">
        <h1 className="website-blocking-title">
          What websites would you like to block?
        </h1>

        <div className="websites-list">
          {selectedWebsites.map((website) => (
            <div
              key={website.id}
              className="website-item"
              onClick={() => toggleWebsite(website.id)}
            >
              <div className="website-left">
                <div 
                  className="website-icon" 
                  style={{ 
                    backgroundColor: website.backgroundColor,
                    color: website.color 
                  }}
                >
                  {website.icon}
                </div>
                <span className="website-name">{website.name}</span>
              </div>
              <div className="website-toggle">
                <input
                  type="checkbox"
                  checked={website.selected}
                  onChange={() => toggleWebsite(website.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="toggle-checkbox"
                />
                <div className="toggle-slider"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="custom-urls-section">
          <AddWebsiteInput
            onUrlsChange={handleCustomUrlsChange}
            placeholder="threads.net"
            showTitle={true}
            className=""
            initialUrls={customUrls}
          />
        </div>

        <button 
          type="button" 
          onClick={handleSave}
          className="finish-adding-btn"
        >
          Finish adding
        </button>
      </div>
    </div>
  );
}
